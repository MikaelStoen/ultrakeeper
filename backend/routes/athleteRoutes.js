const express = require('express');
const router = express.Router();
const Athlete = require('../models/Athlete');
const Lap = require('../models/Lap');

router.get('/', async (req, res) => {
  const athletes = await Athlete.find();
  const laps = await Lap.find();

  const lapCounts = laps.reduce((acc, lap) => {
    const id = lap.athleteId?.toString();
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const enriched = athletes.map((a) => ({
    ...a._doc,
    lapCount: lapCounts[a._id.toString()] || 0,
  }));

  res.json(enriched);
});

router.post('/register', async (req, res) => {
  const { name, rfid } = req.body;

  if (!name || !rfid) {
    return res.status(400).json({ error: 'Name and RFID are required' });
  }

  try {
    const athlete = new Athlete({
      name,
      rfid,
      status: 'active',
    });
    await athlete.save();
    res.status(201).json(athlete);
  } catch (err) {
    res.status(500).json({ error: 'Failed to register athlete' });
  }
});


router.patch('/:id/forfeit', async (req, res) => {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ error: 'Athlete not found' });
  
    const newStatus = athlete.status === 'forfeited' ? 'active' : 'forfeited';
    athlete.status = newStatus;
    await athlete.save();
  
    res.json(athlete);
  });
  

module.exports = router;
