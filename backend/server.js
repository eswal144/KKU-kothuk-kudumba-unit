const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const kkuRoutes = require('./routes/kkuRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const mapRoutes = require('./routes/mapRoutes');
const populationRoutes = require('./routes/populationRoutes');
const rechargeRoutes = require('./routes/rechargeRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const pensionRoutes = require('./routes/pensionRoutes');
const simulationService = require('./services/simulationService');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration (allow requests from Next.js frontend)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', populationRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', mapRoutes);
app.use('/api', kkuRoutes);
app.use('/api', rechargeRoutes);
app.use('/api', simulationRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/pension', pensionRoutes);

// Root endpoint info
app.get('/', (req, res) => {
  res.json({
    name: 'KKU (Kothuk Kudumba Unit) Backend API',
    status: 'online',
    simulation: 'Groq AI Civilization Engine Active',
    authEndpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me (JWT Protected)',
      updateProfile: 'PUT /api/auth/profile (JWT Protected)'
    }
  });
});

const simulationEngine = require('./services/simulationEngine');

// Start Server & Background KKU Civilization Engine
const server = app.listen(PORT, () => {
  console.log(`🚀 KKU Backend API Server running on http://localhost:${PORT}`);
  simulationEngine.startSimulation();
});

// Graceful Shutdown
function handleShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down KKU civilization server...`);
  simulationEngine.stopSimulation();
  server.close(() => {
    console.log('💤 KKU HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

