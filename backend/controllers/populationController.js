const populationService = require('../services/populationService');

// GET /api/population/overview
exports.getOverview = (req, res) => {
  populationService.getPopulationOverview((err, overview) => {
    if (err) {
      return res.status(500).json({ error: 'Database error fetching population overview: ' + err.message });
    }
    res.json(overview);
  });
};

// POST /api/population/birth
exports.addBirth = (req, res) => {
  populationService.recordBirth((err, overview) => {
    if (err) {
      return res.status(500).json({ error: 'Database error recording birth: ' + err.message });
    }
    res.json({
      message: 'Birth successfully recorded in KKU population simulation.',
      overview
    });
  });
};

// POST /api/population/death
exports.addDeath = (req, res) => {
  populationService.recordDeath((err, overview) => {
    if (err) {
      return res.status(500).json({ error: 'Database error recording death: ' + err.message });
    }
    res.json({
      message: 'Death successfully recorded in KKU population simulation.',
      overview
    });
  });
};
