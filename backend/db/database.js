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

  // Seed Bite Vacancies if empty
  db.get('SELECT COUNT(*) as count FROM bite_vacancies', (err, row) => {
    if (!err && row && row.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO bite_vacancies (location_name, category, latitude, longitude, required_mosquitoes, current_mosquitoes, demand_level, humans_detected, blood_supply_ml, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run('College Hostel', 'Residential', 9.9662, 76.2440, 20, 12, 'HIGH', 43, 239.0, 'Need 8 more mosquitoes here.');
      stmt.run('Night Market Food Court', 'Commercial', 9.9620, 76.2430, 50, 50, 'FILLED', 120, 696.0, '✓ VACANCY FILLED: Night Market is fully staffed.');
      stmt.run('Public Library', 'Study Facility', 9.9680, 76.2415, 30, 41, 'OVERSATURATED', 2, 10.0, 'OVERSATURATED: Too many mosquitoes reported in this sector.');
      stmt.run('Cattle Farm Barn', 'Agricultural', 9.9635, 76.2410, 40, 12, 'URGENT', 3, 315.0, 'Emergency recruitment active: 28 more night-shift citizens required.');
      stmt.run('Subway Station Corridor', 'Transit', 9.9650, 76.2455, 20, 15, 'AVAILABLE', 25, 125.0, '5 open flight positions available near ticket counter.');
      stmt.run('Riverbank Promenade', 'Recreational', 9.9675, 76.2465, 35, 22, 'HIGH', 65, 325.0, 'Sector 4 is currently understaffed. Host availability is unusually high.');
      stmt.finalize();
    }
  });

});


module.exports = db;

