const simulationEngine = require('./simulationEngine');

module.exports = {
  runSimulationTick: simulationEngine.runPopulationTick,
  startSimulationLoop: simulationEngine.startSimulation,
  stopSimulationLoop: simulationEngine.stopSimulation,
  getSimulationStatus: simulationEngine.getSimulationStatus,
  ...simulationEngine
};
