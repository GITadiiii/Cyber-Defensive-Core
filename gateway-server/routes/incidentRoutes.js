const express = require('express');
const router = express.Router();
const {
    createIncident,
    getIncidentById,
    getAllIncidents
} = require('../controllers/incidentController');

router.post('/incident', createIncident);
router.get('/incident/:id', getIncidentById);
router.get('/incidents', getAllIncidents);

module.exports = router;