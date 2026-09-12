const db = require('../db/database');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

// ============================================================================
// 1. CONFIGURATION (Read dynamically from process.env with strict defaults)
// ============================================================================
function getEnvConfig() {
  return {
    populationTickMs: parseInt(process.env.KKU_POPULATION_TICK_MS || '5000', 10),
    salivaTickMs: parseInt(process.env.KKU_SALIVA_TICK_MS || '10000', 10),
    minBirthsPerTick: parseInt(process.env.KKU_MIN_BIRTHS_PER_TICK || '0', 10),
    maxBirthsPerTick: parseInt(process.env.KKU_MAX_BIRTHS_PER_TICK || '5', 10),
    minDeathsPerTick: parseInt(process.env.KKU_MIN_DEATHS_PER_TICK || '0', 10),
    maxDeathsPerTick: parseInt(process.env.KKU_MAX_DEATHS_PER_TICK || '3', 10),
    salivaDecayNl: parseFloat(process.env.KKU_SALIVA_DECAY_NL || '0.1'),
    aiBatchSize: parseInt(process.env.KKU_AI_BATCH_SIZE || '20', 10),
    aiLowQueueThreshold: parseInt(process.env.KKU_AI_LOW_QUEUE_THRESHOLD || '5', 10)
  };
}

let isRunning = false;
let populationIntervalId = null;
let salivaIntervalId = null;
let aiReplenishIntervalId = null;
let isReplenishingAi = false;
let lastPopRunTimestamp = null;
let lastSalivaRunTimestamp = null;

// ============================================================================
// 2. DYNAMIC FALLBACK CREATIVE POOL (Used when Groq is unavailable)
// ============================================================================
const MOSQUITO_PREFIXES = [
  'Sir', 'Baron', 'Lord', 'Count', 'General', 'Captain', 'Inspector', 'Professor',
  'Dr.', 'Agent', 'Wing Commander', 'Master', 'Archduke', 'Sergeant', 'Don'
];

const MOSQUITO_FIRST_NAMES = [
  'Bite', 'Buzz', 'Mosq', 'Swat', 'Bitey', 'Sting', 'Wingston', 'Mosquille',
  'Blood', 'Vlad', 'Snoop', 'Fly', 'Zzzz', 'Nectar', 'Proboscis', 'Vamp',
  'Bitemore', 'Zephyr', 'Larva', 'Venom', 'Thorax', 'Abdomen'
];

const MOSQUITO_LAST_NAMES = [
  'Tyson', 'Norris', 'Damon', 'Aldrin', 'McBiteface', 'Churchill', 'Lightyear',
  'B.I.G.', 'Pitt', 'Spears', 'Diesel', 'Wayne', 'Khalifa', 'Timberfly',
  'Swatter', 'Stinger', 'Baggins', 'Skywalker', 'Presley', 'Bond', 'Potter'
];

const MOSQUITO_LOCATIONS = [
  'Kochi Sector 04', 'Angamaly Water Basin', 'Alappuzha Backwater Corridors',
  'Thrissur Green Canopy', 'Trivandrum South Bedpost', 'Calicut Monsoon Gutter',
  'Ernakulam Night Market', 'Kottayam Rubber Grove', 'Wayanad Damp Foliage'
];

const MOSQUITO_SPECIES = [
  'Aedes aegypti', 'Anopheles stephensi', 'Culex quinquefasciatus', 'Aedes albopictus'
];

