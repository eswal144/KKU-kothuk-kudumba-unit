const db = require('../db/database');
const dotenv = require('dotenv');
dotenv.config();

// Configurable KKU retirement age (Section 6)
const KKU_RETIREMENT_AGE_DAYS = parseInt(process.env.KKU_RETIREMENT_AGE_DAYS || '25', 10);

// Helper to ensure citizen has a service_records entry
async function getOrCreateServiceRecord(mosquitoId, profile) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM service_records WHERE mosquito_id = ?', [mosquitoId], (err, row) => {
      if (!err && row) {
        return resolve(row);
      }
      
      const serviceDays = Math.max(profile.age || 14, 21);
      const bloodCollected = Math.max(profile.blood_collected || 12.0, 24.8);
      const isVeteran = serviceDays >= 20 || profile.employment?.toLowerCase().includes('patrol') ? 1 : 0;
      const serviceType = isVeteran ? 'DEFENSE_BORDER_SQUADRON' : 'NIGHT_PATROL_BRIGADE';

      db.run(`
        INSERT INTO service_records (mosquito_id, service_type, service_days, blood_collected_ml, is_veteran)
        VALUES (?, ?, ?, ?, ?)
      `, [mosquitoId, serviceType, serviceDays, bloodCollected, isVeteran], function() {
        resolve({
          id: this ? this.lastID : 1,
          mosquito_id: mosquitoId,
          service_type: serviceType,
          service_days: serviceDays,
          blood_collected_ml: bloodCollected,
          is_veteran: isVeteran
        });
      });
    });
  });
}

