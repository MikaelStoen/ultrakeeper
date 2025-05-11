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
    const [hours, minutes] = timestamp.split(':').map(Number);
    const customTime = new Date();
    customTime.setHours(hours, minutes, 0, 0);
    finalTimestamp = customTime;
  }

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
  const { rfid } = req.body;
  if (!rfid) return res.status(400).json({ error: 'RFID missing' });

  // Find athlete by RFID
  const athlete = await Athlete.findOne({ rfid });
  if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

  const now = new Date();
  // Calculate start of current lap cycle (top of hour)
  const lapStart = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0
  );

  
  // Enforce 10-minute grace period
  if (now - lapStart < TEN_MINUTES_MS) {
    return res.status(400).json({ error: 'Too early: wait at least 10 minutes into the lap to scan' });
  }

  // Prevent multiple scans in this cycle
  const existing = await Lap.findOne({
    athleteId: athlete._id,
    timestamp: { $gte: lapStart }
  });
  if (existing) {
    return res.status(400).json({ error: 'Lap already recorded for this cycle' });
  }


  // Save the scan lap
  const lap = new Lap({ athleteId: athlete._id, timestamp: now, source: 'scan' });
  try {
    await lap.save();
    return res.status(201).json({ message: `Lap recorded for ${athlete.name}` });
  } catch (err) {
    console.error('Scan lap save failed:', err);
    return res.status(500).json({ error: 'Failed to save scan lap' });
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

module.exports = router;