function generateFallbackName() {
  const prefix = MOSQUITO_PREFIXES[Math.floor(Math.random() * MOSQUITO_PREFIXES.length)];
  const first = MOSQUITO_FIRST_NAMES[Math.floor(Math.random() * MOSQUITO_FIRST_NAMES.length)];
  const last = MOSQUITO_LAST_NAMES[Math.floor(Math.random() * MOSQUITO_LAST_NAMES.length)];
  const num = Math.floor(10 + Math.random() * 89);
  return Math.random() > 0.4 ? `${prefix} ${first} ${last}` : `${first} ${last} ${num}`;
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

function getUniqueKkuId() {
  return new Promise((resolve, reject) => {
    function tryGenerate(retries = 15) {
      const code = generateKkuIdCode();
      db.get('SELECT id FROM mosquito_profiles WHERE kku_id = ?', [code], (err, row) => {
        if (err) return reject(err);
        if (row && retries > 0) return tryGenerate(retries - 1);
        if (row && retries <= 0) return reject(new Error('Failed to generate unique KKU-ID'));
        resolve(code);
      });
    }
    tryGenerate();
  });
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// 3. GROQ AI QUEUE & BATCH REPLENISHMENT (Requirements 6, 7, 8, 9, 19)
// ============================================================================
async function replenishAiPool() {
  if (isReplenishingAi) return;
  isReplenishingAi = true;

  try {
    const config = getEnvConfig();

    // Check count of unused items in pool
    const poolCount = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM ai_message_pool WHERE is_used = 0', (err, row) => {
        resolve(err ? 0 : (row?.count || 0));
      });
    });

    if (poolCount >= config.aiLowQueueThreshold) {
      isReplenishingAi = false;
      return;
    }

    console.log(`🧠 [KKU AI Pool]: Unused items (${poolCount}) below threshold (${config.aiLowQueueThreshold}). Requesting batch of ${config.aiBatchSize} from Groq...`);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️ [KKU AI Pool]: GROQ_API_KEY missing. Seeding dynamic local fallback batch.');
      await seedLocalFallbackBatch(config.aiBatchSize);
      isReplenishingAi = false;
      return;
    }

    // 1. Gather current civilization context from SQLite
    const stats = await new Promise((resolve) => {
      db.get('SELECT * FROM population_stats ORDER BY id DESC LIMIT 1', (err, row) => {
        resolve(row || { total_population: 1284920, births_today: 384, deaths_today: 219 });
      });
    });

    const recentEvents = await new Promise((resolve) => {
      db.all('SELECT message FROM kku_events ORDER BY id DESC LIMIT 12', (err, rows) => {
        resolve(rows ? rows.map(r => r.message) : []);
      });
    });

    const recentNames = await new Promise((resolve) => {
      db.all('SELECT name FROM mosquito_profiles ORDER BY id DESC LIMIT 30', (err, rows) => {
        resolve(rows ? rows.map(r => r.name) : []);
      });
    });

    const systemPrompt = `You are the central civilization simulation intelligence for KKU — Kothuk Kudumba Unit, the digital civilization of mosquitoes annoying humans.

Generate a batch of COMPLETELY ORIGINAL, FRESH, and HILARIOUS mosquito names and notifications.
NEVER reuse recent names: [${recentNames.slice(0, 15).join(', ')}].
NEVER repeat existing message lines.

RULES:
1. "names": An array of ${config.aiBatchSize} unique, witty mosquito names (mix mosquito/flight humor with pop culture, history, or funny titles).
2. "births": An array of 6 funny newborn mosquito notifications. Must include cute buzzing sounds like "zzz zzzzz! Bzzzz!" followed by funny first words or nectar demands.
3. "deaths": An array of 6 deadpan, hilarious hazard death messages (e.g. electric swatter rackets, citronella candles, moving ceiling fans, rolled-up magazines, monsoon raindrops).
4. "alerts": An array of 4 absurd mosquito society news (SWAT alerts, humidity spikes, curtain hiding recommendations, blood drive announcements).

Output strictly valid JSON with this format:
{
  "names": ["Name 1", "Name 2", ...],
  "births": ["Birth message 1", "Birth message 2", ...],
  "deaths": ["Death message 1", "Death message 2", ...],
  "alerts": ["Alert message 1", "Alert message 2", ...]
}`;

    const userPrompt = `KKU Context:
- Population: ${stats.total_population}
- Births Today: ${stats.births_today}
- Deaths Today: ${stats.deaths_today}
- Recent Activity: ${recentEvents.slice(0, 4).join(' | ') || 'Normal night shift.'}

Please return the batch JSON now.`;

    const candidateModels = ['openai/gpt-oss-20b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
    let parsedData = null;

    for (const model of candidateModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model,
            temperature: 0.75,
            max_tokens: 600,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ]
          })
        });

        if (!res.ok) continue;

        const data = await res.json();
        let text = data.choices?.[0]?.message?.content || '';
        if (text.includes('</think>')) text = text.split('</think>')[1];
        if (text.includes('```json')) text = text.split('```json')[1].split('```')[0];
        else if (text.includes('```')) text = text.split('```')[1].split('```')[0];

        const fBrace = text.indexOf('{');
        const lBrace = text.lastIndexOf('}');
        if (fBrace !== -1 && lBrace !== -1) {
          text = text.substring(fBrace, lBrace + 1);
        }

        const candidateJson = JSON.parse(text);
        if (candidateJson && (candidateJson.names || candidateJson.births)) {
          parsedData = candidateJson;
          console.log(`✅ [KKU AI Pool]: Batch successfully generated using Groq model ${model}`);
          break;
        }
      } catch (err) {
        // Try next model candidate
      }
    }

    if (parsedData) {
      await insertBatchIntoPool(parsedData);
    } else {
      console.warn('⚠️ [KKU AI Pool]: Groq models returned unparseable response. Seeding dynamic local fallback batch.');
      await seedLocalFallbackBatch(config.aiBatchSize);
    }

  } catch (globalErr) {
    console.error('❌ [KKU AI Pool Error]:', globalErr.message);
    await seedLocalFallbackBatch(10);
  } finally {
    isReplenishingAi = false;
  }
}

