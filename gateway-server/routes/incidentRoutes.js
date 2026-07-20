const express = require('express');
const router = express.Router();
const {
    createIncident,
    getIncidentById,
    getAllIncidents,
    createUrlCheck
} = require('../controllers/incidentController');

router.post('/incident', createIncident);
router.post('/url-check', createUrlCheck);
router.get('/incident/:id', getIncidentById);
router.get('/incidents', getAllIncidents);

module.exports = router;