// === backend/routes/lapRoutes.js ===
const express = require('express');
const router = express.Router();
const Lap = require('../models/Lap');
const Athlete = require('../models/Athlete');

const TEN_MINUTES_MS = 10 * 60 * 1000;

router.post('/', async (req, res) => {
  const { athleteId, timestamp, source } = req.body;
  const athlete = await Athlete.findById(athleteId);
  if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

  let finalTimestamp = new Date();
  if (timestamp && typeof timestamp === 'string') {
    const [hours, minutes, seconds = 0] = timestamp.split(':').map(Number);
    const customTime = new Date();
    customTime.setHours(hours, minutes, seconds, 0);
    finalTimestamp = customTime;
  }

  const lapHourStart = new Date(finalTimestamp);
  lapHourStart.setMinutes(0, 0, 0);

  await Lap.deleteMany({
    athleteId: athlete._id,
    timestamp: { $gte: lapHourStart, $lt: new Date(lapHourStart.getTime() + 3600000) }
  });

  const lap = new Lap({ athleteId, timestamp: finalTimestamp, source: source || 'manual' });

  try {
    await lap.save();
    if (athlete.status === 'forfeited') {
      athlete.status = 'active';
      await athlete.save();
    }
    return res.status(201).json(lap);
  } catch (err) {
    console.error('Manual lap save failed:', err);
    return res.status(500).json({ error: 'Failed to save manual lap' });
  }
});

router.post('/scan', async (req, res) => {
  const { rfid } = req.body;
  if (!rfid) return res.status(400).json({ error: 'RFID missing' });

  const athlete = await Athlete.findOne({ rfid });
  if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

  const now = new Date();
  const lapHourStart = new Date(now);
  lapHourStart.setMinutes(0, 0, 0);

  if (now.getMinutes() < 10) {
    return res.status(400).json({ error: 'Too early in lap cycle' });
  }

  const existing = await Lap.findOne({
    athleteId: athlete._id,
    source: { $ne: 'checkpoint' },
    timestamp: { $gte: lapHourStart }
  });
  if (existing) {
    return res.status(400).json({ error: 'Lap already recorded this hour' });
  }

  const lap = new Lap({
    athleteId: athlete._id,
    timestamp: now,
    source: 'scan'
  });

  try {
    await lap.save();
    return res.status(201).json({ message: `Lap recorded for ${athlete.name}` });
  } catch (err) {
    console.error('Lap scan save failed:', err);
    return res.status(500).json({ error: 'Failed to save scanned lap' });
  }
});

router.get('/', async (req, res) => {
  try {
    const laps = await Lap.find().populate('athleteId');
    return res.json(laps);
  } catch (err) {
    console.error('Failed to fetch laps:', err);
    return res.status(500).json({ error: 'Failed to fetch laps' });
  }
});

router.delete('/:id', async (req, res) => {
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const lap = await Lap.findByIdAndDelete(req.params.id);
    if (!lap) return res.status(404).json({ error: 'Lap not found' });
    return res.sendStatus(204);
  } catch (err) {
    console.error('Failed to delete lap:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;