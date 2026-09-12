const dotenv = require('dotenv');
dotenv.config();

const simulationService = require('./services/simulationService');

async function test() {
  console.log('Testing Groq KKU Simulation Service with real Groq AI model...');
  try {
    const result = await simulationService.runSimulationTick();
    console.log('Simulation Tick Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Simulation Error:', err);
    process.exit(1);
  }
}

test();
