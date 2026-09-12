const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

// GET /api/simulation/status
router.get('/simulation/status', simulationController.getStatus);

// POST /api/simulation/run
router.post('/simulation/run', simulationController.runTick);

// GET /api/events
router.get('/events', simulationController.getEvents);

module.exports = router;
