const db = require('../db/database');
const groqSimulationService = require('./groqSimulationService');

// Helper: Calculate reserve status string based on percentage
function calculateStatus(current, capacity) {
  if (!capacity || capacity <= 0) return 'EMPTY';
  const percentage = (current / capacity) * 100;
  if (percentage >= 70) return 'STABLE';
  if (percentage >= 30) return 'LOW';
  if (percentage >= 10) return 'WARNING';
  return 'CRITICAL';
}

// 1. GET BANK OVERVIEW
async function getBankOverview() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM blood_bank_reserves ORDER BY id ASC', [], (err, rows) => {
      if (err) return reject(err);

      const reserves = {
        emergency: 0,
        pension: 0,
        community: 0,
        veteran: 0
      };

      const reservesDetailed = {};
      let totalStored = 0;
      let totalCapacity = 0;

      (rows || []).forEach(r => {
        const key = r.reserve_type.toLowerCase();
        const current = Math.round(r.current_amount_ml * 10) / 10;
        const capacity = Math.round(r.maximum_capacity_ml * 10) / 10;
        const pct = capacity > 0 ? Math.round((current / capacity) * 100) : 0;
        const status = calculateStatus(current, capacity);

        if (reserves[key] !== undefined) {
          reserves[key] = current;
        }

        reservesDetailed[r.reserve_type] = {
          type: r.reserve_type,
          current,
          capacity,
          percentage: pct,
          status
        };

        totalStored += current;
        totalCapacity += capacity;
      });

      totalStored = Math.round(totalStored * 10) / 10;
      const overallStatus = totalCapacity > 0 ? calculateStatus(totalStored, totalCapacity) : 'STABLE';

      // Fetch active donation drives & shortage alerts
      db.all('SELECT * FROM blood_donation_drives WHERE status = "ACTIVE" ORDER BY id DESC', [], (dErr, driveRows) => {
        const activeDrives = driveRows || [];

        // Check for reserves in shortage
        const shortageAlerts = [];
        Object.values(reservesDetailed).forEach(res => {
          if (res.status === 'CRITICAL' || res.status === 'WARNING' || res.status === 'LOW') {
            const expectedReq = res.type === 'PENSION' ? 214 : res.type === 'EMERGENCY' ? 450 : 150;
            const deficit = Math.max(0, expectedReq - res.current);
            shortageAlerts.push({
              reserveType: res.type,
              current: res.current,
              expectedRequirement: expectedReq,
              deficit,
              status: res.status,
              message: `⚠️ ${res.type} BLOOD SHORTAGE: Deficit of ${deficit.toFixed(1)} mL detected against projected civic demand.`
            });
          }
        });

        resolve({
          totalStored,
          reserves,
          reservesDetailed,
          status: overallStatus,
          activeDrives,
          shortageAlerts
        });
      });
    });
  });
}

// 2. GET RECENT TRANSACTIONS
async function getTransactions(limit = 20) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM blood_bank_transactions 
      ORDER BY id DESC LIMIT ?
    `, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// 3. GET MY DONATION STATUS
async function getMyDonationStatus(userId) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT p.id as mosquito_id, p.kku_id, p.name, p.blood_collected,
             s.total_donated_ml, s.total_received_ml, s.last_donation_at
      FROM mosquito_profiles p
      LEFT JOIN mosquito_bank_stats s ON s.mosquito_id = p.id OR s.mosquito_code = p.kku_id
      WHERE p.user_id = ? OR p.id = ?
    `, [userId, userId], (err, row) => {
      if (err) return reject(err);

      if (!row) {
        return resolve({
          mosquitoCode: `M0S-${userId}`,
          name: 'Citizen Mosquito',
          availableDonation: 1.5,
          totalDonated: 0,
          totalReceived: 0,
          lastDonationAt: null
        });
      }

      const available = Math.min(3.0, Math.max(0.5, Math.round(((row.blood_collected || 1.8) * 0.5) * 10) / 10));

      resolve({
        mosquitoId: row.mosquito_id,
        mosquitoCode: row.kku_id,
        name: row.name,
        availableDonation: available,
        totalDonated: row.total_donated_ml || 0,
        totalReceived: row.total_received_ml || 0,
        lastDonationAt: row.last_donation_at
      });
    });
  });
}

