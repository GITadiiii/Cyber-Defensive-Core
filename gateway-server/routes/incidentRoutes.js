const express = require('express');
const router = express.Router();
const {
    createIncident,
    getIncidentById,
    getAllIncidents,
    createUrlCheck,
    updateIncidentCase
} = require('../controllers/incidentController');
const verifyOfficer = require('../middleware/verifyOfficer');
router.post('/incident', createIncident);
router.post('/url-check', createUrlCheck);
router.get('/incident/:id', verifyOfficer, getIncidentById);
router.get('/incidents', verifyOfficer, getAllIncidents);
router.patch('/incident/:id', verifyOfficer, updateIncidentCase);
module.exports = router;