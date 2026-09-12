const db = require('../db/database');
const groqService = require('./groqSimulationService');
const bcrypt = require('bcryptjs');

let isLoopRunning = false;
let simulationIntervalObj = null;
let lastRunTimestamp = null;
let nextRunTimestamp = null;
let currentProvider = 'groq';

// Funny Mosquito Name Generator for Fallbacks & Collisions
const FUNNY_FIRST_NAMES = [
  'Bite', 'Mosq', 'Swat', 'Buzz', 'Bitey', 'Moses', 'Wingston', 'Dr. Bite',
  'Mosquitorious', 'Blood', 'Fly', 'Snoop', 'Wing', 'Mosquille', 'Bitey', 'Lord',
  'General', 'Captain', 'Inspector', 'Baron', 'Professor', 'Agent', 'Sir'
];

const FUNNY_LAST_NAMES = [
  'Tyson', 'Norris', 'Damon', 'Aldrin', 'McBiteface', 'quito', 'Churchill',
  'Lightyear', 'man', 'B.I.G.', 'Pitt', 'Spears', 'oncé', 'Timberfly', 'Bug',
  'Diesel', 'O\'Neal', 'Wayne', 'Khalifa', 'Wing', 'Swatter', 'Vampire', 'Stinger'
];

function generateFallbackName() {
  const first = FUNNY_FIRST_NAMES[Math.floor(Math.random() * FUNNY_FIRST_NAMES.length)];
  const last = FUNNY_LAST_NAMES[Math.floor(Math.random() * FUNNY_LAST_NAMES.length)];
  return `${first} ${last}`;
}

