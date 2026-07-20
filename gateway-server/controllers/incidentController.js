const Incident = require('../models/Incident');
const axios = require('axios');

// POST /api/v1/incident
const createIncident = async (req, res) => {
    try {
        const { session_uuid, citizen_phone_hash, incidentType, location, filePath } = req.body;

        if (!session_uuid || !citizen_phone_hash || !incidentType) {
            return res.status(400).json({ error: "Missing required fields: session_uuid, citizen_phone_hash, incidentType" });
        }

        // 1. Call Aditi's AI service for deepfake/voice/currency scores
        let aiResponse;
        try {
            aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/v1/ai/analyze/${incidentType}`, req.body);
        } catch (err) {
            return res.status(503).json({ error: "AI Compute Service unreachable", details: err.message });
        }

        // 2. Call Khushboo's Graph Analytics service for network/velocity score
        let graphResponse;
        try {
            graphResponse = await axios.post(`${process.env.GRAPH_SERVICE_URL}/api/v1/graph/analyze`, req.body);
        } catch (err) {
            return res.status(503).json({ error: "Graph Analytics Service unreachable", details: err.message });
        }

        // 3. Extract real scores from downstream responses
        const deepfake_score = aiResponse.data.confidence ?? aiResponse.data.confidenceScore ?? 0;
        const voice_spoof_score = aiResponse.data.voiceSpoofScore ?? 0;
        const psychological_script_score = aiResponse.data.scriptScore ?? 0;
        const network_velocity_score = graphResponse.data.lviScore ?? 0;

        // 4. Compute psti_composite (weighted average of real scores)
        const psti_composite = Math.round(
            (deepfake_score * 0.3) +
            (voice_spoof_score * 0.2) +
            (psychological_script_score * 0.2) +
            (network_velocity_score * 0.3)
        );

        // 5. Decide verdict_state from psti_composite
        let verdict_state = 'LOW';
        if (psti_composite > 81) verdict_state = 'CRITICAL';
        else if (psti_composite > 60) verdict_state = 'HIGH';
        else if (psti_composite > 30) verdict_state = 'MEDIUM';

        // 6. Save to MongoDB
        const incident = new Incident({
            session_uuid,
            citizen_phone_hash,
            incidentType,
            location,
            threat_scores: {
                deepfake_score,
                voice_spoof_score,
                psychological_script_score,
                network_velocity_score,
                psti_composite
            },
            verdict_state
        });

        await incident.save();

        // 7. Emit threat-broadcast if critical
        // Payload shape: { session_uuid, incidentType, psti_composite, verdict_state, location, timestamp }
        if (psti_composite > 81) {
            const io = req.app.get('io');
            io.emit('threat-broadcast', {
                session_uuid,
                incidentType,
                psti_composite,
                verdict_state,
                location,
                timestamp: incident.timestamp
            });
        }

        return res.status(201).json(incident);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// GET /api/v1/incident/:id
const getIncidentById = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ error: "Incident not found" });
        }
        return res.status(200).json(incident);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// GET /api/v1/incidents
const getAllIncidents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const incidents = await Incident.find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Incident.countDocuments();

        return res.status(200).json({
            data: incidents,
            page,
            totalPages: Math.ceil(total / limit),
            totalIncidents: total
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
// POST /api/v1/url-check
const createUrlCheck = async (req, res) => {
    try {
        const { url, reason, detectedAt } = req.body;

        if (!url || !reason) {
            return res.status(400).json({ error: "Missing required fields: url, reason" });
        }

        let incident = await Incident.findOne({ flagged_url: url, incidentType: 'url_phishing' });

        if (incident) {
            incident.report_count += 1;
            await incident.save();
        } else {
            incident = new Incident({
                session_uuid: `url-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                citizen_phone_hash: "browser-extension",
                incidentType: 'url_phishing',
                flagged_url: url,
                detection_reason: reason,
                threat_scores: { psti_composite: 50 },
                verdict_state: 'MEDIUM',
                timestamp: detectedAt || Date.now()
            });
            await incident.save();
        }

        if (incident.report_count >= 3) {
            incident.verdict_state = 'CRITICAL';
            incident.threat_scores.psti_composite = 85;
            await incident.save();

            const io = req.app.get('io');
            io.emit('threat-broadcast', {
                session_uuid: incident.session_uuid,
                incidentType: 'url_phishing',
                psti_composite: incident.threat_scores.psti_composite,
                verdict_state: incident.verdict_state,
                location: null,
                timestamp: incident.timestamp
            });
        }

        return res.status(201).json(incident);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

module.exports = { createIncident, getIncidentById, getAllIncidents, createUrlCheck };