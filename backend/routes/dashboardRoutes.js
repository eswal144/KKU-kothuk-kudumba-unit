const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Authenticated Mosquito Profile & Location
router.get('/mosquito/profile', authMiddleware, dashboardController.getProfile);
router.get('/mosquito/location', authMiddleware, dashboardController.getLocation);

// Public / Ecosystem Population & Events
router.get('/population/overview', dashboardController.getPopulationOverview);
router.get('/population/events', dashboardController.getPopulationEvents);

// Authenticated Citizen Widgets
router.get('/jobs/my', authMiddleware, dashboardController.getMyJob);
router.get('/bank/summary', authMiddleware, dashboardController.getBankSummary);
router.get('/care/status', authMiddleware, dashboardController.getHealthStatus);
router.get('/social/notifications', authMiddleware, dashboardController.getSocialNotifications);

// Public / System Alerts & Leaderboards
router.get('/migration/alerts', dashboardController.getMigrationAlerts);
router.get('/leaderboard', dashboardController.getLeaderboard);
router.get('/alerts', dashboardController.getAlerts);

module.exports = router;
