const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

// Map Data endpoints
router.get('/map/data', mapController.getMapData);
router.get('/map/demand-data', mapController.getDemandMapData);
router.post('/map/demand/apply', mapController.applyForVacancy);

module.exports = router;

