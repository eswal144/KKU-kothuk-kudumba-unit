const db = require('../db/database');
const simulationService = require('../services/simulationService');

// GET /api/simulation/status
exports.getStatus = (req, res) => {
  const status = simulationService.getSimulationStatus();
  res.json(status);
};

// POST /api/simulation/run
exports.runTick = async (req, res) => {
  try {
    const result = await simulationService.runSimulationTick();
    res.json({
      message: 'Simulation tick executed successfully.',
      result
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run simulation tick: ' + error.message });
  }
};

// GET /api/events
exports.getEvents = (req, res) => {
  const limit = parseInt(req.query.limit || '20', 10);
  db.all('SELECT * FROM kku_events ORDER BY id DESC LIMIT ?', [limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error fetching civilization events: ' + err.message });
    }
    res.json(rows || []);
  });
};