async function insertBatchIntoPool(batch) {
  const names = Array.isArray(batch.names) ? batch.names : [];
  const births = Array.isArray(batch.births) ? batch.births : [];
  const deaths = Array.isArray(batch.deaths) ? batch.deaths : [];
  const alerts = Array.isArray(batch.alerts) ? batch.alerts : [];

  for (const name of names) {
    if (!name || typeof name !== 'string') continue;
    const cleanName = name.trim();
    // Verify name uniqueness against mosquito_profiles & ai_message_pool
    const exists = await new Promise((resolve) => {
      db.get('SELECT id FROM mosquito_profiles WHERE name = ? UNION SELECT id FROM ai_message_pool WHERE name = ?', [cleanName, cleanName], (err, row) => {
        resolve(!!row);
      });
    });
    if (!exists) {
      db.run('INSERT INTO ai_message_pool (content_type, name, title, message) VALUES (?, ?, ?, ?)',
        ['NAME', cleanName, 'NAME', cleanName], () => {});
    }
  }

  for (const msg of births) {
    if (!msg || typeof msg !== 'string') continue;
    const cleanMsg = msg.trim();
    const exists = await new Promise((resolve) => {
      db.get('SELECT id FROM kku_events WHERE message = ? UNION SELECT id FROM ai_message_pool WHERE message = ?', [cleanMsg, cleanMsg], (err, row) => {
        resolve(!!row);
      });
    });
    if (!exists) {
      db.run('INSERT INTO ai_message_pool (content_type, title, message) VALUES (?, ?, ?)',
        ['BIRTH', '🍼 NEW CITIZEN', cleanMsg], () => {});
    }
  }

  for (const msg of deaths) {
    if (!msg || typeof msg !== 'string') continue;
    const cleanMsg = msg.trim();
    const exists = await new Promise((resolve) => {
      db.get('SELECT id FROM kku_events WHERE message = ? UNION SELECT id FROM ai_message_pool WHERE message = ?', [cleanMsg, cleanMsg], (err, row) => {
        resolve(!!row);
      });
    });
    if (!exists) {
      db.run('INSERT INTO ai_message_pool (content_type, title, message) VALUES (?, ?, ?)',
        ['DEATH', '⚰️ CITIZEN ARCHIVED', cleanMsg], () => {});
    }
  }

  for (const msg of alerts) {
    if (!msg || typeof msg !== 'string') continue;
    const cleanMsg = msg.trim();
    const exists = await new Promise((resolve) => {
      db.get('SELECT id FROM kku_events WHERE message = ? UNION SELECT id FROM ai_message_pool WHERE message = ?', [cleanMsg, cleanMsg], (err, row) => {
        resolve(!!row);
      });
    });
    if (!exists) {
      db.run('INSERT INTO ai_message_pool (content_type, title, message) VALUES (?, ?, ?)',
        ['ALERT', '🚨 SWAT RADAR ALERT', cleanMsg], () => {});
    }
  }
}

