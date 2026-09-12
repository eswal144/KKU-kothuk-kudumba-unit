const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const rechargeService = require('../services/rechargeService');

/**
 * GET /api/recharge/status
 * Fetch current saliva reserve status for authenticated mosquito
 */
router.get('/recharge/status', authMiddleware, (req, res) => {
  rechargeService.getRechargeStatus(req.user.id, (err, status) => {
    if (err) {
      return res.status(500).json({ error: err.message || 'Could not fetch recharge status.' });
    }
    res.json(status);
  });
});

/**
 * POST /api/recharge
 * Restore saliva reserve for authenticated mosquito (Supports category choice: ADULT / CHILD)
 */
router.post('/recharge', authMiddleware, (req, res) => {
  const requestedCategory = req.body?.category; // 'ADULT' | 'CHILD'
  rechargeService.rechargeMosquito(req.user.id, requestedCategory, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message || 'Saliva recharge failed.' });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        status: result.status
      });
    }

    res.json(result);
  });
});

/**
 * GET /api/recharge/history
 * Fetch recharge activity notifications
 */
router.get('/recharge/history', authMiddleware, (req, res) => {
  rechargeService.getRechargeHistory(req.user.id, (err, history) => {
    if (err) {
      return res.status(500).json({ error: err.message || 'Could not fetch recharge history.' });
    }
    res.json({ history });
  });
});

module.exports = router;
