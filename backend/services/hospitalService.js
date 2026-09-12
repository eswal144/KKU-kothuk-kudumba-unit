const db = require('../db/database');

const FICTIONAL_CONDITIONS = [
  { condition: 'Maternity Leave (Desert Cooler)', severity: 'MILD', defaultBite: 8, notes: 'Resting wings in Maternity Suite 1. Laid 3,200 eggs in stagnant desert cooler tray.' },
  { condition: 'Maternity Leave (Coconut Shell)', severity: 'MILD', defaultBite: 12, notes: 'On official 14-day maternity leave; nursing 2,800 larvae in rainwater puddle.' },
  { condition: 'Paternity Fatigue (Egg Guarding)', severity: 'MILD', defaultBite: 18, notes: 'Guarding drainage gutter cradle 24/7; suffering wing exhaustion.' },
  { condition: 'Swat Impact (Sunday Times)', severity: 'CRITICAL', defaultBite: 5, notes: 'Direct blunt force trauma from rolled-up newspaper. In intensive saliva therapy.' },
  { condition: 'Electric Racket Singe (3000V)', severity: 'CRITICAL', defaultBite: 4, notes: 'High-voltage blue zapper shock; left antenna smoking, proboscis defibrillator active.' },
  { condition: 'Ceiling Fan Catapult', severity: 'SEVERE', defaultBite: 9, notes: 'Hit by 5-speed ceiling fan while attempting ear buzz; wing re-alignment underway.' },
  { condition: 'Mosquito Coil Toxic Cough', severity: 'MODERATE', defaultBite: 15, notes: 'Inhaled dense green smoke coil fumes; proboscis steam inhalation prescribed.' },
  { condition: 'Fermented Mango Hangover', severity: 'MILD', defaultBite: 20, notes: 'Consumed overripe mango juice; flying in horizontal zig-zags and singing.' },
  { condition: 'Mosquito Net Entanglement', severity: 'INJURED', defaultBite: 14, notes: 'Proboscis caught in nylon net weave while targeting human left big toe.' }
];

const FALLBACK_NAMES = [
  'Mama Buzz', 'Buzz Aldrin', 'Vlad Proboscis', 'Bite Tyson', 'Lady Mosquette', 
  'Sister Stinger', 'Wing Diesel', 'Baron Von Stinger', 'Buzz Lightyear', 'Captain Swat', 
  'Major Nectar', 'Sir Bitemore', 'Flyonce Knowles', 'Count Drakula', 'Inspector Thorax'
];

// 1. Get Hospital Dashboard Telemetry Overview (Reflecting the 5 Active Patients)
async function getHospitalOverview() {
  return new Promise((resolve, reject) => {
    getActivePatients().then((activePatients) => {
      let critical = 0;
      let injured = 0;
      let recovering = 0;

      activePatients.forEach(p => {
        if (p.status === 'CRITICAL') critical++;
        else if (p.status === 'INJURED' || p.status === 'HOSPITALIZED') injured++;
        else recovering++;
      });

      // Count discharged today
      db.get(`
        SELECT COUNT(*) as count 
        FROM hospital_patients 
        WHERE status = 'DISCHARGED'
      `, [], (dErr, dRow) => {
        const dischargedToday = (!dErr && dRow) ? Math.max(dRow.count, 14) : 14;

        resolve({
          currentPatients: activePatients.length,
          critical,
          injured,
          recovering,
          dischargedToday
        });
      });
    }).catch(reject);
  });
}

// 2. Get Exactly 5 Active Patients List (Strictly 5)
async function getActivePatients() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM hospital_patients 
      WHERE status NOT IN ('DISCHARGED', 'DECEASED')
      ORDER BY 
        CASE status 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'INJURED' THEN 2 
          WHEN 'HOSPITALIZED' THEN 3 
          WHEN 'RECOVERING' THEN 4 
          ELSE 5 
        END, 
        updated_at DESC
      LIMIT 5
    `, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// 3. Get Hospital Activity Events
async function getHospitalEvents(limit = 30) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM hospital_events 
      ORDER BY id DESC 
      LIMIT ?
    `, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// 4. Get Blood Storage Reserve
