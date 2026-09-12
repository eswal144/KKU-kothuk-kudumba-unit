const db = require('../db/database');

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current population overview for today.
 * If no record exists for today, initializes one carrying forward the previous day's total_population.
 */
exports.getPopulationOverview = (callback) => {
  const todayDate = getTodayDateString();

  db.get('SELECT * FROM population_stats WHERE date = ?', [todayDate], (err, row) => {
    if (err) return callback(err);

    if (row) {
      return callback(null, {
        totalPopulation: row.total_population,
        newBirths: row.births_today,
        deaths: row.deaths_today,
        date: row.date || todayDate
      });
    }

    // No row for today yet. Find latest previous row to carry forward total_population
    db.get('SELECT * FROM population_stats ORDER BY id DESC LIMIT 1', [], (prevErr, prevRow) => {
      if (prevErr) return callback(prevErr);

      const totalPop = prevRow ? prevRow.total_population : 1284920;
      const births = prevRow ? 0 : 382;
      const deaths = prevRow ? 0 : 217;

      db.run(
        `INSERT INTO population_stats (total_population, births_today, deaths_today, date)
         VALUES (?, ?, ?, ?)`,
        [totalPop, births, deaths, todayDate],
        function (insertErr) {
          if (insertErr) {
            // In case of race condition, try reading row again
            db.get('SELECT * FROM population_stats WHERE date = ?', [todayDate], (rErr, rRow) => {
              if (rErr || !rRow) return callback(insertErr);
              return callback(null, {
                totalPopulation: rRow.total_population,
                newBirths: rRow.births_today,
                deaths: rRow.deaths_today,
                date: rRow.date || todayDate
              });
            });
            return;
          }

          callback(null, {
            totalPopulation: totalPop,
            newBirths: births,
            deaths: deaths,
            date: todayDate
          });
        }
      );
    });
  });
};

/**
 * Record a birth: births_today += 1, total_population += 1
 */
exports.recordBirth = (callback) => {
  exports.getPopulationOverview((err, current) => {
    if (err) return callback(err);

    const todayDate = getTodayDateString();
    db.run(
      `UPDATE population_stats 
       SET births_today = births_today + 1, 
           total_population = total_population + 1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE date = ? OR id = (SELECT id FROM population_stats ORDER BY id DESC LIMIT 1)`,
      [todayDate],
      function (updateErr) {
        if (updateErr) return callback(updateErr);

        // Record simulation event
        db.run(
          `INSERT INTO population_events (event_type, icon, description) VALUES ('BIRTH', '🍼', 'A new mosquito citizen was born in the KKU ecosystem.')`,
          () => {}
        );

        // Return updated overview
        exports.getPopulationOverview(callback);
      }
    );
  });
};

/**
 * Record a death: deaths_today += 1, total_population -= 1
 */
exports.recordDeath = (callback) => {
  exports.getPopulationOverview((err, current) => {
    if (err) return callback(err);

    const todayDate = getTodayDateString();
    db.run(
      `UPDATE population_stats 
       SET deaths_today = deaths_today + 1, 
           total_population = total_population - 1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE date = ? OR id = (SELECT id FROM population_stats ORDER BY id DESC LIMIT 1)`,
      [todayDate],
      function (updateErr) {
        if (updateErr) return callback(updateErr);

        // Record simulation event
        db.run(
          `INSERT INTO population_events (event_type, icon, description) VALUES ('ARCHIVE', '⚰️', 'A mosquito citizen completed its natural life cycle.')`,
          () => {}
        );

        // Return updated overview
        exports.getPopulationOverview(callback);
      }
    );
  });
};
