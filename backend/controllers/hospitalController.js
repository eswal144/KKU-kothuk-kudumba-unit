const hospitalService = require('../services/hospitalService');

// 1. GET /api/hospital/overview
exports.getOverview = async (req, res) => {
  try {
    const overview = await hospitalService.getHospitalOverview();
    res.json(overview);
  } catch (err) {
    console.error('Error fetching hospital overview:', err);
    res.status(500).json({ error: 'Failed to retrieve hospital overview telemetry.' });
  }
};

// 2. GET /api/hospital/patients
exports.getPatients = async (req, res) => {
  try {
    const patients = await hospitalService.getActivePatients();
    res.json({ patients });
  } catch (err) {
    console.error('Error fetching hospital patients:', err);
    res.status(500).json({ error: 'Failed to retrieve active hospital patient registry.' });
  }
};

// 3. GET /api/hospital/events
exports.getEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const events = await hospitalService.getHospitalEvents(limit);
    res.json({ events });
  } catch (err) {
    console.error('Error fetching hospital events:', err);
    res.status(500).json({ error: 'Failed to retrieve hospital activity log.' });
  }
};

// 4. GET /api/hospital/blood-reserve
exports.getBloodReserve = async (req, res) => {
  try {
    const reserve = await hospitalService.getBloodReserve();
    res.json(reserve);
  } catch (err) {
    console.error('Error fetching blood reserve:', err);
    res.status(500).json({ error: 'Failed to retrieve community blood storage level.' });
  }
};

// 5. POST /api/hospital/admit (Self-admission / check-up)
exports.admitCitizen = async (req, res) => {
  try {
    const { condition, severity, notes } = req.body;
    const name = req.user?.username || req.body.name || 'Citizen Mosquito';
    const mosquitoId = req.user?.id || null;

    const patient = await hospitalService.admitPatient({
      name,
      condition: condition || 'Flight Fatigue',
      severity: severity || 'MILD',
      notes: notes || 'Voluntary medical check-up admission.',
      mosquitoId
    });

    res.json({
      success: true,
      message: `🚑 ADMISSION CONFIRMED: ${name} admitted under patient code ${patient.patientCode}.`,
      patient
    });
  } catch (err) {
    console.error('Error admitting patient:', err);
    res.status(500).json({ error: 'Failed to record hospital admission.' });
  }
};

// 6. POST /api/hospital/donate (Donate blood directly to MOSQ-BANK Emergency Reserve)
exports.donateBlood = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required.' });
    }
    const { amountMl } = req.body;
    if (!amountMl || parseFloat(amountMl) <= 0) {
      return res.status(400).json({ error: 'Please provide a valid blood donation volume in mL.' });
    }

    const result = await hospitalService.donateHospitalBlood(userId, amountMl);
    res.json(result);
  } catch (err) {
    console.error('Error in hospital blood donation:', err);
    res.status(400).json({ error: err.message || 'Failed to process emergency blood donation.' });
  }
};