async function seedLocalFallbackBatch(count = 15) {
  const dynamicBirthPhrases = [
    'zzz zzzzz! Bzzzz! First flight completed; immediately requested 100% pure blood.',
    'zzz zzzzz! Hatched under Water Tank Leaf #4, wing frequency tuned to 620 Hz!',
    'zzz zzzzz! Bzzzz! Spoke first words and enrolled in Night Radar Academy.',
    'zzz zzzzz! Emerged into Sector 04 ready to annoy sleeping humans at 3 AM.',
    'zzz zzzzz! Bzzzz! Completed wing-stretching drills and requested high-grade nectar.'
  ];

  const dynamicDeathPhrases = [
    'Mistook a glowing electric swatter racket for the Northern Lights; sizzled with distinction.',
    'Caught in a sudden monsoon raindrop that pancaked both wings onto a hibiscus petal.',
    'Rolled into history by a high-velocity Sunday newspaper while hovering near the TV.',
    'Attempted a low-altitude barrel roll and collided with a spinning ceiling fan blade.',
    'Curtain shifted abruptly during a daytime nap; peacefully archived into the great ecosystem.'
  ];

  for (let i = 0; i < count; i++) {
    const candidateName = generateFallbackName();
    const exists = await new Promise((resolve) => {
      db.get('SELECT id FROM mosquito_profiles WHERE name = ? UNION SELECT id FROM ai_message_pool WHERE name = ?', [candidateName, candidateName], (err, row) => {
        resolve(!!row);
      });
    });

    if (!exists) {
      db.run('INSERT INTO ai_message_pool (content_type, name, title, message) VALUES (?, ?, ?, ?)',
        ['NAME', candidateName, 'NAME', candidateName], () => {});
    }

    if (i % 2 === 0) {
      const bMsg = dynamicBirthPhrases[Math.floor(Math.random() * dynamicBirthPhrases.length)] + ` (${Math.floor(100 + Math.random() * 899)})`;
      db.run('INSERT INTO ai_message_pool (content_type, title, message) VALUES (?, ?, ?)',
        ['BIRTH', '🍼 NEW CITIZEN', bMsg], () => {});
    } else {
      const dMsg = dynamicDeathPhrases[Math.floor(Math.random() * dynamicDeathPhrases.length)] + ` (${Math.floor(100 + Math.random() * 899)})`;
      db.run('INSERT INTO ai_message_pool (content_type, title, message) VALUES (?, ?, ?)',
        ['DEATH', '⚰️ CITIZEN ARCHIVED', dMsg], () => {});
    }
  }
}

// Fetch an unused item from AI pool and mark it used
async function consumeAiItem(contentType) {
  return new Promise((resolve) => {
    db.get('SELECT id, name, title, message FROM ai_message_pool WHERE content_type = ? AND is_used = 0 ORDER BY id ASC LIMIT 1', [contentType], (err, row) => {
      if (err || !row) {
        resolve(null);
      } else {
        db.run('UPDATE ai_message_pool SET is_used = 1 WHERE id = ?', [row.id], () => {
          resolve(row);
        });
      }
    });
  });
}

