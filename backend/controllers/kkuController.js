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

// 6. GET /api/jobs/vacancies (Real SQLite3 Bite Vacancies)
exports.getVacancies = (req, res) => {
  db.all('SELECT * FROM bite_vacancies ORDER BY id ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch bite vacancies: ' + err.message });
    }

    const formatted = (rows || []).map((row) => {
      const required = row.required_mosquitoes;
      const current = row.current_mosquitoes;
      const vacancies = Math.max(0, required - current);
      const surplus = Math.max(0, current - required);

      let status = 'AVAILABLE';
      let statusLabel = `🟢 ${vacancies} MOSQUITOES NEEDED`;

      if (current === required) {
        status = 'FILLED';
        statusLabel = '✓ VACANCY FILLED';
      } else if (current > required) {
        status = 'OVERSATURATED';
        statusLabel = '⚠ OVERSATURATED';
      }

      // Contextual message
      let message = row.message;
      if (!message || message.trim() === '') {
        if (current < required) {
          message = `Need ${vacancies} more mosquitoes here. High-demand bite zone.`;
        } else if (current === required) {
          message = '✓ VACANCY FILLED: All positions filled.';
        } else {
          message = 'OVERSATURATED: Too many mosquitoes reported in this sector.';
        }
      }

      return {
        id: row.id,
        locationName: row.location_name,
        category: row.category,
        latitude: row.latitude,
        longitude: row.longitude,
        requiredMosquitoes: required,
        currentMosquitoes: current,
        vacancies,
        surplus,
        status,
        statusLabel,
        demandLevel: row.demand_level || 'HIGH',
        humansDetected: row.humans_detected || 10,
        bloodSupplyMl: row.blood_supply_ml || 50.0,
        message,
        updatedAt: row.updated_at
      };
    });

    res.json(formatted);
  });
};

// 7. POST /api/jobs/apply (Apply for Bite Vacancy)
exports.applyForVacancy = (req, res) => {
  const vacancyId = req.body.vacancyId || req.body.locationId;
  const userId = req.user?.id || 1;

  if (!vacancyId) {
    return res.status(400).json({ success: false, error: 'vacancyId is required' });
  }

  db.get('SELECT * FROM bite_vacancies WHERE id = ?', [vacancyId], (err, vacancy) => {
    if (err || !vacancy) {
      return res.status(404).json({ success: false, message: 'Bite vacancy location not found.' });
    }

    // 1. Check if positions are available
    if (vacancy.current_mosquitoes >= vacancy.required_mosquitoes) {
      return res.status(400).json({
        success: false,
        message: '❌ VACANCY FILLED: This position has already been occupied.'
      });
    }

    // 2. Check if mosquito already applied
    db.get('SELECT id FROM job_applications WHERE vacancy_id = ? AND user_id = ?', [vacancyId, userId], (appErr, existingApp) => {
      if (existingApp) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active application here.'
        });
      }

      // 3. Create application & increment current_mosquitoes
      db.run('INSERT INTO job_applications (vacancy_id, user_id, status) VALUES (?, ?, "ACCEPTED")', [vacancyId, userId], function (insErr) {
        if (insErr) {
          return res.status(500).json({ success: false, message: 'Failed to record application: ' + insErr.message });
        }

        const newCurrent = vacancy.current_mosquitoes + 1;
        const newVacancies = Math.max(0, vacancy.required_mosquitoes - newCurrent);

        let newMsg = vacancy.message;
        if (newVacancies === 0) {
          newMsg = `✓ VACANCY FILLED: ${vacancy.location_name} is fully staffed.`;
        } else {
          newMsg = `Need ${newVacancies} more mosquitoes here.`;
        }

        db.run('UPDATE bite_vacancies SET current_mosquitoes = ?, message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newCurrent, newMsg, vacancyId], () => {});

        // Log civilization event
        db.run('INSERT INTO kku_events (event_type, title, message) VALUES (?, ?, ?)',
          ['DEPLOYMENT', '💼 JOB ACCEPTED', `A citizen mosquito was deployed to ${vacancy.location_name}. Remaining vacancies: ${newVacancies}.`],
          () => {}
        );

        res.json({
          success: true,
          message: `💼 JOB APPLICATION ACCEPTED: You have been assigned to ${vacancy.location_name}.`,
          vacancy: {
            id: vacancy.id,
            locationName: vacancy.location_name,
            currentMosquitoes: newCurrent,
            requiredMosquitoes: vacancy.required_mosquitoes,
            vacancies: newVacancies,
            status: newVacancies === 0 ? 'FILLED' : 'AVAILABLE'
          }
        });
      });
    });
  });
};