// 1. Check Citizen Pension Eligibility across all 5 Categories (Backend Authority)
async function checkEligibility(userId) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT u.id as user_id, u.email, m.*
      FROM users u
      LEFT JOIN mosquito_profiles m ON m.user_id = u.id
      WHERE u.id = ?
    `, [userId], async (err, profile) => {
      if (err) return reject(err);
      if (!profile || !profile.id) {
        return resolve({
          eligible: false,
          categories: {},
          reasons: {},
          serviceRecord: null,
          profile: null
        });
      }

      const serviceRecord = await getOrCreateServiceRecord(profile.id, profile);

      // Check MOSQ-HOSPITAL records for injury/disability (Requirement 7, 8, 24)
      db.all(`
        SELECT * FROM hospital_patients 
        WHERE (mosquito_id = ? OR name = ?) 
        ORDER BY id DESC
      `, [profile.id, profile.name], (hErr, hospitalRecords) => {
        const hRecords = hospitalRecords || [];
        const activeHospitalization = hRecords.find(p => p.status !== 'DISCHARGED' && p.status !== 'DECEASED');
        const permanentDisabilityCase = hRecords.find(p => 
          p.severity === 'CRITICAL' || 
          p.condition.toLowerCase().includes('swat') || 
          p.condition.toLowerCase().includes('singe') || 
          p.condition.toLowerCase().includes('permanent') ||
          p.condition.toLowerCase().includes('fan')
        );

        // 5 Fictional Pension Categories
        // 1. RETIREMENT PENSION (Age >= KKU_RETIREMENT_AGE_DAYS or service_days >= 25)
        const isRetirementEligible = (profile.age >= KKU_RETIREMENT_AGE_DAYS) || (serviceRecord.service_days >= KKU_RETIREMENT_AGE_DAYS);

        // 2. PERMANENT INJURY PENSION (Permanent fictional disability from hospital records)
        const isPermanentInjuryEligible = !!permanentDisabilityCase || (profile.health_status && profile.health_status.toLowerCase().includes('injured'));

        // 3. WAR INJURY PENSION (Fictional defense / swat encounter event)
        const isWarInjuryEligible = (serviceRecord.service_type && serviceRecord.service_type.includes('DEFENSE')) && (permanentDisabilityCase || serviceRecord.service_days >= 15);

        // 4. TEMPORARY DISABILITY PENSION (Currently hospitalized or temporarily disabled)
        const isTemporaryDisabilityEligible = !!activeHospitalization || (profile.health_status && profile.health_status.toLowerCase().includes('recovering'));

        // 5. VETERAN MOSQUITO PENSION (Qualifying fictional service history)
        const isVeteranEligible = serviceRecord.is_veteran === 1 || serviceRecord.service_days >= 20;

        const categories = {
          PERMANENT_INJURY: isPermanentInjuryEligible,
          WAR_INJURY: isWarInjuryEligible,
          RETIREMENT: isRetirementEligible,
          TEMPORARY_DISABILITY: isTemporaryDisabilityEligible,
          VETERAN: isVeteranEligible
        };

        const reasons = {
          PERMANENT_INJURY: isPermanentInjuryEligible 
            ? `Verified clinical trauma record in MOSQ-HOSPITAL (${permanentDisabilityCase ? permanentDisabilityCase.condition : 'Severe proboscis wing impairment'}).`
            : 'No permanent physical disability record detected in MOSQ-HOSPITAL telemetry.',
          WAR_INJURY: isWarInjuryEligible
            ? 'Qualified under KKU Sector 04 Human Defense & Electric Swatter combat engagement.'
            : 'No record of active combat injury during KKU defensive swarming operations.',
          RETIREMENT: isRetirementEligible
            ? `Mosquito service age (${profile.age} days) has reached or exceeded official KKU retirement threshold (${KKU_RETIREMENT_AGE_DAYS} days).`
            : `Citizen age (${profile.age} days) is below official retirement age (${KKU_RETIREMENT_AGE_DAYS} days).`,
          TEMPORARY_DISABILITY: isTemporaryDisabilityEligible
            ? `Currently enrolled in active medical convalescence (${activeHospitalization ? activeHospitalization.condition : 'Temporary flight rest'}).`
            : 'Citizen is fully active and not currently admitted to MOSQ-HOSPITAL.',
          VETERAN: isVeteranEligible
            ? `Distinguished service record verified: ${serviceRecord.service_days} active operational days in KKU Swarm Defense.`
            : `Insufficient service duration (${serviceRecord.service_days}/20 days required for veteran qualification).`
        };

        const anyEligible = Object.values(categories).some(Boolean);

        resolve({
          eligible: anyEligible,
          categories,
          reasons,
          retirementAge: KKU_RETIREMENT_AGE_DAYS,
          serviceRecord,
          profile,
          hospitalRecords: hRecords
        });
      });
    });
  });
}

// 2. Calculate Fictional Monthly Pension Benefit in mL (Requirement 13)
function calculatePensionAmount(profile, serviceRecord, category) {
  const serviceDays = serviceRecord?.service_days || profile?.age || 14;
  const blood = serviceRecord?.blood_collected_ml || profile?.blood_collected || 12.0;

  let base = 1.0;
  base += (serviceDays * 0.04);
  base += (blood * 0.02);

  if (category === 'RETIREMENT') base += 0.6;
  else if (category === 'WAR_INJURY') base += 0.8;
  else if (category === 'PERMANENT_INJURY') base += 0.7;
  else if (category === 'VETERAN') base += 0.5;
  else if (category === 'TEMPORARY_DISABILITY') base += 0.3;

  // Round to 1 decimal place (e.g., 2.3 mL/month)
  return Math.round(base * 10) / 10;
}

// 3. Get Full Pension Dashboard Status for Logged-in Mosquito
async function getPensionStatus(userId) {
  const eligibility = await checkEligibility(userId);
  if (!eligibility.profile) {
    return {
      eligible: false,
      categories: [],
      status: 'NOT_REGISTERED',
      monthlyAmount: 0.0,
      activeRecord: null,
      activeApplication: null
    };
  }

  const profile = eligibility.profile;

  return new Promise((resolve, reject) => {
    // Check active pension record
    db.get(`
      SELECT * FROM pension_records 
      WHERE mosquito_id = ? AND status = 'ACTIVE' 
      ORDER BY id DESC LIMIT 1
    `, [profile.id], (rErr, activeRecord) => {
      if (rErr) return reject(rErr);

      // Check current application
      db.get(`
        SELECT * FROM pension_applications 
        WHERE mosquito_id = ? 
        ORDER BY id DESC LIMIT 1
      `, [profile.id], (aErr, activeApp) => {
        if (aErr) return reject(aErr);

        let overallStatus = 'NOT_APPLIED';
        if (activeRecord) {
          overallStatus = 'APPROVED';
        } else if (activeApp && (activeApp.status === 'PENDING' || activeApp.status === 'UNDER_REVIEW')) {
          overallStatus = activeApp.status;
        } else if (activeApp && activeApp.status === 'REJECTED') {
          overallStatus = 'REJECTED';
        } else if (!eligibility.eligible) {
          overallStatus = 'NOT_ELIGIBLE';
        }

        const calculatedAmounts = {
          PERMANENT_INJURY: calculatePensionAmount(profile, eligibility.serviceRecord, 'PERMANENT_INJURY'),
          WAR_INJURY: calculatePensionAmount(profile, eligibility.serviceRecord, 'WAR_INJURY'),
          RETIREMENT: calculatePensionAmount(profile, eligibility.serviceRecord, 'RETIREMENT'),
          TEMPORARY_DISABILITY: calculatePensionAmount(profile, eligibility.serviceRecord, 'TEMPORARY_DISABILITY'),
          VETERAN: calculatePensionAmount(profile, eligibility.serviceRecord, 'VETERAN')
        };

        resolve({
          citizen: {
            kkuId: profile.kku_id,
            name: profile.name,
            age: profile.age,
            employment: profile.employment,
            serviceDays: eligibility.serviceRecord?.service_days || profile.age,
            lifetimeBloodCollection: eligibility.serviceRecord?.blood_collected_ml || profile.blood_collected || 12.0,
            isVeteran: eligibility.serviceRecord?.is_veteran === 1,
            retirementStatus: eligibility.categories.RETIREMENT ? 'RETIREMENT ELIGIBLE' : 'NOT ELIGIBLE'
          },
          eligibility: {
            eligible: eligibility.eligible,
            categories: eligibility.categories,
            reasons: eligibility.reasons,
            calculatedAmounts,
            retirementAge: eligibility.retirementAge
          },
          pensionStatus: overallStatus,
          monthlyBenefit: activeRecord ? activeRecord.monthly_amount : calculatedAmounts.RETIREMENT,
          activeRecord: activeRecord || null,
          activeApplication: activeApp || null
        });
      });
    });
  });
}

// 4. Submit a Pension Application (Validates Backend Eligibility)
async function submitApplication(userId, category, customReason) {
  const eligibility = await checkEligibility(userId);
  if (!eligibility.profile) {
    throw new Error('Mosquito profile not found for this citizen.');
  }

  const profile = eligibility.profile;

  // Validate backend eligibility - do not allow ineligible submissions! (Requirement 11)
  if (!eligibility.categories[category]) {
    throw new Error(`Citizen is not currently eligible for ${category}. Verification rejected.`);
  }

  const pensionAmount = calculatePensionAmount(profile, eligibility.serviceRecord, category);
  const populatedReason = customReason || eligibility.reasons[category] || `Official ${category} benefit requested by citizen.`;

  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO pension_applications (mosquito_id, category, reason, status, pension_amount, review_notes)
      VALUES (?, ?, ?, 'PENDING', ?, 'Automatic eligibility verification passed. Simulation board review queued.')
    `, [profile.id, category, populatedReason, pensionAmount], function(err) {
      if (err) return reject(err);

      const appId = this.lastID;
      const eventMsg = `Application submitted by ${profile.name} (${profile.kku_id}) for ${category} (${pensionAmount} mL/mo).`;

      // Log central civilization event
      db.run(`
        INSERT INTO kku_events (event_type, title, message)
        VALUES ('PENSION', '🏛️ PENSION APPLICATION SUBMITTED', ?)
      `, [eventMsg], () => {});

      // Simulate rapid board review (auto-approves in 2.5s)
      setTimeout(() => {
        approvePension(appId).catch(console.error);
      }, 2500);

      resolve({
        applicationId: appId,
        category,
        pensionAmount,
        status: 'PENDING',
        message: 'Pension application registered and under simulation board review.'
      });
    });
  });
}

