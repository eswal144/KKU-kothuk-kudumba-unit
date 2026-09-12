const bankService = require('../services/bankService');

// 1. GET /api/bank/overview
exports.getOverview = async (req, res) => {
  try {
    const overview = await bankService.getBankOverview();
    res.json(overview);
  } catch (err) {
    console.error('Error fetching bank overview:', err);
    res.status(500).json({ error: 'Failed to retrieve blood bank reserves overview.' });
  }
};

// 2. GET /api/bank/transactions
exports.getTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const transactions = await bankService.getTransactions(limit);
    res.json({ transactions });
  } catch (err) {
    console.error('Error fetching bank transactions:', err);
    res.status(500).json({ error: 'Failed to retrieve bank transactions.' });
  }
};

// 3. GET /api/bank/my-donation-status (JWT Protected)
exports.getMyDonationStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User identity could not be verified from token.' });
    }
    const status = await bankService.getMyDonationStatus(userId);
    res.json(status);
  } catch (err) {
    console.error('Error fetching donation status:', err);
    res.status(500).json({ error: 'Failed to retrieve donor profile.' });
  }
};

// 4. POST /api/bank/donate (JWT Protected)
exports.donate = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User identity could not be verified from token.' });
    }
    const { amountMl } = req.body;
    if (!amountMl || parseFloat(amountMl) <= 0) {
      return res.status(400).json({ error: 'Please provide a valid blood donation amount in mL.' });
    }

    const result = await bankService.addDonation(userId, amountMl);
    res.json(result);
  } catch (err) {
    console.error('Error processing blood donation:', err);
    res.status(400).json({ error: err.message || 'Failed to process blood donation.' });
  }
};

// 5. GET /api/bank/top-donors
exports.getTopDonors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const topDonors = await bankService.getTopDonors(limit);
    res.json({ topDonors });
  } catch (err) {
    console.error('Error fetching top donors:', err);
    res.status(500).json({ error: 'Failed to retrieve donor leaderboard.' });
  }
};
