const express = require('express');
const router = express.Router();
const populationController = require('../controllers/populationController');

// GET /api/population/overview
router.get('/population/overview', populationController.getOverview);

// POST /api/population/birth
router.post('/population/birth', populationController.addBirth);

// POST /api/population/death
router.post('/population/death', populationController.addDeath);

module.exports = router;
