const express = require('express');
const router = express.Router();
const Lap = require('../models/Lap');
const Athlete = require('../models/Athlete');

// Constants for timing
const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * POST /api/laps
 * Manual lap entry: always allowed, overrides scan restrictions.
 * If athlete was forfeited, resets them to active.
 */
router.post('/', async (req, res) => {
  const { athleteId, timestamp, source } = req.body;

  // Ensure athlete exists
  const athlete = await Athlete.findById(athleteId);
  if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

  // Determine final timestamp
  let finalTimestamp = new Date(); // default now
  if (timestamp && typeof timestamp === 'string') {
    const [hours, minutes,seconds=0] = timestamp.split(':').map(Number);
    const customTime = new Date();
    customTime.setHours(hours, minutes, seconds, 0);
    finalTimestamp = customTime;
  }

  const lapHourStart = new Date(finalTimestamp);
  lapHourStart.setMinutes(0, 0, 0);
  const lapHourEnd = new Date(lapHourStart.getTime() + 60 * 60 * 1000);

  await Lap.deleteMany({
    athleteId: athlete._id,
    timestamp: {
      $gte: lapHourStart,
      $lt: lapHourEnd,
    }
  });


  // Save the manual lap
  const lap = new Lap({ athleteId, timestamp: finalTimestamp, source: source || 'manual' });
  try {
    await lap.save();
    // If athlete was forfeited, reset to active
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

/**
 * POST /api/laps/scan
 * Scan-based lap entry, with restrictions:
 * - No scans within first 10 minutes of the lap cycle
 * - Only one scan per athlete per cycle
 * - Athlete must exist
 */
router.post('/scan', async (req, res) => {
  const { rfid, station = 'finish' } = req.body;
  if (!rfid) return res.status(400).json({ error: 'RFID missing' });
  if (!['finish', 'checkpoint'].includes(station))
    return res.status(400).json({ error: 'Invalid station type' });

  const athlete = await Athlete.findOne({ rfid });
  if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

  const now = new Date();
  const lapStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

  // Enforce 10-minute grace period for finish laps only
  if (station === 'finish' && now - lapStart < TEN_MINUTES_MS) {
    return res.status(400).json({ error: 'Too early: wait at least 10 minutes into the lap to scan' });
  }

  // Prevent multiple scans of same type per hour
  const existing = await Lap.findOne({
    athleteId: athlete._id,
    source: station,
    timestamp: { $gte: lapStart }
  });
  if (existing) {
    return res.status(400).json({ error: `${station === 'checkpoint' ? 'Checkpoint' : 'Lap'} already recorded this hour` });
  }

  const lap = new Lap({ athleteId: athlete._id, timestamp: now, source: station });
  try {
    await lap.save();

    const elapsedMs = now.getTime() - lapStart.getTime();
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');

    return res.status(201).json({
      message: `${station === 'checkpoint' ? 'Checkpoint' : 'Lap'} recorded for ${athlete.name}, time: ${minutes}:${seconds}`
    });
  } catch (err) {
    console.error('Scan save failed:', err);
    return res.status(500).json({ error: 'Failed to save scan' });
  }
});

/**
 * GET /api/laps
 * List all laps
 */
router.get('/', async (req, res) => {
  try {
    const laps = await Lap.find().populate('athleteId');
    return res.json(laps);
  } catch (err) {
    console.error('Failed to fetch laps:', err);
    return res.status(500).json({ error: 'Failed to fetch laps' });
  }
});

/**
 * DELETE /api/laps/:id
 * Admin-only: remove a specific lap by its Mongo _id
 */
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
