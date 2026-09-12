const db = require('../db/database');

// 1. GET /api/mosquito/profile
exports.getProfile = (req, res) => {
  const userId = req.user.id;
  db.get(
    `SELECT mp.id, mp.kku_id, mp.name, mp.species, mp.age, mp.gender, mp.location,
            mp.blood_preference, mp.bite_count, mp.blood_collected, mp.health_status,
            mp.employment, mp.social_status, mp.pension_status, mp.dengue_risk, mp.life_history, u.email
     FROM mosquito_profiles mp
     JOIN users u ON mp.user_id = u.id
     WHERE mp.user_id = ?`,
    [userId],
    (err, profile) => {
      if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
      if (!profile) return res.status(404).json({ error: 'Mosquito profile not found' });
      res.json({ profile });
    }
  );
};

// 2. GET /api/mosquito/location
exports.getLocation = (req, res) => {
  const userId = req.user.id;
  db.get('SELECT location FROM mosquito_profiles WHERE user_id = ?', [userId], (err, profile) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
    const locationName = profile?.location || 'Kochi';
    res.json({
      location: locationName,
      sector: 'Sector 04',
      localPopulation: 42820,
      humidity: '84%',
      riskLevel: 'LOW'
    });
  });
};

// 3. GET /api/population/overview
exports.getPopulationOverview = (req, res) => {
  db.get('SELECT * FROM population_stats ORDER BY id DESC LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
    if (!row) {
      return res.json({
        totalPopulation: 1284920,
        birthsToday: 382,
        deathsToday: 217,
        migrationToday: 1240,
        growthRate: 0.8
      });
    }
    res.json({
      totalPopulation: row.total_population,
      birthsToday: row.births_today,
      deathsToday: row.deaths_today,
      migrationToday: row.migration_today,
      growthRate: row.growth_rate
    });
  });
};

// 4. GET /api/population/events
exports.getPopulationEvents = (req, res) => {
  db.all('SELECT id, event_type, icon, description, created_at FROM population_events ORDER BY created_at DESC LIMIT 10', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
    res.json({ events: rows || [] });
  });
};

// 5. GET /api/jobs/my
exports.getMyJob = (req, res) => {
  const userId = req.user.id;
  db.get('SELECT employment, bite_count FROM mosquito_profiles WHERE user_id = ?', [userId], (err, profile) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
    res.json({
      job: {
        title: profile?.employment || 'Night Patrol Specialist',
        status: 'ACTIVE',
        todayMissions: 7,
        bites: profile?.bite_count || 42,
        payoutNectar: 450
      }
    });
  });
};

// 6. GET /api/bank/summary
exports.getBankSummary = (req, res) => {
  const userId = req.user.id;
  db.get('SELECT * FROM bank_accounts WHERE user_id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });

    if (!row) {
      // Auto create bank account if missing
      db.run('INSERT INTO bank_accounts (user_id, resource_balance, community_status, emergency_reserve) VALUES (?, 3.2, "STABLE", "82%")', [userId], function (insertErr) {
        if (insertErr) return res.status(500).json({ error: 'Failed to create bank account' });
        res.json({
          resourceBalance: 3.2,
          communityStatus: 'STABLE',
          emergencyReserve: '82%'
        });
      });
    } else {
      res.json({
        resourceBalance: row.resource_balance,
        communityStatus: row.community_status,
        emergencyReserve: row.emergency_reserve
      });
    }
  });
};

// 7. GET /api/care/status
exports.getHealthStatus = (req, res) => {
  const userId = req.user.id;
  db.get('SELECT * FROM health_records WHERE user_id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });

    if (!row) {
      db.run('INSERT INTO health_records (user_id, health_percent, status, wing_condition, last_check) VALUES (?, 82, "Healthy", "Normal", "Today")', [userId], function (insertErr) {
        if (insertErr) return res.status(500).json({ error: 'Failed to create health record' });
        res.json({
          healthPercent: 82,
          status: 'Healthy',
          wingCondition: 'Normal',
          lastCheck: 'Today'
        });
      });
    } else {
      res.json({
        healthPercent: row.health_percent,
        status: row.status,
        wingCondition: row.wing_condition,
        lastCheck: row.last_check
      });
    }
  });
};

// 8. GET /api/social/notifications
exports.getSocialNotifications = (req, res) => {
  const userId = req.user.id;
  db.all('SELECT id, message, read_status, created_at FROM social_notifications WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });

    if (!rows || rows.length === 0) {
      // Seed default notification
      db.run('INSERT INTO social_notifications (user_id, message) VALUES (?, "Welcome to KKU Social network!")', [userId], function () {
        res.json({ notifications: [{ id: 1, message: 'Welcome to KKU Social network!', read_status: 0 }] });
      });
    } else {
      res.json({ notifications: rows });
    }
  });
};

// 9. GET /api/migration/alerts
exports.getMigrationAlerts = (req, res) => {
  db.all('SELECT id, message, level, sector, created_at FROM migration_alerts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
    res.json({ alerts: rows || [] });
  });
};

// 10. GET /api/leaderboard
exports.getLeaderboard = (req, res) => {
  db.all('SELECT id, kku_id, name, bite_count, blood_collected, humans_escaped, survival_days FROM leaderboard_stats ORDER BY bite_count DESC LIMIT 10', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
    res.json({ leaderboard: rows || [] });
  });
};

// 11. GET /api/alerts
exports.getAlerts = (req, res) => {
  db.all('SELECT id, title, message, severity, created_at FROM emergency_alerts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
    res.json({ alerts: rows || [] });
  });
};
