const pensionService = require('../services/pensionService');

// Helper to get userId from req.user
function getUserId(req) {
  return req.user?.id || req.user?.userId;
}

// 1. GET /api/pension/status
exports.getPensionStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Mosquito citizen identification missing.' });
    }

    const status = await pensionService.getPensionStatus(userId);
    res.json(status);
  } catch (err) {
    console.error('Error fetching pension status:', err);
    res.status(500).json({ error: 'Failed to retrieve citizen pension telemetry: ' + err.message });
  }
};

// 2. GET /api/pension/records
exports.getPensionRecords = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Citizen identification missing.' });
    }

    const records = await pensionService.getPensionRecords(userId);
    res.json({ records });
  } catch (err) {
    console.error('Error fetching pension records:', err);
    res.status(500).json({ error: 'Failed to retrieve pension history records: ' + err.message });
  }
};

// 3. GET /api/pension/application
exports.getCurrentApplication = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Citizen identification missing.' });
    }

    const application = await pensionService.getCurrentApplication(userId);
    res.json({ application });
  } catch (err) {
    console.error('Error fetching current pension application:', err);
    res.status(500).json({ error: 'Failed to retrieve application status: ' + err.message });
  }
};

// 4. POST /api/pension/apply
exports.applyForPension = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Citizen identification missing.' });
    }

    const { category, reason } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'Pension category selection is mandatory.' });
    }

    const result = await pensionService.submitApplication(userId, category, reason);
    res.status(201).json({
      success: true,
      message: 'Pension application submitted successfully and queued for simulation review.',
      result
    });
  } catch (err) {
    console.error('Pension application error:', err);
    res.status(400).json({ error: err.message });
  }
};
