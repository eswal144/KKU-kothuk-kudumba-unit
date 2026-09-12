const express = require('express');
const router = express.Router();
const kkuController = require('../controllers/kkuController');

// Health Check
router.get('/health', kkuController.healthCheck);

// Member Lookup Routes (reads from mosquito_profiles)
router.get('/members', kkuController.getAllMembers);
router.get('/members/:kkuNumber', kkuController.getMemberByNumber);

// Jobs Routes
router.get('/jobs', kkuController.getJobs);
router.post('/jobs', kkuController.createJob);

module.exports = router;