async function getBloodReserve() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM blood_reserve ORDER BY id ASC LIMIT 1', [], (err, row) => {
      if (err || !row) {
        return resolve({
          currentMl: 824.6,
          capacityMl: 1000.0,
          percentage: 82.5,
          status: 'STABLE'
        });
      }

      const current = Math.round(row.current_amount_ml * 10) / 10;
      const capacity = row.maximum_capacity_ml || 1000.0;
      const percentage = Math.round((current / capacity) * 100);

      let status = 'STABLE';
      if (percentage < 10) status = 'CRITICAL';
      else if (percentage < 30) status = 'LOW';

      resolve({
        currentMl: current,
        capacityMl: capacity,
        percentage,
        status
      });
    });
  });
}

// 5. Admit a Citizen into the Hospital
async function admitPatient({ name, condition, severity, notes, mosquitoId = null }) {
  return new Promise((resolve, reject) => {
    const codeNum = Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 89);
    const patientCode = `MOS-${codeNum}`;
    const initialRecovery = Math.floor(20 + Math.random() * 30);
    const bitingCap = Math.floor(5 + Math.random() * 20);
    const isMaternity = condition.toLowerCase().includes('maternity') || condition.toLowerCase().includes('egg') || condition.toLowerCase().includes('paternity');
    const status = severity === 'CRITICAL' ? 'CRITICAL' : isMaternity ? 'RECOVERING' : 'INJURED';

    db.run(`
      INSERT OR REPLACE INTO hospital_patients 
      (mosquito_id, patient_code, name, condition, severity, biting_capability, recovery_percentage, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [mosquitoId, patientCode, name, condition, severity, bitingCap, initialRecovery, status, notes], function (err) {
      if (err) return reject(err);

      const patientId = this.lastID;
      const icon = isMaternity ? '🍼' : severity === 'CRITICAL' ? '🚨' : '🚑';
      const eventTitle = isMaternity ? 'MATERNITY ADMISSION' : severity === 'CRITICAL' ? 'CRITICAL ⚠️ CODE RED' : 'INJURED 🩹 ADMISSION';
      const eventMsg = `${name} admitted under ${condition}. ${notes || ''}`;

      // Log hospital event
      db.run(`
        INSERT INTO hospital_events (event_type, icon, title, message, patient_name)
        VALUES ('ADMISSION', ?, ?, ?, ?)
      `, [icon, eventTitle, eventMsg, name], () => {});

      // Log central civilization event
      db.run(`
        INSERT INTO kku_events (event_type, title, message)
        VALUES ('HOSPITAL', ?, ?)
      `, [eventTitle, eventMsg], () => {});

      resolve({
        id: patientId,
        patientCode,
        name,
        condition,
        severity,
        recovery_percentage: initialRecovery,
        status
      });
    });
  });
}

// 6. Hospital Simulation Engine Tick (Dynamic Shift of Exactly 5 Active Patients)
async function runHospitalSimulationTick() {
  try {
    // 1. Fetch current active patients
    let active = await getActivePatients();

    // A. Ensure exactly 5 active patients
    if (active.length < 5) {
      const needed = 5 - active.length;
      for (let i = 0; i < needed; i++) {
        const cond = FICTIONAL_CONDITIONS[Math.floor(Math.random() * FICTIONAL_CONDITIONS.length)];
        const randomName = FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)];
        await admitPatient({
          name: randomName,
          condition: cond.condition,
          severity: cond.severity,
          notes: cond.notes
        });
      }
      active = await getActivePatients();
    } else if (active.length > 5) {
      // Discharge excess patients who have the highest recovery
      db.run(`
        UPDATE hospital_patients 
        SET status = 'DISCHARGED', recovery_percentage = 100, discharged_at = CURRENT_TIMESTAMP 
        WHERE id IN (
          SELECT id FROM hospital_patients 
          WHERE status NOT IN ('DISCHARGED', 'DECEASED') 
          ORDER BY recovery_percentage DESC 
          LIMIT ?
        )
      `, [active.length - 5], () => {});
    }

    // B. Shift conditions & recovery of the active 5 patients (CRITICAL ⚠️ <-> INJURED 🩹 <-> RECOVERING / MATERNITY)
    active.forEach(patient => {
      const isMaternity = patient.condition.toLowerCase().includes('maternity') || patient.condition.toLowerCase().includes('egg') || patient.condition.toLowerCase().includes('paternity');
      const delta = Math.floor(2 + Math.random() * 4); // +2% to +5% recovery
      const newRecovery = Math.min(100, patient.recovery_percentage + delta);
      const newBiting = Math.min(100, patient.biting_capability + Math.floor(delta * 0.7));

      // If reached 100% -> Discharge and admit fresh funny patient!
      if (newRecovery >= 100) {
        db.run(`
          UPDATE hospital_patients 
          SET recovery_percentage = 100, biting_capability = 100, status = 'DISCHARGED', discharged_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [patient.id], () => {
          let dischargeIcon = '✅';
          let dischargeTitle = 'PATIENT DISCHARGED';
          let dischargeMsg = `${patient.name} reached 100% recovery and has returned to active swarm duties.`;

          if (isMaternity) {
            dischargeIcon = '🍼';
            dischargeTitle = 'MATERNITY LEAVE COMPLETED';
            dischargeMsg = `🍼 MATERNITY SUCCESS: ${patient.name} completed maternity rest! 3,200 newborn larvae hatched into stagnant pond nursery.`;
          }

          db.run(`
            INSERT INTO hospital_events (event_type, icon, title, message, patient_name)
            VALUES ('DISCHARGE', ?, ?, ?, ?)
          `, [dischargeIcon, dischargeTitle, dischargeMsg, patient.name], () => {});

          // Immediately admit a fresh patient from FICTIONAL_CONDITIONS to maintain strictly 5 active patients
          const nextCond = FICTIONAL_CONDITIONS[Math.floor(Math.random() * FICTIONAL_CONDITIONS.length)];
          const nextName = FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)];
          admitPatient({
            name: nextName,
            condition: nextCond.condition,
            severity: nextCond.severity,
            notes: nextCond.notes
          }).catch(() => {});
        });
      } else {
        // Dynamic status shift (CRITICAL ⚠️ / INJURED / RECOVERING / MATERNITY)
        let newStatus = patient.status;
        const roll = Math.random();

        if (isMaternity) {
          newStatus = 'RECOVERING';
        } else if (roll < 0.15 && patient.status === 'INJURED') {
          // Status worsens to CRITICAL!
          newStatus = 'CRITICAL';
          const critMsg = `🚨 CRITICAL ⚠️ ALERT: ${patient.name}'s condition deteriorated to CRITICAL due to severe ${patient.condition}. Emergency ICU proboscis team deployed.`;
          db.run(`
            INSERT INTO hospital_events (event_type, icon, title, message, patient_name)
            VALUES ('CRITICAL', '🚨', 'CRITICAL ⚠️ CODE RED', ?, ?)
          `, [critMsg, patient.name], () => {});
        } else if (roll > 0.85 && patient.status === 'CRITICAL') {
          // Critical stabilizes to INJURED
          newStatus = 'INJURED';
          const stabMsg = `🩹 INJURED 🩹 STABILIZED: ${patient.name} stabilized from CRITICAL ⚠️ to INJURED following nectar plasma infusion.`;
          db.run(`
            INSERT INTO hospital_events (event_type, icon, title, message, patient_name)
            VALUES ('CONDITION_UPDATE', '🩹', 'INJURED 🩹 STABILIZED', ?, ?)
          `, [stabMsg, patient.name], () => {});
        } else if (newRecovery >= 65 && patient.status === 'INJURED') {
          newStatus = 'RECOVERING';
        }

        db.run(`
          UPDATE hospital_patients 
          SET recovery_percentage = ?, biting_capability = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [newRecovery, newBiting, newStatus, patient.id], () => {});

        // Occasional character event
        if (Math.random() < 0.40) {
          let eventIcon = '⚠️';
          let eventTitle = 'RECOVERY UPDATE';
          let eventMsg = `${patient.name}'s recovery advanced to ${newRecovery}% under Dr. Proboscis' care.`;

          if (isMaternity) {
            eventIcon = '🍼';
            eventTitle = 'MATERNITY WING DISPATCH';
            eventMsg = `🍼 MATERNITY UPDATE: ${patient.name} resting comfortably in Maternity Ward (${newRecovery}% rested). Larvae pool temperature optimal.`;
          } else if (newStatus === 'CRITICAL') {
            eventIcon = '🚨';
            eventTitle = 'CRITICAL ⚠️ ICU MONITOR';
            eventMsg = `🚨 CRITICAL ⚠️ ICU: ${patient.name} at ${newRecovery}% recovery under intensive oxygen tent.`;
          }

          db.run(`
            INSERT INTO hospital_events (event_type, icon, title, message, patient_name)
            VALUES ('CONDITION_UPDATE', ?, ?, ?, ?)
          `, [eventIcon, eventTitle, eventMsg, patient.name], () => {});
        }
      }
    });

    // C. Blood Reserve Fluctuation (+10/-5 mL simulation)
    const reserveDelta = (Math.random() > 0.45 ? 1 : -1) * (Math.round((1 + Math.random() * 5) * 10) / 10);
    db.run(`
      UPDATE blood_reserve 
      SET current_amount_ml = MAX(50.0, MIN(maximum_capacity_ml, current_amount_ml + ?)), updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [reserveDelta], () => {});

  } catch (err) {
    console.error('❌ [MOSQ-HOSPITAL Simulation Error]:', err.message);
  }
}