// Get unique funny mosquito name (strictly checked in SQLite)
async function getUniqueFunnyMosquitoName() {
  // 1. Try to consume from AI Pool
  const pooled = await consumeAiItem('NAME');
  if (pooled && pooled.name) {
    const exists = await new Promise((resolve) => {
      db.get('SELECT id FROM mosquito_profiles WHERE name = ?', [pooled.name], (err, row) => {
        resolve(!!row);
      });
    });
    if (!exists) return pooled.name;
  }

  // 2. Generate fallback and verify in SQLite
  return new Promise((resolve, reject) => {
    function tryName(retries = 20) {
      const candidate = generateFallbackName();
      db.get('SELECT id FROM mosquito_profiles WHERE name = ?', [candidate], (err, row) => {
        if (err) return reject(err);
        if (row && retries > 0) return tryName(retries - 1);
        if (row && retries <= 0) return resolve(`${candidate} ${Math.floor(100 + Math.random() * 899)}`);
        resolve(candidate);
      });
    }
    tryName();
  });
}

// Ensure unique message in kku_events (Requirement 7: Never repeat AI messages)
async function getUniqueNotificationMessage(contentType, citizenName = '', citizenKkuId = '') {
  const pooled = await consumeAiItem(contentType);
  if (pooled && pooled.message) {
    let msg = pooled.message;
    if (citizenName && !msg.includes(citizenName)) {
      msg = `${msg} (${citizenName}, ${citizenKkuId})`;
    }
    const exists = await new Promise((resolve) => {
      db.get('SELECT id FROM kku_events WHERE message = ?', [msg], (err, row) => {
        resolve(!!row);
      });
    });
    if (!exists) return { title: pooled.title || '📢 KKU NOTIFICATION', message: msg };
  }

  // Fallback unique dynamic message
  const timestampCode = Math.floor(1000 + Math.random() * 8999);
  if (contentType === 'BIRTH') {
    return {
      title: '🍼 NEW CITIZEN',
      message: `zzz zzzzz! Bzzzz! ${citizenName} (${citizenKkuId}) has officially entered the KKU population. Orientation begins immediately. [Registry #${timestampCode}]`
    };
  } else if (contentType === 'DEATH') {
    return {
      title: '⚰️ CITIZEN ARCHIVED',
      message: `${citizenName} (${citizenKkuId}) has completed their distinguished nocturnal service after an unexpected human encounter. [Ref #${timestampCode}]`
    };
  }

  return {
    title: '📢 KKU DISPATCH',
    message: `Civilization activity logged across nocturnal corridors. [Ref #${timestampCode}]`
  };
}

