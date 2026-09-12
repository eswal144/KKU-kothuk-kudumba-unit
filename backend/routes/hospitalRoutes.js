const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const authMiddleware = require('../middleware/authMiddleware');

// Public Healthcare Data & Telemetry
router.get('/overview', hospitalController.getOverview);
router.get('/patients', hospitalController.getPatients);
router.get('/events', hospitalController.getEvents);
router.get('/blood-reserve', hospitalController.getBloodReserve);

// Authenticated Patient Admission / Check-up
router.post('/admit', authMiddleware, hospitalController.admitCitizen);

module.exports = router;