// 4. ADD DONATION (JWT Authenticated)
async function addDonation(userId, amountMl) {
  return new Promise(async (resolve, reject) => {
    const amount = parseFloat(amountMl);
    if (isNaN(amount) || amount <= 0 || amount > 10.0) {
      return reject(new Error('Invalid donation amount. Must be between 0.1 mL and 10.0 mL.'));
    }

    try {
      const myStatus = await getMyDonationStatus(userId);
      const mosquitoCode = myStatus.mosquitoCode || `M0S-${userId}`;
      const name = myStatus.name || 'Citizen Mosquito';

      // SQLite Transaction: update reserve + transaction + donor stats
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // A. Add to COMMUNITY reserve
        db.run(`
          UPDATE blood_bank_reserves 
          SET current_amount_ml = MIN(maximum_capacity_ml, current_amount_ml + ?),
              updated_at = CURRENT_TIMESTAMP
          WHERE reserve_type = 'COMMUNITY'
        `, [amount], function (resErr) {
          if (resErr) {
            db.run('ROLLBACK');
            return reject(resErr);
          }

          // B. Record Transaction
          db.run(`
            INSERT INTO blood_bank_transactions 
            (mosquito_id, mosquito_code, transaction_type, reserve_type, amount_ml, reason, status)
            VALUES (?, ?, 'DONATION', 'COMMUNITY', ?, 'Community blood donation', 'COMPLETED')
          `, [myStatus.mosquitoId || userId, mosquitoCode, amount], function (txErr) {
            if (txErr) {
              db.run('ROLLBACK');
              return reject(txErr);
            }

            // C. Update or Insert Donor Stats
            db.run(`
              INSERT INTO mosquito_bank_stats (mosquito_id, mosquito_code, name, total_donated_ml, last_donation_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(mosquito_code) DO UPDATE SET 
                total_donated_ml = total_donated_ml + excluded.total_donated_ml,
                last_donation_at = CURRENT_TIMESTAMP,
                name = excluded.name
            `, [myStatus.mosquitoId || userId, mosquitoCode, name, amount], function (stErr) {
              if (stErr) {
                // Fallback for older SQLite without ON CONFLICT DO UPDATE
                db.run(`
                  UPDATE mosquito_bank_stats 
                  SET total_donated_ml = total_donated_ml + ?, last_donation_at = CURRENT_TIMESTAMP 
                  WHERE mosquito_code = ? OR mosquito_id = ?
                `, [amount, mosquitoCode, myStatus.mosquitoId || userId], () => {});
              }

              // D. Update active Community or Pension donation drives
              db.run(`
                UPDATE blood_donation_drives
                SET current_amount_ml = MIN(target_amount_ml, current_amount_ml + ?),
                    updated_at = CURRENT_TIMESTAMP
                WHERE status = 'ACTIVE'
              `, [amount], () => {});

              // E. Synchronize legacy hospital blood_reserve
              db.run(`
                UPDATE blood_reserve 
                SET current_amount_ml = MIN(maximum_capacity_ml, current_amount_ml + ?), updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
              `, [amount * 0.5], () => {});

              db.run('COMMIT', async () => {
                // Generate narrative message via Groq AI or fallback
                let notificationMsg = `🩸 DONATION SUCCESSFUL: ${mosquitoCode} contributed ${amount.toFixed(1)} mL to Community Reserve. Thank you for supporting the Mosq-Net community.`;
                try {
                  const groqRes = await groqSimulationService.generateEventNarrative(
                    'BLOOD_DONATION',
                    `${name} (${mosquitoCode}) donated ${amount.toFixed(1)} mL of blood to Mosq-Net Community Reserve.`
                  );
                  if (groqRes && groqRes.narrative) {
                    notificationMsg = groqRes.narrative;
                  }
                } catch (_) {}

                // Log event in hospital/events
                db.run(`
                  INSERT INTO hospital_events (event_type, icon, title, message, patient_name)
                  VALUES ('BANK_DONATION', '🩸', 'BLOOD DONATION RECEIVED', ?, ?)
                `, [notificationMsg, name], () => {});

                // Log event in social_notifications for user dashboard
                db.run(`
                  INSERT INTO social_notifications (user_id, message, read_status)
                  VALUES (?, ?, 0)
                `, [userId, notificationMsg], () => {});

                resolve({
                  success: true,
                  amountDonated: amount,
                  reserve: 'COMMUNITY',
                  mosquitoCode,
                  message: notificationMsg
                });
              });
            });
          });
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}

// 5. GET TOP DONORS
async function getTopDonors(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, mosquito_code, name, total_donated_ml, total_received_ml, last_donation_at
      FROM mosquito_bank_stats
      WHERE total_donated_ml > 0
      ORDER BY total_donated_ml DESC
      LIMIT ?
    `, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// 6. ALLOCATE EMERGENCY BLOOD (Hospital Integration)
async function allocateEmergencyBlood(mosquitoCode, amountMl, reason = 'Hospital emergency support') {
  return new Promise((resolve, reject) => {
    const amount = parseFloat(amountMl);
    db.get('SELECT current_amount_ml FROM blood_bank_reserves WHERE reserve_type = "EMERGENCY"', [], (err, row) => {
      if (err) return reject(err);
      if (!row || row.current_amount_ml < amount) {
        return reject(new Error('Insufficient Emergency Reserve for blood allocation.'));
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`
          UPDATE blood_bank_reserves 
          SET current_amount_ml = MAX(0.0, current_amount_ml - ?), updated_at = CURRENT_TIMESTAMP
          WHERE reserve_type = 'EMERGENCY'
        `, [amount], (uErr) => {
          if (uErr) {
            db.run('ROLLBACK');
            return reject(uErr);
          }

          db.run(`
            INSERT INTO blood_bank_transactions 
            (mosquito_code, transaction_type, reserve_type, amount_ml, reason, status)
            VALUES (?, 'EMERGENCY_ALLOCATION', 'EMERGENCY', ?, ?, 'COMPLETED')
          `, [mosquitoCode, -amount, reason], (txErr) => {
            if (txErr) {
              db.run('ROLLBACK');
              return reject(txErr);
            }

            // Sync legacy hospital table
            db.run(`
              UPDATE blood_reserve 
              SET current_amount_ml = MAX(50.0, current_amount_ml - ?), updated_at = CURRENT_TIMESTAMP
              WHERE id = 1
            `, [amount], () => {});

            db.run('COMMIT', () => {
              resolve({
                success: true,
                allocated: amount,
                reserve: 'EMERGENCY',
                mosquitoCode,
                reason
              });
            });
          });
        });
      });
    });
  });
}

// 7. ALLOCATE PENSION BLOOD (Pension Integration)
async function allocatePensionBlood(mosquitoCode, amountMl, reason = 'Monthly pension allocation') {
  return new Promise((resolve, reject) => {
    const amount = parseFloat(amountMl);
    db.get('SELECT current_amount_ml FROM blood_bank_reserves WHERE reserve_type = "PENSION"', [], (err, row) => {
      if (err) return reject(err);
      if (!row || row.current_amount_ml < amount) {
        return reject(new Error('Insufficient Pension Reserve for blood allocation.'));
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`
          UPDATE blood_bank_reserves 
          SET current_amount_ml = MAX(0.0, current_amount_ml - ?), updated_at = CURRENT_TIMESTAMP
          WHERE reserve_type = 'PENSION'
        `, [amount], (uErr) => {
          if (uErr) {
            db.run('ROLLBACK');
            return reject(uErr);
          }

          db.run(`
            INSERT INTO blood_bank_transactions 
            (mosquito_code, transaction_type, reserve_type, amount_ml, reason, status)
            VALUES (?, 'PENSION_ALLOCATION', 'PENSION', ?, ?, 'COMPLETED')
          `, [mosquitoCode, -amount, reason], (txErr) => {
            if (txErr) {
              db.run('ROLLBACK');
              return reject(txErr);
            }

            db.run('COMMIT', () => {
              resolve({
                success: true,
                allocated: amount,
                reserve: 'PENSION',
                mosquitoCode,
                reason
              });
            });
          });
        });
      });
    });
  });
}

// 8. SIMULATION ENGINE TICK (Called every ~20-30s from centralized engine)
async function runBankSimulationTick() {
  try {
    // A. Check if donation drives are fulfilled
    db.all('SELECT * FROM blood_donation_drives WHERE status = "ACTIVE"', [], (err, drives) => {
      if (!err && drives && drives.length > 0) {
        drives.forEach(d => {
          if (d.current_amount_ml >= d.target_amount_ml) {
            db.run(`
              UPDATE blood_donation_drives 
              SET status = 'COMPLETED', ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [d.id], () => {});
          }
        });
      }
    });

    // B. Minor dynamic simulation event (Community donation or hospital emergency allocation)
    const rand = Math.random();
    if (rand > 0.7) {
      // Automatic simulation community donation (+0.5 to 1.5 mL)
      const donationAmt = Math.round((0.5 + Math.random() * 1.0) * 10) / 10;
      const donors = ['M0S-042', 'M0S-081', 'M0S-119', 'M0S-204', 'M0S-331'];
      const donorCode = donors[Math.floor(Math.random() * donors.length)];

      db.run(`
        UPDATE blood_bank_reserves 
        SET current_amount_ml = MIN(maximum_capacity_ml, current_amount_ml + ?), updated_at = CURRENT_TIMESTAMP
        WHERE reserve_type = 'COMMUNITY'
      `, [donationAmt], () => {
        db.run(`
          INSERT INTO blood_bank_transactions 
          (mosquito_code, transaction_type, reserve_type, amount_ml, reason, status)
          VALUES (?, 'DONATION', 'COMMUNITY', ?, 'Civilian community donation', 'COMPLETED')
        `, [donorCode, donationAmt], () => {});
      });
    } else if (rand < 0.3) {
      // Automatic emergency allocation for hospital patient (-1.2 to 2.4 mL)
      const allocAmt = Math.round((1.2 + Math.random() * 1.2) * 10) / 10;
      const criticalPatients = ['M0S-104', 'M0S-805', 'M0S-271', 'M0S-663'];
      const patientCode = criticalPatients[Math.floor(Math.random() * criticalPatients.length)];

      allocateEmergencyBlood(patientCode, allocAmt, 'Emergency clinical transfusion').catch(() => {});
    }
  } catch (err) {
    console.error('❌ [MOSQ-BANK Simulation Tick Error]:', err.message);
  }
}

module.exports = {
  getBankOverview,
  getTransactions,
  getMyDonationStatus,
  addDonation,
  getTopDonors,
  allocateEmergencyBlood,
  allocatePensionBlood,
  runBankSimulationTick
};