// ============================================================================
// 4. BIRTH PROCESSOR (Requirement 3)
// ============================================================================
async function processBirth() {
  const kkuId = await getUniqueKkuId();
  const name = await getUniqueFunnyMosquitoName();
  const species = MOSQUITO_SPECIES[Math.floor(Math.random() * MOSQUITO_SPECIES.length)];
  const location = MOSQUITO_LOCATIONS[Math.floor(Math.random() * MOSQUITO_LOCATIONS.length)];

  // Create associated dummy user for foreign key constraint
  const dummyEmail = `citizen_${kkuId.toLowerCase().replace(/[^a-z0-9]/g, '')}@kku.internal`;
  const dummyHash = await bcrypt.hash(`kku_sim_${Date.now()}`, 8);

  const userId = await new Promise((resolve, reject) => {
    db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [dummyEmail, dummyHash], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });

  // Insert real citizen into mosquito_profiles
  const profileId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO mosquito_profiles (
        user_id, kku_id, name, species, age, gender, location,
        health_status, employment, social_status, dengue_risk, is_active
      ) VALUES (?, ?, ?, ?, 0, 'Female', ?, 'Healthy', 'Unemployed', 'New Citizen', 'LOW', 1)
    `, [userId, kkuId, name, species, location], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });

  // Initialize Saliva Reserve (Adult 6.8 nL)
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO saliva_reserves (
        mosquito_id, current_saliva_nl, maximum_saliva_nl, alert_low_sent, alert_empty_sent
      ) VALUES (?, 6.8, 6.8, 0, 0)
    `, [profileId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  // Generate unique birth notification message
  const notif = await getUniqueNotificationMessage('BIRTH', name, kkuId);

  // Store in kku_events (Civilization Stream)
  await new Promise((resolve) => {
    db.run(
      'INSERT INTO kku_events (event_type, title, message, citizen_id) VALUES (?, ?, ?, ?)',
      ['BIRTH', notif.title, notif.message, kkuId],
      () => resolve()
    );
  });

  // Also log to population_events for legacy compatibility
  db.run(
    'INSERT INTO population_events (event_type, icon, description) VALUES (?, ?, ?)',
    ['BIRTH', '🍼', notif.message],
    () => {}
  );

  return { kkuId, name, profileId, notification: notif };
}

// ============================================================================
// 5. DEATH PROCESSOR (Requirement 4)
// ============================================================================
async function processDeath() {
  // Select an eligible living mosquito from SQLite
  const citizen = await new Promise((resolve) => {
    db.get('SELECT * FROM mosquito_profiles WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1', (err, row) => {
      resolve(err ? null : row);
    });
  });

  if (!citizen) {
    return null; // No living citizen to archive
  }

  // 1. Mark citizen as deceased with timestamp
  await new Promise((resolve) => {
    db.run(
      'UPDATE mosquito_profiles SET is_active = 0, deceased_at = CURRENT_TIMESTAMP, health_status = "Archived" WHERE id = ?',
      [citizen.id],
      () => resolve()
    );
  });

  // 2. Deplete their saliva reserve
  db.run('UPDATE saliva_reserves SET current_saliva_nl = 0 WHERE mosquito_id = ?', [citizen.id], () => {});

  // 3. Generate deadpan funny death message referencing real citizen
  const notif = await getUniqueNotificationMessage('DEATH', citizen.name, citizen.kku_id);

  // 4. Store in kku_events
  await new Promise((resolve) => {
    db.run(
      'INSERT INTO kku_events (event_type, title, message, citizen_id) VALUES (?, ?, ?, ?)',
      ['DEATH', notif.title, notif.message, citizen.kku_id],
      () => resolve()
    );
  });

  // Legacy population_events
  db.run(
    'INSERT INTO population_events (event_type, icon, description) VALUES (?, ?, ?)',
    ['DEATH', '⚰️', notif.message],
    () => {}
  );

  return { citizen, notification: notif };
}

// ============================================================================
// 6. POPULATION TICK RUNNER (Requirement 2, Every 5 Seconds)
// ============================================================================
async function runPopulationTick() {
  try {
    const config = getEnvConfig();
    lastPopRunTimestamp = new Date().toISOString();

    // 1. Fetch current population stats from SQLite
    const currentStats = await new Promise((resolve) => {
      db.get('SELECT * FROM population_stats ORDER BY id DESC LIMIT 1', (err, row) => {
        resolve(row || { total_population: 1284920, births_today: 384, deaths_today: 219 });
      });
    });

    const currentPop = currentStats.total_population || 1284920;

    // 2. Generate small random births & deaths within safe configurable ranges
    const birthsCount = Math.floor(Math.random() * (config.maxBirthsPerTick - config.minBirthsPerTick + 1)) + config.minBirthsPerTick;
    let deathsCount = Math.floor(Math.random() * (config.maxDeathsPerTick - config.minDeathsPerTick + 1)) + config.minDeathsPerTick;

    // Do NOT allow deaths to exceed current population
    deathsCount = Math.min(deathsCount, currentPop);

    // 3. Execute individual real births in SQLite
    const birthResults = [];
    for (let b = 0; b < birthsCount; b++) {
      try {
        const birthRes = await processBirth();
        birthResults.push(birthRes);
      } catch (err) {
        console.error('Error processing individual birth:', err.message);
      }
    }

    // 4. Execute individual real deaths in SQLite
    const deathResults = [];
    for (let d = 0; d < deathsCount; d++) {
      try {
        const deathRes = await processDeath();
        if (deathRes) deathResults.push(deathRes);
      } catch (err) {
        console.error('Error processing individual death:', err.message);
      }
    }

    // 5. Update SQLite population_stats
    const actualBirths = birthResults.length;
    const actualDeaths = deathResults.length;
    const newTotalPop = Math.max(0, currentPop + actualBirths - actualDeaths);
    const newBirthsToday = (currentStats.births_today || 0) + actualBirths;
    const newDeathsToday = (currentStats.deaths_today || 0) + actualDeaths;
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
        if (err) console.error('Error updating population_stats in SQLite:', err.message);
        resolve();
      });
    });

    console.log(`⏱️ [KKU Pop Tick]: Population: ${newTotalPop} (+${actualBirths} births, -${actualDeaths} deaths)`);

    return {
      success: true,
      births: actualBirths,
      deaths: actualDeaths,
      newTotalPopulation: newTotalPop
    };

  } catch (err) {
    console.error('❌ [KKU Pop Tick Error]:', err.message);
    throw err;
  }
}

