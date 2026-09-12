const db = require('../db/database');

// 1. Health Check
exports.healthCheck = (req, res) => {
  res.json({
    status: 'ok',
    message: 'KKU Backend API is operational',
    timestamp: new Date().toISOString()
  });
};

// 2. List all registered members (from mosquito_profiles, not legacy kku_ids)
exports.getAllMembers = (req, res) => {
  db.all(
    `SELECT mp.kku_id, mp.name, mp.species, mp.gender, mp.location, mp.created_at
     FROM mosquito_profiles mp
     ORDER BY mp.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch members: ' + err.message });
      }
      res.json({ count: rows.length, members: rows });
    }
  );
};

// 3. Get specific member by KKU number
exports.getMemberByNumber = (req, res) => {
  const { kkuNumber } = req.params;

  db.get(
    `SELECT mp.kku_id, mp.name, mp.species, mp.age, mp.gender, mp.location,
            mp.blood_preference, mp.bite_count, mp.blood_collected,
            mp.health_status, mp.employment, mp.social_status,
            mp.pension_status, mp.life_history, mp.created_at
     FROM mosquito_profiles mp
     WHERE mp.kku_id = ?`,
    [kkuNumber],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database query failed: ' + err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'KKU-ID not found' });
      }
      res.json({ member: row });
    }
  );
};

// 4. Get available jobs
exports.getJobs = (req, res) => {
  db.all('SELECT * FROM jobs ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch jobs: ' + err.message });
    }
    res.json({ count: rows.length, jobs: rows });
  });
};

// 5. Create a job
exports.createJob = (req, res) => {
  const { title, description, payout_nectar } = req.body;

  if (!title || !description || !payout_nectar) {
    return res.status(400).json({ error: 'title, description, and payout_nectar are required' });
  }

  db.run(
    'INSERT INTO jobs (title, description, payout_nectar) VALUES (?, ?, ?)',
    [title, description, parseInt(payout_nectar, 10)],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create job: ' + err.message });
      }
      res.status(201).json({
        message: 'Job posted successfully',
        job: { id: this.lastID, title, description, payout_nectar }
      });
    }
  );
};