// 5. Approve Pension Application & Update Employment Status (Requirement 25)
async function approvePension(applicationId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM pension_applications WHERE id = ?', [applicationId], (err, app) => {
      if (err || !app) return reject(new Error('Application not found'));

      db.get('SELECT * FROM mosquito_profiles WHERE id = ?', [app.mosquito_id], (pErr, profile) => {
        if (pErr || !profile) return reject(new Error('Mosquito profile not found'));

        // Update application status
        db.run(`
          UPDATE pension_applications 
          SET status = 'APPROVED', approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
              review_notes = 'Approved by KKU Senior Council of Elder Stingers.'
          WHERE id = ?
        `, [applicationId], () => {
          // Create active pension record
          db.run(`
            INSERT INTO pension_records (mosquito_id, category, monthly_amount, status)
            VALUES (?, ?, ?, 'ACTIVE')
          `, [app.mosquito_id, app.category, app.pension_amount], function(rErr) {
            if (rErr) return reject(rErr);

            // Update employment in mosquito_profiles (Requirement 25)
            const newEmployment = app.category === 'RETIREMENT' ? 'RETIRED (Senior Swarm Council)' : 'DISABILITY LEAVE (Pension Recipient)';
            db.run(`
              UPDATE mosquito_profiles 
              SET employment = ?, pension_status = 'APPROVED & VESTED', updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `, [newEmployment, app.mosquito_id], () => {});

            // Credit first monthly payment to bank account (Requirement 19)
            db.run(`
              UPDATE bank_accounts 
              SET resource_balance = resource_balance + ?, updated_at = CURRENT_TIMESTAMP 
              WHERE user_id = ?
            `, [app.pension_amount, profile.user_id], () => {});

            // Generate official announcement
            let announcement = `After ${profile.age} days of distinguished mosquito service, ${profile.name} (${profile.kku_id}) has officially entered retirement. Monthly benefit of ${app.pension_amount} mL approved.`;
            if (app.category === 'PERMANENT_INJURY') {
              announcement = `Permanent injury pension approved for ${profile.name} (${profile.kku_id}). Discharged from night duty with ${app.pension_amount} mL monthly nectar support.`;
            } else if (app.category === 'VETERAN') {
              announcement = `Veteran honors bestowed upon ${profile.name} (${profile.kku_id}). Lifetime service stipend of ${app.pension_amount} mL active.`;
            }

            db.run(`
              INSERT INTO kku_events (event_type, title, message)
              VALUES ('PENSION', '🏛️ PENSION APPROVED', ?)
            `, [announcement], () => {});

            resolve({
              applicationId,
              status: 'APPROVED',
              monthlyAmount: app.pension_amount,
              announcement
            });
          });
        });
      });
    });
  });
}

