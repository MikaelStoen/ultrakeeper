// === backend/routes/lapRoutes.js ===
const express = require('express');
const router = express.Router();
const Lap = require('../models/Lap');

router.post('/', async (req, res) => {
  const { athleteId, timestamp, source } = req.body;

  let finalTimestamp = new Date(); // default = now

  if (timestamp && typeof timestamp === 'string') {
    const [hours, minutes] = timestamp.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    finalTimestamp = now;
  }

  const lap = new Lap({
    athleteId,
    timestamp: finalTimestamp,
    source: source || 'scan',
  });

  try {
    await lap.save();
    res.status(201).json(lap);
  } catch (err) {
    console.error('Lap save failed:', err);
    res.status(500).json({ error: 'Failed to save lap' });
  }
});

router.post('/scan', async (req, res) => {
  const { rfid } = req.body;
  if (!rfid) return res.status(400).json({ error: 'RFID missing' });

  const athlete = await Athlete.findOne({ rfid });
  if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

  const lap = new Lap({
    athleteId: athlete._id,
    timestamp: new Date(),
    source: 'scan',
  });

  await lap.save();
  res.status(201).json({ message: `Lap recorded for ${athlete.name}` });
});



router.get('/', async (req, res) => {
  const laps = await Lap.find().populate('athleteId');
  res.json(laps);
});

module.exports = router;