// ============================================================================
// 7. SALIVA SIMULATION & DECAY (Requirements 10, 11, 12, 13, Every 10 Seconds)
// ============================================================================
async function processSalivaDecay() {
  const config = getEnvConfig();
  lastSalivaRunTimestamp = new Date().toISOString();

  // Query all active mosquito saliva reserves in SQLite
  const activeReserves = await new Promise((resolve) => {
    db.all(`
      SELECT 
        sr.id as reserve_id,
        sr.mosquito_id,
        sr.current_saliva_nl,
        sr.maximum_saliva_nl,
        sr.alert_low_sent,
        sr.alert_empty_sent,
        mp.name,
        mp.kku_id
      FROM saliva_reserves sr
      JOIN mosquito_profiles mp ON sr.mosquito_id = mp.id
      WHERE mp.is_active = 1 AND sr.current_saliva_nl > 0
    `, (err, rows) => {
      resolve(err ? [] : (rows || []));
    });
  });

  if (activeReserves.length === 0) return { updatedCount: 0 };

  for (const row of activeReserves) {
    const decayAmount = config.salivaDecayNl;
    const newSaliva = Math.max(0.0, Math.round((row.current_saliva_nl - decayAmount) * 100) / 100);
    const maxSaliva = row.maximum_saliva_nl || 6.8;
    const percentage = (newSaliva / maxSaliva) * 100;

    let alertLowSent = row.alert_low_sent || 0;
    let alertEmptySent = row.alert_empty_sent || 0;

    // Requirement 11: Alert when saliva falls below 30% threshold (do not repeat every tick)
    if (percentage < 30 && alertLowSent === 0) {
      alertLowSent = 1;
      const lowMsg = `Saliva reserve critically low (${newSaliva.toFixed(1)} nL / ${percentage.toFixed(0)}%) for citizen ${row.name} (${row.kku_id}). Recharge recommended before next mission.`;
      db.run(
        'INSERT INTO kku_events (event_type, title, message, citizen_id) VALUES (?, ?, ?, ?)',
        ['ALERT', '⚠️ LOW SALIVA', lowMsg, row.kku_id],
        () => {}
      );
    }

    // Requirement 12: Alert when saliva reserve reaches 0 (do not repeat every tick)
    if (newSaliva <= 0 && alertEmptySent === 0) {
      alertEmptySent = 1;
      const emptyMsg = `Citizen ${row.name} (${row.kku_id}) has exhausted its fictional saliva reserve. Recharge required.`;
      db.run(
        'INSERT INTO kku_events (event_type, title, message, citizen_id) VALUES (?, ?, ?, ?)',
        ['ALERT', '🧪 SALIVA RESERVE EMPTY', emptyMsg, row.kku_id],
        () => {}
      );
    }

    // Update SQLite3
    db.run(
      'UPDATE saliva_reserves SET current_saliva_nl = ?, alert_low_sent = ?, alert_empty_sent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newSaliva, alertLowSent, alertEmptySent, row.reserve_id],
      () => {}
    );
  }

  return { updatedCount: activeReserves.length };
}

