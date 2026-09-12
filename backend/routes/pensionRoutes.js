const express = require('express');
const router = express.Router();
const pensionController = require('../controllers/pensionController');
const authMiddleware = require('../middleware/authMiddleware');

// All pension endpoints require JWT authentication (Requirement 15)
router.get('/status', authMiddleware, pensionController.getPensionStatus);
router.get('/records', authMiddleware, pensionController.getPensionRecords);
router.get('/application', authMiddleware, pensionController.getCurrentApplication);
router.post('/apply', authMiddleware, pensionController.applyForPension);

module.exports = router;
