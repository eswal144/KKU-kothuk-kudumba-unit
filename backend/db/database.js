const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || 'kku.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite3 database:', err.message);
  } else {
    console.log(`Connected to SQLite3 database at: ${dbPath}`);
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');

  // 1. Users / Authentication Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Mosquito Profiles Table
  db.run(`
    CREATE TABLE IF NOT EXISTS mosquito_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      kku_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      species TEXT DEFAULT 'Aedes aegypti',
      age INTEGER DEFAULT 14,
      gender TEXT DEFAULT 'Female',
      location TEXT DEFAULT 'Angamaly, Kerala',
      blood_preference TEXT DEFAULT 'O Negative (Sweet & Warm)',
      bite_count INTEGER DEFAULT 42,
      blood_collected REAL DEFAULT 1.2,
      health_status TEXT DEFAULT 'Vibrant & Active',
      employment TEXT DEFAULT 'Night Patrol Specialist',
      social_status TEXT DEFAULT 'Elite Swarm Member',
      pension_status TEXT DEFAULT 'Vested Tier-1',
      dengue_risk TEXT DEFAULT 'HIGH',
      life_history TEXT DEFAULT 'Born under a tropical leaf near water tank 4. Joined KKU ecosystem.',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Ensure columns exist for existing SQLite databases
  db.run(`ALTER TABLE mosquito_profiles ADD COLUMN dengue_risk TEXT DEFAULT 'HIGH'`, () => {});
  db.run(`ALTER TABLE mosquito_profiles ADD COLUMN is_active INTEGER DEFAULT 1`, () => {});
  db.run(`ALTER TABLE mosquito_profiles ADD COLUMN deceased_at DATETIME`, () => {});

  // 3. Jobs Table
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      payout_nectar INTEGER NOT NULL,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Population Stats Table
  db.run(`
    CREATE TABLE IF NOT EXISTS population_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_population INTEGER NOT NULL DEFAULT 1284920,
      births_today INTEGER NOT NULL DEFAULT 382,
      deaths_today INTEGER NOT NULL DEFAULT 217,
      migration_today INTEGER NOT NULL DEFAULT 1240,
      growth_rate REAL NOT NULL DEFAULT 0.8,
      date TEXT UNIQUE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`ALTER TABLE population_stats ADD COLUMN date TEXT UNIQUE`, () => {});
  db.run(`ALTER TABLE bank_accounts ADD COLUMN user_id INTEGER`, () => {});
  db.run(`ALTER TABLE bank_accounts ADD COLUMN resource_balance REAL DEFAULT 3.2`, () => {});
  db.run(`ALTER TABLE bank_accounts ADD COLUMN community_status TEXT DEFAULT 'STABLE'`, () => {});
  db.run(`ALTER TABLE bank_accounts ADD COLUMN emergency_reserve TEXT DEFAULT '82%'`, () => {});


  // 5. Bank Accounts Table
  db.run(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      resource_balance REAL NOT NULL DEFAULT 3.2,
      community_status TEXT NOT NULL DEFAULT 'STABLE',
      emergency_reserve TEXT NOT NULL DEFAULT '82%',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 6. Health Records Table
  db.run(`
    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      health_percent INTEGER NOT NULL DEFAULT 82,
      status TEXT NOT NULL DEFAULT 'Healthy',
      wing_condition TEXT NOT NULL DEFAULT 'Normal',
      last_check TEXT NOT NULL DEFAULT 'Today',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 7. Social Notifications Table
  db.run(`
    CREATE TABLE IF NOT EXISTS social_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      read_status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 8. Migration Alerts Table
  db.run(`
    CREATE TABLE IF NOT EXISTS migration_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      level TEXT DEFAULT 'WARNING',
      sector TEXT DEFAULT 'Sector 04',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 9. Leaderboard Stats Table
  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kku_id TEXT NOT NULL,
      name TEXT NOT NULL,
      bite_count INTEGER NOT NULL DEFAULT 0,
      blood_collected REAL NOT NULL DEFAULT 0,
      humans_escaped INTEGER NOT NULL DEFAULT 0,
      survival_days INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 10. Population Events Table
  db.run(`
    CREATE TABLE IF NOT EXISTS population_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 11. Emergency Alerts Table
  db.run(`
    CREATE TABLE IF NOT EXISTS emergency_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'HIGH',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // SEED SAMPLE DATA IF TABLES ARE EMPTY

  // Seed Jobs
  db.get('SELECT COUNT(*) as count FROM jobs', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO jobs (title, description, payout_nectar) VALUES (?, ?, ?)');
      stmt.run('Night Patrol Squad', 'Monitor light traps and warning beacons in Zone 04', 450);
      stmt.run('Nectar Harvester', 'Gather high-grade floral nectar from herbal gardens', 300);
      stmt.run('Wing Dispatcher', 'Coordinate flight paths across nocturnal corridors', 600);
      stmt.finalize();
    }
  });

  // Seed Population Stats
  db.get('SELECT COUNT(*) as count FROM population_stats', (err, row) => {
    if (!err && row && row.count === 0) {
      const todayDate = new Date().toISOString().split('T')[0];
      db.run(`INSERT INTO population_stats (total_population, births_today, deaths_today, migration_today, growth_rate, date)
              VALUES (1284920, 382, 217, 1240, 0.8, ?)`, [todayDate]);
    }
  });


  // Seed Migration Alerts
  db.get('SELECT COUNT(*) as count FROM migration_alerts', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO migration_alerts (message, level, sector) VALUES (?, ?, ?)');
      stmt.run('Host availability is low in Sector 04.', 'WARNING', 'Sector 04');
      stmt.run('Optimal humidity corridor detected near River Reservoir.', 'INFO', 'Sector 02');
      stmt.run('2,840 mosquitoes migrated to Alappuzha.', 'SUCCESS', 'Sector 09');
      stmt.run('High repellent concentration detected in Sector 01.', 'CRITICAL', 'Sector 01');
      stmt.finalize();
    }
  });

  // Seed Leaderboard (Mosquito Operatives Only)
  db.get('SELECT COUNT(*) as count FROM leaderboard_stats', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO leaderboard_stats (kku_id, name, bite_count, blood_collected, humans_escaped, survival_days) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run('KKU-8F29A1', 'Bite Tyson', 847, 24.5, 142, 28);
      stmt.run('KKU-7NPH5B', 'Buzz Aldrin', 802, 22.1, 138, 25);
      stmt.run('KKU-39AF12', 'Wingston Churchill', 791, 20.8, 119, 22);
      stmt.run('KKU-91KK8C', 'Mosq Norris', 714, 18.9, 105, 20);
      stmt.run('KKU-44MZ09', 'Flyoncé Knowles', 680, 17.4, 98, 19);
      stmt.run('KKU-55BT99', 'Lord Bitemore', 642, 16.2, 89, 18);
      stmt.run('KKU-77SN02', 'Snoop Wing', 598, 15.0, 77, 16);
      stmt.run('KKU-11VL01', 'Vlad the Stinger', 545, 13.8, 64, 15);
      stmt.finalize();
    }
  });

  // Seed Population Events
  db.get('SELECT COUNT(*) as count FROM population_events', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO population_events (event_type, icon, description) VALUES (?, ?, ?)');
      stmt.run('BIRTH', '🍼', 'KKU-92AF31 was born under Reservoir Leaf #4 in Kochi.');
      stmt.run('ARCHIVE', '⚰️', 'KKU-19AF82 has completed its 32-day natural life cycle.');
      stmt.run('MIGRATION', '🛫', '2,840 citizens migrated from Kochi → Alappuzha.');
      stmt.run('PROMOTION', '🎖️', 'KKU-8F29A1 promoted to Chief Night Patrol Commander.');
      stmt.finalize();
    }
  });

  // Seed Emergency Alerts
  db.get('SELECT COUNT(*) as count FROM emergency_alerts', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO emergency_alerts (title, message, severity) VALUES (?, ?, ?)');
      stmt.run('SWAT ALERT', 'High human activity and electric racket swatters detected in Sector 04.', 'CRITICAL');
      stmt.run('HOST SHORTAGE', 'Host availability critically low in Zone 3 due to air conditioning.', 'WARNING');
      stmt.run('BLOOD RESOURCE ALERT', 'Community reserve below 15% threshold in Sector 02.', 'INFO');
      stmt.finalize();
    }
  });

  // 12. Map Sectors Table
  db.run(`
    CREATE TABLE IF NOT EXISTS map_sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      lat REAL DEFAULT 9.9312,
      lng REAL DEFAULT 76.2673,
      population INTEGER NOT NULL DEFAULT 100000,
      humidity INTEGER NOT NULL DEFAULT 80,
      risk_level TEXT DEFAULT 'LOW',
      host_density TEXT DEFAULT 'HIGH',
      host_count INTEGER DEFAULT 50000
    )
  `);

  // 13. Map POIs Table
  db.run(`
    CREATE TABLE IF NOT EXISTS map_pois (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      sector_code TEXT NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      lat REAL DEFAULT 9.9312,
      lng REAL DEFAULT 76.2673,
      status TEXT DEFAULT 'ACTIVE'
    )
  `);

  // Ensure lat/lng columns exist on existing databases
  db.run(`ALTER TABLE map_sectors ADD COLUMN lat REAL DEFAULT 9.9312`, () => {});
  db.run(`ALTER TABLE map_sectors ADD COLUMN lng REAL DEFAULT 76.2673`, () => {});
  db.run(`ALTER TABLE map_pois ADD COLUMN lat REAL DEFAULT 9.9312`, () => {});
  db.run(`ALTER TABLE map_pois ADD COLUMN lng REAL DEFAULT 76.2673`, () => {});

  // Seed Map Sectors if empty
  db.get('SELECT COUNT(*) as count FROM map_sectors', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO map_sectors (code, name, x, y, lat, lng, population, humidity, risk_level, host_density, host_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run('SEC-01', 'Kochi Sovereign Sector', 180, 220, 9.9312, 76.2673, 428200, 88, 'LOW', 'CRITICAL_HIGH', 84000);
      stmt.run('SEC-02', 'Angamaly Northern Wing', 280, 130, 10.1960, 76.3860, 184500, 84, 'MEDIUM', 'MODERATE', 42000);
      stmt.run('SEC-03', 'Alappuzha Waterways', 140, 340, 9.4981, 76.3388, 312000, 95, 'LOW', 'HIGH', 61000);
      stmt.run('SEC-04', 'Thrissur Patrol Zone', 320, 90, 10.5276, 76.2144, 210400, 76, 'HIGH', 'LOW_DEFICIT', 15000);
      stmt.run('SEC-05', 'Kottayam Herbal Basin', 290, 310, 9.5916, 76.5222, 154800, 89, 'LOW', 'HIGH', 39000);
      stmt.run('SEC-06', 'Trivandrum South Fortress', 220, 440, 8.5241, 76.9366, 512000, 82, 'MEDIUM', 'CRITICAL_HIGH', 95000);
      stmt.finalize();
    }
  });

  // Seed Map POIs if empty
  db.get('SELECT COUNT(*) as count FROM map_pois', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare('INSERT INTO map_pois (type, title, description, sector_code, x, y, lat, lng, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      
      // Small Locality Street-Level POIs (Kochi Locality Cluster)
      stmt.run('HOST', 'Residential Block Alpha (Human Hosts)', 'Over 450 sleeping human hosts in local apartment cluster.', 'SEC-01', 200, 240, 9.9662, 76.2440, 'ACTIVE');
      stmt.run('HOST', 'Dairy Cattle Shed (Warm Blood)', 'High-grade animal blood source near local canal.', 'SEC-01', 130, 360, 9.9635, 76.2410, 'ACTIVE');
      
      // Shortages / Repellant
      stmt.run('SHORTAGE', 'Electric Swatter & Coils (Danger)', 'Active liquid vapor repellant & electric swatters in market street.', 'SEC-01', 330, 100, 9.9620, 76.2430, 'ALERT');
      
      // Jobs
      stmt.run('JOB', 'Locality Street Recon Mission', 'Patrol streetlamp corridor 4 and report host availability.', 'SEC-01', 160, 200, 9.9680, 76.2415, 'OPEN');
      stmt.run('JOB', 'Nectar Extraction Task', 'Gather fresh floral nectar from local herbal garden.', 'SEC-01', 300, 320, 9.9675, 76.2460, 'OPEN');

      // Hospitals
      stmt.run('HOSPITAL', 'Locality Wing Clinic #1', 'Wing repair, dewdrop hydration, and parasite check.', 'SEC-01', 190, 210, 9.9640, 76.2450, 'OPERATIONAL');
      
      // Recharge
      stmt.run('RECHARGE', 'Dewdrop & Nectar Station #4', 'High-sugar floral nectar reserves & morning dew drops.', 'SEC-01', 270, 140, 9.9650, 76.2445, 'FULL');

      // Community
      stmt.run('COMMUNITY', 'Neighborhood Swarm Assembly', 'Local mosquito council chamber & frequency beacon.', 'SEC-01', 230, 450, 9.9655, 76.2435, 'ACTIVE');
      stmt.finalize();
    }
  });

  // 14. Demand Locations Table (Mosquito Demand & Job Vacancy Map)
  db.run(`
    CREATE TABLE IF NOT EXISTS demand_locations (

      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      current_mosquitoes INTEGER NOT NULL DEFAULT 10,
      humans_detected INTEGER NOT NULL DEFAULT 10,
      animals_detected INTEGER NOT NULL DEFAULT 0,
      required_mosquitoes INTEGER NOT NULL DEFAULT 20,
      demand_level TEXT DEFAULT 'HIGH',
      lat REAL DEFAULT 9.9650,
      lng REAL DEFAULT 76.2425
    )
  `);

  // Seed Demand Locations if empty
  db.get('SELECT COUNT(*) as count FROM demand_locations', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO demand_locations (name, category, current_mosquitoes, humans_detected, animals_detected, required_mosquitoes, demand_level, lat, lng)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run('College Hostel', 'Residential', 17, 43, 2, 50, 'HIGH', 9.9662, 76.2440);
      stmt.run('Public Library', 'Study Facility', 94, 2, 0, 15, 'LOW', 9.9680, 76.2415);
      stmt.run('Night Market Food Court', 'Commercial', 28, 120, 8, 110, 'CRITICAL', 9.9620, 76.2430);
      stmt.run('Cattle Farm Barn', 'Agricultural', 12, 3, 25, 40, 'HIGH', 9.9635, 76.2410);
      stmt.run('Subway Station Corridor', 'Transit', 60, 10, 0, 20, 'LOW', 9.9650, 76.2455);
      stmt.finalize();
    }
  });

  // 15. Saliva Reserves Table
  db.run(`
    CREATE TABLE IF NOT EXISTS saliva_reserves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mosquito_id INTEGER UNIQUE NOT NULL,
      current_saliva_nl REAL NOT NULL,
      maximum_saliva_nl REAL NOT NULL,
      alert_low_sent INTEGER DEFAULT 0,
      alert_empty_sent INTEGER DEFAULT 0,
      last_recharged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mosquito_id) REFERENCES mosquito_profiles (id) ON DELETE CASCADE
    )
  `);

  db.run(`ALTER TABLE saliva_reserves ADD COLUMN alert_low_sent INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE saliva_reserves ADD COLUMN alert_empty_sent INTEGER DEFAULT 0`, () => {});

  // 16. KKU Events Table (Civilization Events & Notifications)
  db.run(`
    CREATE TABLE IF NOT EXISTS kku_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      citizen_id TEXT,
      metadata TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 17. AI Message & Name Pool Table (Persistent Groq AI Queue)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_message_pool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      name TEXT,
      title TEXT,
      message TEXT NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 18. Bite Vacancies Table (Mosquito Bite Marketplace)
  db.run(`
    CREATE TABLE IF NOT EXISTS bite_vacancies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      required_mosquitoes INTEGER NOT NULL,
      current_mosquitoes INTEGER NOT NULL,
      demand_level TEXT DEFAULT 'HIGH',
      humans_detected INTEGER DEFAULT 10,
      blood_supply_ml REAL DEFAULT 50.0,
      message TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 19. Job Applications Table
  db.run(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vacancy_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'ACCEPTED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vacancy_id) REFERENCES bite_vacancies (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Seed Bite Vacancies if empty or add extra locations
  const initialVacancies = [
    ['College Hostel', 'Residential', 9.9662, 76.2440, 20, 12, 'HIGH', 43, 239.0, 'Need 8 more mosquitoes here.'],
    ['Night Market Food Court', 'Commercial', 9.9620, 76.2430, 50, 50, 'FILLED', 120, 696.0, '✓ VACANCY FILLED: Night Market is fully staffed.'],
    ['Public Library', 'Study Facility', 9.9680, 76.2415, 30, 41, 'OVERSATURATED', 2, 10.0, 'OVERSATURATED: Too many mosquitoes reported in this sector.'],
    ['Cattle Farm Barn', 'Agricultural', 9.9635, 76.2410, 40, 12, 'URGENT', 3, 315.0, 'Emergency recruitment active: 28 more night-shift citizens required.'],
    ['Subway Station Corridor', 'Transit', 9.9650, 76.2455, 20, 15, 'AVAILABLE', 25, 125.0, '5 open flight positions available near ticket counter.'],
    ['Riverbank Promenade', 'Recreational', 9.9675, 76.2465, 35, 22, 'HIGH', 65, 325.0, 'Sector 4 is currently understaffed. Host availability is unusually high.'],
    ['Marine Drive Walkway', 'Waterfront', 9.9780, 76.2770, 25, 10, 'URGENT', 80, 380.0, '🚨 URGENT: High human pedestrian density reported along water promenade.'],
    ['Fort Kochi Fishery Wharf', 'Harbor', 9.9655, 76.2395, 30, 14, 'HIGH', 35, 180.0, 'Fishery workers resting outdoors. Need 16 biter squadrons.'],
    ['Lulu Mall Open Atrium', 'Commercial', 10.0275, 76.3080, 45, 20, 'URGENT', 150, 720.0, '🚨 MEGA OUTBREAK: Open-air dining terrace with dense host presence.'],
    ['Infopark Tech Terrace', 'Technology Hub', 10.0125, 76.3630, 35, 15, 'HIGH', 90, 410.0, 'Late-night coders outdoors on tea break. Open bite roster.'],
    ['Vyttila Mobility Terminal', 'Transit Hub', 9.9670, 76.3190, 40, 18, 'URGENT', 110, 540.0, '🚨 SQUADRON ALERT: Dense passenger crowds at bus terminal.'],
    ['Broadway Spice Alley', 'Marketplace', 9.9720, 76.2810, 28, 12, 'HIGH', 55, 260.0, 'Spice market porters taking evening siesta.'],
    ['Panampilly Nagar Park', 'Recreational', 9.9610, 76.2950, 22, 8, 'HIGH', 45, 220.0, 'Evening joggers resting near central fountain area.'],
    ['Ernakulam South Railway Station', 'Transit Hub', 9.9678, 76.2895, 38, 15, 'URGENT', 95, 450.0, '🚨 URGENT SIREN: Sleeper coach passengers awaiting midnight train.'],
    ['Mattancherry Spice Bazaar', 'Marketplace', 9.9575, 76.2590, 28, 10, 'HIGH', 60, 290.0, 'Spice warehouse loaders resting by canal dock.'],
    ['Jawaharlal Nehru Stadium Outer Ring', 'Sports Arena', 10.0030, 76.3005, 45, 18, 'URGENT', 130, 620.0, '🚨 CODE RED: Night football fans leaving stadium concourse.'],
    ['MG Road Commercial Promenade', 'Commercial', 9.9710, 76.2825, 32, 14, 'HIGH', 75, 360.0, 'Shoppers gathering at open street tea stalls.'],
    ['High Court Water Jetty', 'Transit Waterfront', 9.9820, 76.2755, 26, 9, 'URGENT', 68, 330.0, '🚨 WATER JETTY OUTBREAK: Ferry commuters queuing outdoors.'],
    ['Thoppumpady Harbor Bridge', 'Bridge Corridor', 9.9380, 76.2620, 30, 12, 'HIGH', 50, 240.0, 'Fishermen sorting fresh catch under bridge illumination.'],
    ['Cherai Beach Sunset Palms', 'Coastal Resort', 10.1410, 76.1785, 35, 16, 'URGENT', 85, 410.0, '🚨 BEACHFRONT ALERT: Tourists relaxing along palm fringe.'],
    ['Edappally Toll Crossing', 'Traffic Corridor', 10.0245, 76.3095, 42, 20, 'HIGH', 115, 550.0, 'Dense intersection slowdown with open auto-rickshaws.'],
    ['Willingdon Island Cargo Docks', 'Industrial Port', 9.9520, 76.2680, 34, 11, 'URGENT', 70, 340.0, '🚨 DOCKS ALERT: Container crew night shift on open wharf.'],
    ['Vennala Market Crossing', 'Marketplace', 10.0010, 76.3210, 24, 8, 'HIGH', 48, 230.0, 'Vegetable wholesale trucks unloading in open air.'],
    ['Kakkanad SmartCity Water Edge', 'Tech Campus', 10.0080, 76.3580, 36, 15, 'URGENT', 88, 420.0, '🚨 TECH PARK EMERGENCY: Open amphitheater gathering.'],
    ['Palarivattom Junction Flyover', 'Transit', 10.0045, 76.3115, 30, 14, 'HIGH', 62, 300.0, 'Street food kiosks bustling with customers.'],
    ['Tripunithura Hill Palace Grounds', 'Heritage Park', 9.9525, 76.3530, 28, 10, 'HIGH', 40, 195.0, 'Evening walkers strolling near historic moat gardens.'],
    ['Kumbalangi Backwater Mangroves', 'Eco Reserve', 9.8780, 76.2840, 50, 22, 'URGENT', 140, 680.0, '🚨 MASSIVE SWARM SINK: Backwater homestay guests outdoors.'],
    ['Bolgatty Palace Island Lawn', 'Heritage Waterfront', 9.9880, 76.2685, 30, 12, 'URGENT', 72, 350.0, '🚨 OPEN AIR LAWN: Wedding banquet in unshielded lawn area.']
  ];

  const vacStmt = db.prepare(`
    INSERT OR IGNORE INTO bite_vacancies (location_name, category, latitude, longitude, required_mosquitoes, current_mosquitoes, demand_level, humans_detected, blood_supply_ml, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  initialVacancies.forEach(v => vacStmt.run(...v));
  vacStmt.finalize();

  // 20. MOSQ-HOSPITAL Patients Table
  db.run(`
    CREATE TABLE IF NOT EXISTS hospital_patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mosquito_id INTEGER,
      patient_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      condition TEXT NOT NULL,
      severity TEXT DEFAULT 'MODERATE',
      biting_capability INTEGER DEFAULT 25,
      recovery_percentage INTEGER DEFAULT 40,
      status TEXT DEFAULT 'HOSPITALIZED',
      admitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      estimated_discharge DATETIME,
      discharged_at DATETIME,
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mosquito_id) REFERENCES mosquito_profiles (id) ON DELETE SET NULL
    )
  `);

  // 21. Blood Reserve Table (Fictional Resource Simulation)
  db.run(`
    CREATE TABLE IF NOT EXISTS blood_reserve (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_amount_ml REAL NOT NULL DEFAULT 824.6,
      maximum_capacity_ml REAL NOT NULL DEFAULT 1000.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 22. Hospital Events Table
  db.run(`
    CREATE TABLE IF NOT EXISTS hospital_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      icon TEXT DEFAULT '🏥',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      patient_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Blood Reserve if empty
  db.get('SELECT COUNT(*) as count FROM blood_reserve', (err, row) => {
    if (!err && row && row.count === 0) {
      db.run('INSERT INTO blood_reserve (current_amount_ml, maximum_capacity_ml) VALUES (824.6, 1000.0)');
    }
  });

  // Seed Hospital Patients if empty
  db.get('SELECT COUNT(*) as count FROM hospital_patients', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO hospital_patients 
        (patient_code, name, condition, severity, biting_capability, recovery_percentage, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 14 initial patients in diverse states: 2 Critical, 7 Injured, 5 Recovering
      stmt.run('MOS-271', 'Bite Tyson', 'Wing Injury', 'MODERATE', 12, 67, 'HOSPITALIZED', 'Admitted after an unfortunate disagreement with a ceiling fan.');
      stmt.run('MOS-104', 'Buzz Aldrin', 'Swat Impact', 'CRITICAL', 8, 34, 'CRITICAL', 'Direct blunt trauma from human rolled-up newspaper in Sector 04.');
      stmt.run('MOS-382', 'Wingston Churchill', 'Flight Fatigue', 'MILD', 45, 88, 'RECOVERING', 'Exhaustion following 6-hour marathon hovering session near verandah light.');
      stmt.run('MOS-419', 'Mosq Norris', 'Fan Collision', 'SEVERE', 15, 42, 'INJURED', 'Mid-air collision with high-speed table fan rotor.');
      stmt.run('MOS-512', 'Flyonce Knowles', 'Antenna Damage', 'MODERATE', 30, 71, 'RECOVERING', 'Antenna bent during sudden host head turn.');
      stmt.run('MOS-663', 'Lord Bitemore', 'Swat Impact', 'CRITICAL', 5, 29, 'CRITICAL', 'Electric swatter glancing blow; proboscis defibrillation administered.');
      stmt.run('MOS-771', 'Snoop Wing', 'Leg Injury', 'MODERATE', 35, 58, 'INJURED', 'Left hind leg caught in mosquito net mesh.');
      stmt.run('MOS-805', 'Vlad the Stinger', 'Host Encounter Injury', 'SEVERE', 18, 46, 'INJURED', 'Host slapped reflexively during evening feed.');
      stmt.run('MOS-899', 'Captain McBiteface', 'Wing Injury', 'MODERATE', 22, 63, 'HOSPITALIZED', 'Turbulence sprain near kitchen exhaust vent.');
      stmt.run('MOS-921', 'Inspector Proboscis', 'Antenna Damage', 'MILD', 40, 79, 'RECOVERING', 'Antenna sensory overload near burning mosquito coil.');
      stmt.run('MOS-311', 'Baron Von Buzz', 'Leg Injury', 'MODERATE', 28, 54, 'INJURED', 'Tangled in synthetic fabric fibers.');
      stmt.run('MOS-455', 'Bitey Baggins', 'Flight Fatigue', 'MILD', 50, 85, 'RECOVERING', 'Low sucrose sugar crash during monsoon downpour flight.');
      stmt.run('MOS-732', 'General Stinger', 'Unknown Mosquito Incident', 'SEVERE', 10, 39, 'INJURED', 'Found disoriented near ultrasonic repeller device.');
      stmt.run('MOS-840', 'Doctor Proboscis', 'Wing Injury', 'MILD', 42, 91, 'RECOVERING', 'Minor wing fraying; responding well to sugar nectar therapy.');

      // Seed 9 discharged today for historical telemetry
      stmt.run('MOS-110', 'Swatson', 'Wing Injury', 'MILD', 100, 100, 'DISCHARGED', 'Cleared for flight and returned to civilian swarming.');
      stmt.run('MOS-115', 'Agent Nectar', 'Flight Fatigue', 'MILD', 100, 100, 'DISCHARGED', 'Recharged with glucose drip; flight cleared.');
      stmt.run('MOS-120', 'Count Drakula', 'Swat Impact', 'MODERATE', 100, 100, 'DISCHARGED', 'Wing realignment procedure 100% successful.');

      stmt.finalize();
    }
  });

  // Seed Hospital Events if empty
  db.get('SELECT COUNT(*) as count FROM hospital_events', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO hospital_events (event_type, icon, title, message, patient_name)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run('ADMISSION', '🚑', 'NEW ADMISSION', 'Bite Tyson has been admitted after an unfortunate disagreement with a ceiling fan.', 'Bite Tyson');
      stmt.run('CONDITION_UPDATE', '⚠️', 'CONDITION UPDATE', "Wingston's recovery increased to 88% under nectar therapy.", 'Wingston Churchill');
      stmt.run('DISCHARGE', '✅', 'PATIENT DISCHARGED', 'Swatson has been cleared for flight and has returned to civilian life.', 'Swatson');
      stmt.run('ADMISSION', '🚑', 'NEW ADMISSION', 'Buzz Aldrin rushed to ICU after severe newspaper swat impact.', 'Buzz Aldrin');
      stmt.run('RESOURCE', '🩸', 'BLOOD RESERVE STABLE', 'Community blood reserves stabilized at 824.6 mL (82% capacity).', null);
      stmt.finalize();
    }
  });

  // 13. MOSQ-PENSION TABLES (Fictional KKU Government Simulation)
  db.run(`
    CREATE TABLE IF NOT EXISTS pension_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mosquito_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'PENDING',
      pension_amount REAL DEFAULT 0.0,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      expires_at DATETIME,
      review_notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mosquito_id) REFERENCES mosquito_profiles (id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pension_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mosquito_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      monthly_amount REAL NOT NULL,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mosquito_id) REFERENCES mosquito_profiles (id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS service_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mosquito_id INTEGER NOT NULL,
      service_type TEXT NOT NULL DEFAULT 'CIVILIAN_FEEDER',
      service_days INTEGER NOT NULL DEFAULT 14,
      blood_collected_ml REAL NOT NULL DEFAULT 12.5,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      is_veteran INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mosquito_id) REFERENCES mosquito_profiles (id) ON DELETE CASCADE
    )
  `);

  // 24. Blood Bank Reserves Table (Fictional Resource Economy)
  db.run(`
    CREATE TABLE IF NOT EXISTS blood_bank_reserves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reserve_type TEXT UNIQUE NOT NULL,
      current_amount_ml REAL NOT NULL DEFAULT 0,
      maximum_capacity_ml REAL NOT NULL DEFAULT 1000,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 25. Blood Bank Transactions Table
  db.run(`
    CREATE TABLE IF NOT EXISTS blood_bank_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mosquito_id INTEGER,
      mosquito_code TEXT,
      transaction_type TEXT NOT NULL,
      reserve_type TEXT NOT NULL,
      amount_ml REAL NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 26. Mosquito Bank Stats Table (Donor tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS mosquito_bank_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mosquito_id INTEGER UNIQUE,
      mosquito_code TEXT UNIQUE,
      name TEXT,
      total_donated_ml REAL DEFAULT 0,
      total_received_ml REAL DEFAULT 0,
      last_donation_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 27. Blood Donation Drives Table
  db.run(`
    CREATE TABLE IF NOT EXISTS blood_donation_drives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reserve_type TEXT NOT NULL,
      target_amount_ml REAL NOT NULL,
      current_amount_ml REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      message TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Blood Bank Reserves (Exact required starting balances: Total 2,847 ml)
  const defaultReserves = [
    ['EMERGENCY', 1200.0, 2000.0],
    ['PENSION', 847.0, 1500.0],
    ['COMMUNITY', 800.0, 1500.0],
    ['VETERAN', 0.0, 500.0]
  ];
  const resStmt = db.prepare(`
    INSERT OR IGNORE INTO blood_bank_reserves (reserve_type, current_amount_ml, maximum_capacity_ml)
    VALUES (?, ?, ?)
  `);
  defaultReserves.forEach(r => resStmt.run(...r));
  resStmt.finalize();

  // Seed Initial Top Donors in mosquito_bank_stats if empty
  db.get('SELECT COUNT(*) as count FROM mosquito_bank_stats', (err, row) => {
    if (!err && row && row.count === 0) {
      const donorStmt = db.prepare(`
        INSERT INTO mosquito_bank_stats (mosquito_code, name, total_donated_ml, total_received_ml, last_donation_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      donorStmt.run('M0S-019', 'General Wingston', 42.0, 0);
      donorStmt.run('M0S-081', 'Baroness Buzz', 37.0, 0);
      donorStmt.run('M0S-122', 'Inspector Proboscis', 29.0, 0);
      donorStmt.run('M0S-042', 'Count Bitey', 18.5, 0);
      donorStmt.run('M0S-112', 'Bite Tyson', 12.0, 2.3);
      donorStmt.finalize();
    }
  });

  // Seed Initial Transactions if empty
  db.get('SELECT COUNT(*) as count FROM blood_bank_transactions', (err, row) => {
    if (!err && row && row.count === 0) {
      const txStmt = db.prepare(`
        INSERT INTO blood_bank_transactions (mosquito_code, transaction_type, reserve_type, amount_ml, reason, status)
        VALUES (?, ?, ?, ?, ?, 'COMPLETED')
      `);
      txStmt.run('M0S-042', 'DONATION', 'COMMUNITY', 1.0, 'Community blood donation');
      txStmt.run('M0S-271', 'EMERGENCY_ALLOCATION', 'EMERGENCY', -2.4, 'Hospital emergency support');
      txStmt.run('M0S-112', 'PENSION_ALLOCATION', 'PENSION', -2.3, 'Monthly pension allocation');
      txStmt.finalize();
    }
  });

  // Seed sample donation drive if empty
  db.get('SELECT COUNT(*) as count FROM blood_donation_drives', (err, row) => {
    if (!err && row && row.count === 0) {
      db.run(`
        INSERT INTO blood_donation_drives (reserve_type, target_amount_ml, current_amount_ml, status, message)
        VALUES ('PENSION', 214.0, 83.0, 'ACTIVE', 'Mosq-Net needs you. Stabilize the pension reserve for aging night biter veterans.')
      `);
    }
  });
});

module.exports = db;


