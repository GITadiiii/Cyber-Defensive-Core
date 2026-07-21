const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    session_uuid: { type: String, required: true, unique: true },
    citizen_phone_hash: { type: String, required: true },
    incidentType: { type: String, enum: ['deepfake', 'mule', 'voice', 'currency', 'url_phishing'], required: true },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    threat_scores: {
        deepfake_score: { type: Number, default: 0 },
        voice_spoof_score: { type: Number, default: 0 },
        psychological_script_score: { type: Number, default: 0 },
        network_velocity_score: { type: Number, default: 0 },
        psti_composite: { type: Number, default: 0 }
    },
    verdict_state: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    flagged_url: { type: String },
    detection_reason: { type: String },
    report_count: { type: Number, default: 1 },
    evidence_report_hash: { type: String },
    case_status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'], default: 'OPEN' },
    assigned_officer: { type: String, default: null },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incident', IncidentSchema);