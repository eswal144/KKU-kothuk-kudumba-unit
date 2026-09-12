const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

// Helper: Generate unique KKU-ID (e.g. KKU-8F29A1) with collision retry
function generateKkuId() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KKU-${code}`;
}

function getUniqueKkuId(callback, retries = 10) {
  const id = generateKkuId();
  db.get('SELECT id FROM mosquito_profiles WHERE kku_id = ?', [id], (err, row) => {
    if (err) return callback(err, null);
    if (row && retries > 0) return getUniqueKkuId(callback, retries - 1);
    if (row && retries <= 0) return callback(new Error('Could not generate unique KKU-ID after max retries'), null);
    callback(null, id);
  });
}

// 1. REGISTER USER & CREATE MOSQUITO PROFILE
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      name,
      species,
      gender,
      location,
      blood_preference,
      age,
      bite_count,
      dengue_risk,
      health_status,
      employment
    } = req.body;

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Mosquito name is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    db.get('SELECT id FROM users WHERE email = ?', [cleanEmail], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already registered in KKU system.' });
      }

      // Hash password securely with bcrypt
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Insert User into DB
      db.run(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [cleanEmail, password_hash],
        function (insertUserErr) {
          if (insertUserErr) {
            return res.status(500).json({ error: 'Failed to create user: ' + insertUserErr.message });
          }

          const userId = this.lastID;

          // Get a collision-safe unique KKU-ID
          getUniqueKkuId((idErr, kku_id) => {
            if (idErr) {
              return res.status(500).json({ error: 'Failed to generate KKU-ID: ' + idErr.message });
            }

            const parsedAge = parseInt(age, 10);
            const parsedBites = parseInt(bite_count, 10);

            const profileData = {
              user_id: userId,
              kku_id,
              name: name.trim(),
              species: species?.trim() || 'Aedes aegypti',
              age: !isNaN(parsedAge) ? parsedAge : 14,
              gender: gender?.trim() || 'Female',
              location: location?.trim() || 'Bathroom',
              blood_preference: blood_preference?.trim() || 'O+',
              bite_count: !isNaN(parsedBites) ? parsedBites : 17,
              blood_collected: parseFloat((0.8 + Math.random() * 1.5).toFixed(1)),
              health_status: health_status?.trim() || 'Active',
              dengue_risk: dengue_risk?.trim() || 'HIGH',
              employment: employment?.trim() || 'Night Shift Biter',
              social_status: 'Elite Swarm Member',
              pension_status: 'Vested Tier-1',
              life_history: `Born under a tropical leaf near water reservoir. Registered into KKU ecosystem as ${name.trim()}.`
            };

            // Insert Mosquito Profile
            db.run(
              `INSERT INTO mosquito_profiles (
                user_id, kku_id, name, species, age, gender, location, blood_preference,
                bite_count, blood_collected, health_status, dengue_risk, employment, social_status,
                pension_status, life_history
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                profileData.user_id,
                profileData.kku_id,
                profileData.name,
                profileData.species,
                profileData.age,
                profileData.gender,
                profileData.location,
                profileData.blood_preference,
                profileData.bite_count,
                profileData.blood_collected,
                profileData.health_status,
                profileData.dengue_risk,
                profileData.employment,
                profileData.social_status,
                profileData.pension_status,
                profileData.life_history
              ],
              function (insertProfileErr) {
                if (insertProfileErr) {
                  return res.status(500).json({ error: 'Failed to create profile: ' + insertProfileErr.message });
                }

                // Seed initial Bank, Health, and Notifications for new citizen
                db.run('INSERT INTO bank_accounts (user_id, resource_balance, community_status, emergency_reserve) VALUES (?, 3.2, ?, ?)', [userId, 'STABLE', '82%']);
                db.run('INSERT INTO health_records (user_id, health_percent, status, wing_condition, last_check) VALUES (?, 82, ?, ?, ?)', [userId, 'Healthy', 'Normal', 'Today']);
                db.run('INSERT INTO social_notifications (user_id, message) VALUES (?, ?)', [userId, `Welcome to KKU, ${profileData.name}! Your citizen profile is active.`]);
                db.run('INSERT INTO social_notifications (user_id, message) VALUES (?, ?)', [userId, 'Anitha started following your flight logs.']);
                db.run('INSERT INTO social_notifications (user_id, message) VALUES (?, ?)', [userId, 'Your night patrol mission was approved.']);

                // Generate JWT Token
                const token = jwt.sign(
                  { id: userId, email: cleanEmail, kku_id },
                  process.env.JWT_SECRET || 'kku_mosquito_secret_key',
                  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
                );

                res.status(201).json({
                  message: 'Welcome to KKU! Mosquito identity created successfully.',
                  token,
                  user: { id: userId, email: cleanEmail },
                  profile: profileData
                });
              }
            );
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration: ' + error.message });
  }
};

// 2. LOGIN USER
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    db.get('SELECT id, email, password_hash FROM users WHERE email = ?', [cleanEmail], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database query failed: ' + err.message });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Fetch Profile
      db.get('SELECT * FROM mosquito_profiles WHERE user_id = ?', [user.id], (profErr, profile) => {
        if (profErr || !profile) {
          return res.status(500).json({ error: 'Failed to fetch mosquito profile.' });
        }

        // Generate JWT
        const token = jwt.sign(
          { id: user.id, email: user.email, kku_id: profile.kku_id },
          process.env.JWT_SECRET || 'kku_mosquito_secret_key',
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: { id: user.id, email: user.email },
          profile
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login: ' + error.message });
  }
};

// 3. GET CURRENT PROFILE (PROTECTED)
exports.getProfile = (req, res) => {
  const userId = req.user.id;

  db.get('SELECT * FROM mosquito_profiles WHERE user_id = ?', [userId], (err, profile) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    if (!profile) {
      return res.status(404).json({ error: 'Mosquito profile not found.' });
    }

    res.json({
      user: { id: req.user.id, email: req.user.email },
      profile
    });
  });
};

// 4. UPDATE PROFILE (PROTECTED)
exports.updateProfile = (req, res) => {
  const userId = req.user.id;
  const { name, species, gender, location, blood_preference, employment, life_history, dengue_risk } = req.body;

  db.get('SELECT * FROM mosquito_profiles WHERE user_id = ?', [userId], (err, profile) => {
    if (err || !profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const updatedName = name?.trim() || profile.name;
    const updatedSpecies = species?.trim() || profile.species;
    const updatedGender = gender?.trim() || profile.gender;
    const updatedLocation = location?.trim() || profile.location;
    const updatedBloodPref = blood_preference?.trim() || profile.blood_preference;
    const updatedEmployment = employment?.trim() || profile.employment;
    const updatedHistory = life_history?.trim() || profile.life_history;
    const updatedDengueRisk = dengue_risk?.trim() || profile.dengue_risk || 'HIGH';

    db.run(
      `UPDATE mosquito_profiles SET
        name = ?, species = ?, gender = ?, location = ?, blood_preference = ?,
        employment = ?, life_history = ?, dengue_risk = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        updatedName,
        updatedSpecies,
        updatedGender,
        updatedLocation,
        updatedBloodPref,
        updatedEmployment,
        updatedHistory,
        updatedDengueRisk,
        userId
      ],
      function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: 'Failed to update profile: ' + updateErr.message });
        }

        db.get('SELECT * FROM mosquito_profiles WHERE user_id = ?', [userId], (fetchErr, newProfile) => {
          res.json({
            message: 'Mosquito profile updated successfully',
            profile: newProfile
          });
        });
      }
    );
  });
};