// 6. Get Citizen Pension History Records
async function getPensionRecords(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM mosquito_profiles WHERE user_id = ?', [userId], (err, profile) => {
      if (err || !profile) return resolve([]);

      db.all(`
        SELECT * FROM pension_records 
        WHERE mosquito_id = ? 
        ORDER BY id DESC
      `, [profile.id], (rErr, rows) => {
        if (rErr) return reject(rErr);
        resolve(rows || []);
      });
    });
  });
}

// 7. Get Citizen's Current or Latest Application
async function getCurrentApplication(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM mosquito_profiles WHERE user_id = ?', [userId], (err, profile) => {
      if (err || !profile) return resolve(null);

      db.get(`
        SELECT * FROM pension_applications 
        WHERE mosquito_id = ? 
        ORDER BY id DESC LIMIT 1
      `, [profile.id], (aErr, row) => {
        if (aErr) return reject(aErr);
        resolve(row || null);
      });
    });
  });
}

// 8. Simulation Tick Integration: Periodic Pension Payment & Veteran Notifications (Requirement 19, 20)
async function runPensionSimulationTick() {
  try {
    // Process occasional pension payment (+monthly_amount to bank balance)
    db.all(`
      SELECT pr.*, m.user_id, m.name, m.kku_id 
      FROM pension_records pr
      JOIN mosquito_profiles m ON m.id = pr.mosquito_id
      WHERE pr.status = 'ACTIVE'
    `, [], (err, rows) => {
      if (!err && rows && rows.length > 0) {
        rows.forEach(rec => {
          // Add pension resource to bank account
          db.run(`
            UPDATE bank_accounts 
            SET resource_balance = resource_balance + ?, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = ?
          `, [rec.monthly_amount, rec.user_id], () => {
            if (Math.random() < 0.20) {
              const msg = `KKU-PENSION PAYMENT: +${rec.monthly_amount} mL credited to ${rec.name} (${rec.kku_id}).`;
              db.run(`
                INSERT INTO kku_events (event_type, title, message)
                VALUES ('PENSION_PAYMENT', '🏛️ PENSION PAYMENT ISSUED', ?)
              `, [msg], () => {});
            }
          });
        });
      }
    });
  } catch (err) {
    console.error('❌ [MOSQ-PENSION Simulation Error]:', err.message);
  }
}

module.exports = {
  checkEligibility,
  getPensionStatus,
  calculatePensionAmount,
  submitApplication,
  approvePension,
  getPensionRecords,
  getCurrentApplication,
  runPensionSimulationTick,
  KKU_RETIREMENT_AGE_DAYS
};