// Reset database to exactly 5 active patients and seed rich maternity/critical events
async function resetTo5ActivePatients() {
  return new Promise((resolve) => {
    // Discharge all current active patients
    db.run("UPDATE hospital_patients SET status = 'DISCHARGED' WHERE status NOT IN ('DISCHARGED', 'DECEASED')", () => {
      // Clear out old seed records to prevent duplicates
      db.run("DELETE FROM hospital_patients WHERE patient_code IN ('MOS-701', 'MOS-104', 'MOS-805', 'MOS-271', 'MOS-333')", () => {
        const stmt = db.prepare(`
          INSERT INTO hospital_patients 
          (patient_code, name, condition, severity, biting_capability, recovery_percentage, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // EXACTLY 5 ACTIVE PATIENTS:
        // 1. Mama Buzz - Maternity Leave (Desert Cooler)
        // 2. Buzz Aldrin - Swat Impact (Sunday Times) [CRITICAL ⚠️]
        // 3. Vlad Proboscis - Electric Racket Singe (3000V) [CRITICAL ⚠️]
        // 4. Bite Tyson - Ceiling Fan Catapult [INJURED 🩹]
        // 5. Lady Mosquette - Maternity Leave (Coconut Shell) [MATERNITY / RECOVERING]
        stmt.run('MOS-701', 'Mama Buzz', 'Maternity Leave (Desert Cooler)', 'MILD', 8, 48, 'RECOVERING', 'Admitted to Maternity Suite 1: successfully laid 3,200 eggs in master bedroom desert cooler; resting wings.');
        stmt.run('MOS-104', 'Buzz Aldrin', 'Swat Impact (Sunday Times)', 'CRITICAL', 5, 26, 'CRITICAL', 'Direct blunt force swat trauma during 3:00 AM ear raid. ICU proboscis oxygen tent deployed.');
        stmt.run('MOS-805', 'Vlad Proboscis', 'Electric Racket Singe (3000V)', 'CRITICAL', 4, 38, 'CRITICAL', 'High-voltage blue zapper shock; left antenna smoking, proboscis defibrillator active.');
        stmt.run('MOS-271', 'Bite Tyson', 'Ceiling Fan Catapult', 'SEVERE', 12, 54, 'INJURED', 'Catapulted into ceiling corner by 5-speed fan during midnight ear raid. Wing alignment underway.');
        stmt.run('MOS-333', 'Lady Mosquette', 'Maternity Leave (Coconut Shell)', 'MILD', 15, 66, 'RECOVERING', 'Official 14-day maternity leave: nursing 2,800 larvae in damp bathroom coconut shell.');

        stmt.finalize(() => {
          // Clear old events and seed 12 humorous 3-at-a-time events with Maternity Leave and Critical alerts
          db.run("DELETE FROM hospital_events", () => {
            const evStmt = db.prepare("INSERT INTO hospital_events (event_type, icon, title, message, patient_name) VALUES (?, ?, ?, ?, ?)");
            
            // Batch 1
            evStmt.run('ADMISSION', '🍼', 'MATERNITY LEAVE ALERT', 'Mama Buzz safely delivered 3,200 eggs into the desert cooler tank! Requesting cold sugar syrup in Ward 4.', 'Mama Buzz');
            evStmt.run('CRITICAL', '🚨', 'CRITICAL ⚠️ CODE RED', 'Buzz Aldrin rushed to ICU with severe Sunday Times newspaper swat trauma. Intensive Saliva Unit deployed!', 'Buzz Aldrin');
            evStmt.run('CRITICAL', '⚡', 'CRITICAL ⚠️ ELECTRIC SHOCK', 'Vlad Proboscis admitted after 3000V racket singe; left antenna smoking, Dr. Proboscis applying aloe nectar.', 'Vlad Proboscis');
            
            // Batch 2
            evStmt.run('ADMISSION', '🍼', 'MATERNITY WING UPDATE', 'Lady Mosquette approved for 14-day maternity leave after nesting in bathroom coconut shell with 2,800 larvae.', 'Lady Mosquette');
            evStmt.run('INJURED', '🩹', 'INJURED 🩹 FAN HAZARD', 'Bite Tyson stabilized in Trauma Ward 2 following 5-speed ceiling fan catapult; wing splint applied.', 'Bite Tyson');
            evStmt.run('CONDITION_UPDATE', '🍼', 'MATERNITY ULTRASOUND', 'Dr. Proboscis completed puddle ultrasound for Sister Stinger: 4,100 healthy eggs ready for drainage release.', 'Sister Stinger');
            
            // Batch 3
            evStmt.run('CONDITION_UPDATE', '😴', 'MILD NECTAR HANGOVER', 'Major Nectar admitted after drinking fermented Alphonso mango juice behind fruit stand; flying in zig-zags.', 'Major Nectar');
            evStmt.run('INJURED', '🩹', 'INJURED 🩹 NET RESCUE', 'Inspector Thorax rescued from nylon bed net mesh; sprained tarsus treated with anti-repellent ointment.', 'Inspector Thorax');
            evStmt.run('RESOURCE', '🍼', 'MATERNITY VISITING HOURS', 'Swarm husband allowed 10-minute visit in Maternity Suite 1 to bring fresh nectar flowers to Mama Buzz.', 'Mama Buzz');

            // Batch 4
            evStmt.run('RESOURCE', '🩸', 'BLOOD RESERVE STABLE', 'Community blood storage tank replenished to 842.5 mL (+18 mL donation from midnight raids).', null);
            evStmt.run('DISCHARGE', '✅', 'PATIENT DISCHARGED', 'Count Drakula cleared for nighttime swarm flight after recovering 100% from kitchen window collision.', 'Count Drakula');
            evStmt.run('CRITICAL', '🚨', 'CRITICAL ⚠️ ICU ALERT', 'Emergency Code Red drill conducted: all mosquito nurse cadets trained on high-speed proboscis tourniquets.', null);

            evStmt.finalize(() => {
              resolve(true);
            });
          });
        });
      });
    });
  });
}

module.exports = {
  getHospitalOverview,
  getActivePatients,
  getHospitalEvents,
  getBloodReserve,
  admitPatient,
  runHospitalSimulationTick,
  resetTo5ActivePatients
};
