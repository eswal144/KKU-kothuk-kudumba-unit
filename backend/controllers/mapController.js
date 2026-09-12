const db = require('../db/database');

// GET /api/map/data
exports.getMapData = (req, res) => {
  db.all('SELECT * FROM map_sectors', [], (err, sectors) => {
    if (err) return res.status(500).json({ error: 'Database error fetching map sectors: ' + err.message });

    db.all('SELECT * FROM map_pois', [], (poiErr, pois) => {
      if (poiErr) return res.status(500).json({ error: 'Database error fetching map POIs: ' + poiErr.message });

      const migrationCorridors = [
        { from: 'SEC-01', to: 'SEC-03', count: 2840, status: 'HIGH_THROUGHPUT' },
        { from: 'SEC-02', to: 'SEC-01', count: 1240, status: 'NORMAL' },
        { from: 'SEC-05', to: 'SEC-06', count: 980, status: 'NORMAL' },
        { from: 'SEC-04', to: 'SEC-02', count: 1650, status: 'EVACUATION' }
      ];

      const totalPop = (sectors || []).reduce((sum, s) => sum + (s.population || 0), 0);
      const totalHosts = (sectors || []).reduce((sum, s) => sum + (s.host_count || 0), 0);

      res.json({
        sectors: sectors || [],
        pois: pois || [],
        migrationCorridors,
        summary: {
          totalSectors: (sectors || []).length,
          totalPopulation: totalPop,
          totalHosts: totalHosts,
          activePOIs: (pois || []).length
        }
      });
    });
  });
};

// GET /api/map/demand-data
exports.getDemandMapData = (req, res) => {
  db.all('SELECT * FROM demand_locations', [], (err, locations) => {
    if (err) return res.status(500).json({ error: 'Database error fetching demand locations: ' + err.message });

    const formattedLocations = (locations || []).map((loc) => {
      const vacancies = loc.required_mosquitoes - loc.current_mosquitoes;
      const isOverstaffed = vacancies <= 0;
      const bloodAvailability = ((loc.humans_detected * 5.0) + (loc.animals_detected * 12.0)).toFixed(1);

      return {
        id: loc.id,
        name: loc.name,
        category: loc.category,
        currentMosquitoes: loc.current_mosquitoes,
        humansDetected: loc.humans_detected,
        animalsDetected: loc.animals_detected,
        requiredMosquitoes: loc.required_mosquitoes,
        vacancies: vacancies > 0 ? vacancies : 0,
        surplus: vacancies < 0 ? Math.abs(vacancies) : 0,
        status: isOverstaffed ? 'OVERSTAFFED' : 'VACANCIES_AVAILABLE',
        demandLevel: loc.demand_level,
        estimatedBloodmL: `${bloodAvailability} mL`,
        lat: loc.lat,
        lng: loc.lng
      };
    });

    const totalMosquitoes = formattedLocations.reduce((sum, l) => sum + l.currentMosquitoes, 0);
    const totalHumans = formattedLocations.reduce((sum, l) => sum + l.humansDetected, 0);
    const totalAnimals = formattedLocations.reduce((sum, l) => sum + l.animalsDetected, 0);
    const totalVacancies = formattedLocations.reduce((sum, l) => sum + l.vacancies, 0);
    const overstaffedCount = formattedLocations.filter((l) => l.status === 'OVERSTAFFED').length;

    res.json({
      locations: formattedLocations,
      summary: {
        totalLocations: formattedLocations.length,
        totalMosquitoes,
        totalHumans,
        totalAnimals,
        totalVacancies,
        overstaffedLocations: overstaffedCount,
        topHighDemand: formattedLocations.find((l) => l.demandLevel === 'CRITICAL' || l.demandLevel === 'HIGH')?.name || 'College Hostel'
      }
    });
  });
};

// POST /api/map/demand/apply
exports.applyForVacancy = (req, res) => {
  const { locationId } = req.body;
  if (!locationId) {
    return res.status(400).json({ error: 'Location ID is required to apply for mosquito vacancy' });
  }

  db.get('SELECT * FROM demand_locations WHERE id = ?', [locationId], (err, loc) => {
    if (err || !loc) {
      return res.status(404).json({ error: 'Demand location not found' });
    }

    db.run('UPDATE demand_locations SET current_mosquitoes = current_mosquitoes + 1 WHERE id = ?', [locationId], function (updateErr) {
      if (updateErr) {
        return res.status(500).json({ error: 'Failed to update mosquito vacancy count: ' + updateErr.message });
      }

      const newCurrent = loc.current_mosquitoes + 1;
      const newVacancies = loc.required_mosquitoes - newCurrent;

      res.json({
        message: `Successfully deployed to ${loc.name}! You are now assigned to this high-demand blood market location.`,
        updatedLocation: {
          id: loc.id,
          name: loc.name,
          currentMosquitoes: newCurrent,
          requiredMosquitoes: loc.required_mosquitoes,
          vacancies: newVacancies > 0 ? newVacancies : 0,
          status: newVacancies <= 0 ? 'OVERSTAFFED' : 'VACANCIES_AVAILABLE'
        }
      });
    });
  });
};

