const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const authMiddleware = require('../middleware/authMiddleware');

// Public Bank Telemetry & Leaderboard
router.get('/overview', bankController.getOverview);
router.get('/transactions', bankController.getTransactions);
router.get('/top-donors', bankController.getTopDonors);

// Authenticated Mosquito Donor Endpoints
router.get('/my-donation-status', authMiddleware, bankController.getMyDonationStatus);
router.post('/donate', authMiddleware, bankController.donate);

module.exports = router;