async function runSalivaTick() {
  try {
    return await processSalivaDecay();
  } catch (err) {
    console.error('❌ [KKU Saliva Tick Error]:', err.message);
  }
}

// Generate general civilization event
async function generateSimulationEvent(eventType, title, message, citizenId = null) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO kku_events (event_type, title, message, citizen_id) VALUES (?, ?, ?, ?)',
      [eventType, title, message, citizenId],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, eventType, title, message, citizenId });
      }
    );
  });
}

// ============================================================================
// 8. SIMULATION LIFECYCLE (Requirement 17)
// ============================================================================
function startSimulation() {
  if (isRunning) {
    console.log('⚠️ [KKU Simulation]: Engine already running.');
    return;
  }

  const config = getEnvConfig();
  isRunning = true;

  console.log('🚀 ============================================================');
  console.log('🦟 KKU AUTOMATIC CIVILIZATION SIMULATION ENGINE ONLINE');
  console.log(`   - Population Tick Interval: ${config.populationTickMs}ms (Births: ${config.minBirthsPerTick}-${config.maxBirthsPerTick}, Deaths: ${config.minDeathsPerTick}-${config.maxDeathsPerTick})`);
  console.log(`   - Saliva Tick Interval:     ${config.salivaTickMs}ms (Decay: ${config.salivaDecayNl} nL)`);
  console.log(`   - Groq AI Pool Batch Size:  ${config.aiBatchSize} items (Low Threshold: ${config.aiLowQueueThreshold})`);
  console.log('   - Authority: SQLite3 (Persisted state)');
  console.log('============================================================');

  // 1. Initial AI queue replenishment
  replenishAiPool();
  aiReplenishIntervalId = setInterval(replenishAiPool, 60000); // Check/replenish every 60s

  // 2. Start Population Tick loop (Configurable: default 5s)
  populationIntervalId = setInterval(async () => {
    try {
      await runPopulationTick();
    } catch (err) {
      console.error('[Population Tick Loop Error]:', err.message);
    }
  }, config.populationTickMs);

  // 3. Start Saliva Decay loop (Configurable: default 10s)
  salivaIntervalId = setInterval(async () => {
    try {
      await runSalivaTick();
    } catch (err) {
      console.error('[Saliva Tick Loop Error]:', err.message);
    }
  }, config.salivaTickMs);
}

function stopSimulation() {
  if (!isRunning) return;

  if (populationIntervalId) {
    clearInterval(populationIntervalId);
    populationIntervalId = null;
  }

  if (salivaIntervalId) {
    clearInterval(salivaIntervalId);
    salivaIntervalId = null;
  }

  if (aiReplenishIntervalId) {
    clearInterval(aiReplenishIntervalId);
    aiReplenishIntervalId = null;
  }

  isRunning = false;
  console.log('🛑 [KKU Simulation]: Simulation engine cleanly stopped. All timers cleared.');
}

function getSimulationStatus() {
  const config = getEnvConfig();
  return {
    running: isRunning,
    lastPopulationRun: lastPopRunTimestamp,
    lastSalivaRun: lastSalivaRunTimestamp,
    config
  };
}

module.exports = {
  startSimulation,
  stopSimulation,
  runPopulationTick,
  runSalivaTick,
  processBirth,
  processDeath,
  processSalivaDecay,
  generateSimulationEvent,
  getSimulationStatus
};
