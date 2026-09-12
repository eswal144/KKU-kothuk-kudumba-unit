const db = require('../db/database');

// Configurable KKU Age Rule (Threshold in days)
const AGE_ADULT_THRESHOLD = 14;

// Fictional Max Capacities
const MAX_SALIVA_ADULT = 6.8; // nL
const MAX_SALIVA_CHILD = 4.6; // nL

/**
 * Determine ADULT vs CHILD category based on mosquito age
 */
function determineMosquitoCategory(age) {
  const numericAge = typeof age === 'number' ? age : parseInt(age, 10) || 0;
  return numericAge >= AGE_ADULT_THRESHOLD ? 'ADULT' : 'CHILD';
}

/**
 * Get maximum saliva capacity for category
 */
function getMaximumSaliva(category) {
  return category === 'ADULT' ? MAX_SALIVA_ADULT : MAX_SALIVA_CHILD;
}

/**
 * Fetch recharge status for authenticated user
 */
function getRechargeStatus(userId, callback) {
  db.get('SELECT * FROM mosquito_profiles WHERE user_id = ?', [userId], (err, profile) => {
    if (err) return callback(err);
    if (!profile) {
      return callback(new Error('Mosquito citizen profile not found. Please complete citizenship registration.'));
    }

    const defaultCategory = determineMosquitoCategory(profile.age);

    db.get('SELECT * FROM saliva_reserves WHERE mosquito_id = ?', [profile.id], (resErr, row) => {
      if (resErr) return callback(resErr);

      if (!row) {
        // Initialize new saliva reserve row in SQLite3
        const category = defaultCategory;
        const maxSaliva = getMaximumSaliva(category);
        const initialCurrent = category === 'ADULT' ? 3.2 : 2.0;

        db.run(
          `INSERT INTO saliva_reserves (mosquito_id, current_saliva_nl, maximum_saliva_nl)
           VALUES (?, ?, ?)`,
          [profile.id, initialCurrent, maxSaliva],
          function (insertErr) {
            if (insertErr) return callback(insertErr);

            const percentage = Math.round((initialCurrent / maxSaliva) * 100);
            return callback(null, {
              kkuId: profile.kku_id,
              category,
              currentSalivaNl: initialCurrent,
              maximumSalivaNl: maxSaliva,
              percentage,
              canRecharge: initialCurrent < maxSaliva,
              isLow: percentage < 30,
              lastRechargedAt: new Date().toISOString()
            });
          }
        );
        return;
      }

      // Existing saliva reserve record
      const storedMax = row.maximum_saliva_nl || getMaximumSaliva(defaultCategory);
      const category = storedMax >= MAX_SALIVA_ADULT ? 'ADULT' : 'CHILD';
      const maxSaliva = getMaximumSaliva(category);
      const currentSaliva = Math.min(row.current_saliva_nl, maxSaliva);
      const percentage = Math.round((currentSaliva / maxSaliva) * 100);

      callback(null, {
        kkuId: profile.kku_id,
        category,
        currentSalivaNl: currentSaliva,
        maximumSalivaNl: maxSaliva,
        percentage,
        canRecharge: currentSaliva < maxSaliva,
        isLow: percentage < 30,
        lastRechargedAt: row.last_recharged_at
      });
    });
  });
}

/**
 * Perform Saliva Recharge for authenticated user (Supports choosing ADULT / CHILD category)
 */
function rechargeMosquito(userId, requestedCategory, callback) {
  if (typeof requestedCategory === 'function') {
    callback = requestedCategory;
    requestedCategory = null;
  }

  db.get('SELECT * FROM mosquito_profiles WHERE user_id = ?', [userId], (err, profile) => {
    if (err) return callback(err);
    if (!profile) {
      return callback(new Error('Mosquito profile not found.'));
    }

    getRechargeStatus(userId, (statusErr, status) => {
      if (statusErr) return callback(statusErr);

      // Determine category (User requested ADULT/CHILD or default from profile)
      const category = (requestedCategory === 'ADULT' || requestedCategory === 'CHILD')
        ? requestedCategory
        : status.category;

      const maxSaliva = getMaximumSaliva(category);

      // Update SQLite3 database with maximum capacity for chosen category
      db.run(
        `UPDATE saliva_reserves 
         SET current_saliva_nl = ?, maximum_saliva_nl = ?, last_recharged_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE mosquito_id = ?`,
        [maxSaliva, maxSaliva, profile.id],
        function (updateErr) {
          if (updateErr) return callback(updateErr);

          // Malayalam Slang Message as requested by user: "poyi kadicho!" 🦟🩸
          const funnyMsg = `poyi kadicho! 🦟🩸 (${maxSaliva} nL restored for ${category})`;
          const eventMessage = `${profile.kku_id} (${category}) successfully recharged ${maxSaliva} nL — poyi kadicho! 🦟🩸`;

          // 1. Log to population_events
          db.run(
            `INSERT INTO population_events (event_type, icon, description) VALUES ('SALIVA_RECHARGE', '🧪', ?)`,
            [eventMessage],
            () => {}
          );

          // 2. Log to social_notifications
          db.run(
            `INSERT INTO social_notifications (user_id, message) VALUES (?, ?)`,
            [userId, `🧪 SALIVA RECHARGED: ${eventMessage}`],
            () => {}
          );

          const updatedStatus = {
            ...status,
            category,
            currentSalivaNl: maxSaliva,
            maximumSalivaNl: maxSaliva,
            percentage: 100,
            canRecharge: false,
            isLow: false,
            lastRechargedAt: new Date().toISOString()
          };

          callback(null, {
            success: true,
            message: funnyMsg,
            restoredNl: maxSaliva,
            category,
            status: updatedStatus
          });
        }
      );
    });
  });
}

/**
 * Fetch recharge activity history
 */
function getRechargeHistory(userId, callback) {
  db.all(
    `SELECT * FROM population_events WHERE event_type = 'SALIVA_RECHARGE' ORDER BY id DESC LIMIT 10`,
    [],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows || []);
    }
  );
}

module.exports = {
  determineMosquitoCategory,
  getMaximumSaliva,
  getRechargeStatus,
  rechargeMosquito,
  getRechargeHistory
};