// Generate unique KKU-ID (e.g., KKU-8F29A1)
function generateKkuIdCode() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KKU-${code}`;
}

function getUniqueKkuId(callback, retries = 10) {
  const kkuId = generateKkuIdCode();
  db.get('SELECT id FROM mosquito_profiles WHERE kku_id = ?', [kkuId], (err, row) => {
    if (err) return callback(err, null);
    if (row && retries > 0) return getUniqueKkuId(callback, retries - 1);
    if (row && retries <= 0) return callback(new Error('Failed to generate unique KKU-ID'), null);
    callback(null, kkuId);
  });
}

// Ensure unique name in SQLite
function getUniqueMosquitoName(candidateName, callback, retries = 5) {
  let nameToTest = (candidateName && candidateName.trim()) || generateFallbackName();
  if (retries < 5) {
    nameToTest = `${generateFallbackName()} ${Math.floor(10 + Math.random() * 89)}`;
  }

  db.get('SELECT id FROM mosquito_profiles WHERE name = ?', [nameToTest], (err, row) => {
    if (err) return callback(err, null);
    if (row && retries > 0) {
      return getUniqueMosquitoName(null, callback, retries - 1);
    }
    callback(null, nameToTest);
  });
}

// Get today's date string YYYY-MM-DD
function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

// Fallback Event Generator when Groq is unavailable
function generateFallbackProposal(context) {
  const births = Math.floor(Math.random() * 4) + 1; // 1-4 births
  const deaths = Math.floor(Math.random() * 3);     // 0-2 deaths
  const events = [];

  const locations = ['Kochi Sector 4', 'Angamaly Zone 2', 'Alappuzha Waterway', 'Thrissur Corridor', 'Trivandrum South'];
  const speciesList = ['Aedes aegypti', 'Anopheles stephensi', 'Culex quinquefasciatus'];

  for (let i = 0; i < births; i++) {
    const name = generateFallbackName();
    events.push({
      type: 'BIRTH',
      name,
      species: speciesList[Math.floor(Math.random() * speciesList.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      title: '🍼 NEW CITIZEN',
      message: `${name} has officially joined the KKU mosquito population.`
    });
  }

  if (deaths > 0) {
    events.push({
      type: 'DEATH',
      title: '⚰️ CITIZEN ARCHIVED',
      message: `A citizen completed 18 days of dedicated public service to the KKU civilization.`
    });
  }

  // Random world event
  const randomWorldEvents = [
    { type: 'SWAT_ALERT', title: '🚨 SWAT ALERT', message: 'Electric racket activity reported in Sector 04. Avoid low light lamps.' },
    { type: 'MIGRATION', title: '🛫 MIGRATION', message: '284 citizens relocated after reports of high human humidity in Sector 02.' },
    { type: 'JOB_EVENT', title: '💼 JOB MARKET', message: 'Night Shift Biter vacancies increased by 15%. High nectar payouts expected.' },
    { type: 'WEATHER_EVENT', title: '🌧️ WEATHER UPDATE', message: 'Optimal breeding humidity detected near reservoir drainage tanks.' }
  ];

  events.push(randomWorldEvents[Math.floor(Math.random() * randomWorldEvents.length)]);

  return { births, deaths, events };
}

/**
 * Executes a single simulation tick.
 */
async function runSimulationTick() {
  lastRunTimestamp = new Date().toISOString();
  const intervalMs = parseInt(process.env.KKU_SIMULATION_INTERVAL_MS || '30000', 10);
  nextRunTimestamp = new Date(Date.now() + intervalMs).toISOString();

  // 1. Gather context from SQLite
  const context = await new Promise((resolve) => {
    const todayDate = getTodayDateString();
    db.get('SELECT * FROM population_stats WHERE date = ?', [todayDate], (err, popRow) => {
      db.all('SELECT name FROM mosquito_profiles ORDER BY id DESC LIMIT 50', [], (nErr, nameRows) => {
        db.all('SELECT message FROM kku_events ORDER BY id DESC LIMIT 10', [], (eErr, eventRows) => {
          resolve({
            totalPopulation: popRow ? popRow.total_population : 1284920,
            birthsToday: popRow ? popRow.births_today : 382,
            deathsToday: popRow ? popRow.deaths_today : 217,
            existingNames: (nameRows || []).map(r => r.name),
            recentEvents: eventRows || []
          });
        });
      });
    });
  });

  // 2. Get Simulation Proposal (Groq or Fallback)
  let proposal;
  let provider = 'groq';

  try {
    proposal = await groqService.generateSimulationProposal(context);
    if (!proposal || typeof proposal !== 'object') throw new Error('Invalid Groq proposal structure');
  } catch (groqErr) {
    console.warn(`[KKU Simulation] Groq API unavailable (${groqErr.message}). Switching to local fallback engine.`);
    proposal = generateFallbackProposal(context);
    provider = 'fallback';
  }

  currentProvider = provider;

  // 3. Clamping & Safe Validation
  let births = parseInt(proposal.births, 10);
  let deaths = parseInt(proposal.deaths, 10);

  if (isNaN(births) || births < 0) births = 0;
  if (births > 20) births = 20;

  if (isNaN(deaths) || deaths < 0) deaths = 0;
  if (deaths > 20) deaths = 20;
  if (deaths > context.totalPopulation) deaths = context.totalPopulation;

  const events = Array.isArray(proposal.events) ? proposal.events : [];

  // 4. Process Births (Create Real Mosquito Profiles)
  const birthEvents = events.filter(e => e.type === 'BIRTH' || e.type === 'NEW_CITIZEN');
  const countToCreate = Math.max(births, birthEvents.length);

  for (let i = 0; i < countToCreate; i++) {
    const rawEvt = birthEvents[i] || {};
    const suggestedName = rawEvt.name;

    await new Promise((resolve) => {
      getUniqueMosquitoName(suggestedName, (nErr, uniqueName) => {
        getUniqueKkuId(async (idErr, kkuId) => {
          if (idErr || !kkuId) return resolve();

          // Create system user account for the born mosquito
          const dummyEmail = `citizen_${kkuId.toLowerCase()}@kku.gov`;
          const dummyPasswordHash = await bcrypt.hash('citizen_kku_pass', 10);

          db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [dummyEmail, dummyPasswordHash], function (uErr) {
            if (uErr) return resolve();
            const userId = this.lastID;

            const species = rawEvt.species || 'Aedes aegypti';
            const location = rawEvt.location || 'Kochi Sector 4';

            db.run(`
              INSERT INTO mosquito_profiles (
                user_id, kku_id, name, species, age, gender, location, blood_preference,
                bite_count, blood_collected, health_status, dengue_risk, employment, social_status,
                pension_status, life_history
              ) VALUES (?, ?, ?, ?, 0, 'Female', ?, 'O Negative', 0, 0.0, 'Vibrant & Active', 'HIGH', 'Unemployed', 'New Citizen', 'Not Eligible', ?)
            `, [userId, kkuId, uniqueName, species, location, `Born into KKU civilization at ${location}.`], function () {
              // Add Saliva Reserve (Default 6.8 nL max for new citizen)
              db.run('INSERT INTO saliva_reserves (mosquito_id, current_saliva_nl, maximum_saliva_nl) VALUES (?, 6.8, 6.8)', [this.lastID], () => {});
              
              // Record birth notification
              const title = '🍼 NEW CITIZEN';
              const message = rawEvt.message || `${uniqueName} (${kkuId}) has officially entered the KKU civilization.`;
              db.run('INSERT INTO kku_events (event_type, title, message, citizen_id) VALUES (?, ?, ?, ?)', ['BIRTH', title, message, kkuId], () => resolve());
            });
          });
        });
      });
    });
  }

  // 5. Process Deaths (Select existing citizens to archive)
  if (deaths > 0) {
    await new Promise((resolve) => {
      db.all('SELECT id, kku_id, name FROM mosquito_profiles ORDER BY RANDOM() LIMIT ?', [deaths], (err, rows) => {
        if (!err && rows && rows.length > 0) {
          rows.forEach((citizen) => {
            const title = '⚰️ CITIZEN ARCHIVED';
            const message = `Citizen ${citizen.name} (${citizen.kku_id}) completed their public service.`;
            db.run('INSERT INTO kku_events (event_type, title, message, citizen_id) VALUES (?, ?, ?, ?)', ['DEATH', title, message, citizen.kku_id]);
          });
        } else {
          db.run('INSERT INTO kku_events (event_type, title, message) VALUES (?, ?, ?)', ['DEATH', '⚰️ CITIZEN ARCHIVED', 'A mosquito citizen completed their natural life cycle.']);
        }
        resolve();
      });
    });
  }

  // 6. Record Non-Birth/Death General Events (Migration, Emergency, Jobs)
  const nonBirthDeathEvents = events.filter(e => e.type !== 'BIRTH' && e.type !== 'DEATH');
  for (const evt of nonBirthDeathEvents) {
    const eventType = evt.type || 'GENERAL';
    const title = evt.title || `📢 KKU ${eventType}`;
    const message = evt.message || 'Civilization activity logged.';
    db.run('INSERT INTO kku_events (event_type, title, message) VALUES (?, ?, ?)', [eventType, title, message], () => {});
  }

  // 7. Update Population Stats in SQLite (authoritative source of truth)
  const newTotalPop = context.totalPopulation + births - deaths;
  const newBirthsToday = context.birthsToday + births;
  const newDeathsToday = context.deathsToday + deaths;
  const todayDate = getTodayDateString();

  await new Promise((resolve) => {
    db.run(`
      UPDATE population_stats 
      SET total_population = ?, 
          births_today = ?, 
          deaths_today = ?, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE date = ? OR id = (SELECT id FROM population_stats ORDER BY id DESC LIMIT 1)
    `, [newTotalPop, newBirthsToday, newDeathsToday, todayDate], (err) => {
      if (err) console.error('Error updating population_stats:', err.message);
      resolve();
    });
  });

  return {
    success: true,
    provider,
    births,
    deaths,
    eventsCount: events.length,
    newTotalPopulation: newTotalPop
  };
}

/**
 * Starts periodic simulation loop background daemon.
 */
function startSimulationLoop() {
  if (isLoopRunning) return;
  isLoopRunning = true;

  const intervalMs = parseInt(process.env.KKU_SIMULATION_INTERVAL_MS || '30000', 10);
  console.log(`📡 KKU Simulation Service started (Interval: ${intervalMs} ms / ${intervalMs / 1000}s, Provider: Groq/Fallback)`);

  // Run initial tick after 3s startup buffer
  setTimeout(() => {
    runSimulationTick().catch(err => console.error('[KKU Simulation Error]:', err.message));
  }, 3000);

  simulationIntervalObj = setInterval(() => {
    runSimulationTick().catch(err => console.error('[KKU Simulation Error]:', err.message));
  }, intervalMs);
}

function getSimulationStatus() {
  return {
    running: isLoopRunning,
    lastRun: lastRunTimestamp,
    nextRun: nextRunTimestamp,
    provider: currentProvider,
    intervalMs: parseInt(process.env.KKU_SIMULATION_INTERVAL_MS || '30000', 10)
  };
}

module.exports = {
  runSimulationTick,
  startSimulationLoop,
  getSimulationStatus
};
