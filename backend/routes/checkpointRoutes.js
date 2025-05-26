// === backend/routes/checkpointRoutes.js ===
const express = require('express');
const router = express.Router();
const Lap = require('../models/Lap');
const Athlete = require('../models/Athlete');

router.post('/scan', async (req, res) => {
  console.log('📥 Checkpoint scan route hit');
  const { rfid } = req.body;
  if (!rfid) return res.status(400).json({ error: 'RFID missing' });

  const athlete = await Athlete.findOne({ rfid });
  if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

  const now = new Date();
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

  const existing = await Lap.findOne({
    athleteId: athlete._id,
    source: 'checkpoint',
    timestamp: { $gte: cycleStart }
  });
  if (existing) {
    return res.status(400).json({ error: 'Checkpoint already recorded this hour' });
  }

  const lap = new Lap({
    athleteId: athlete._id,
    timestamp: now,
    source: 'checkpoint'
  });

  console.log('💾 Saving checkpoint lap:', {
    athleteId: lap.athleteId.toString(),
    timestamp: lap.timestamp.toISOString(),
    source: lap.source
  });

  try {
    await lap.save();
    const elapsedMs = now - cycleStart;
    const secs = Math.floor(elapsedMs / 1000);
    const mins = String(Math.floor(secs / 60)).padStart(2, '0');
    const s    = String(secs % 60).padStart(2, '0');
    return res.status(201).json({ message: `Checkpoint recorded for ${athlete.name}, time: ${mins}:${s}` });
  } catch (err) {
    console.error('Checkpoint save failed:', err);
    return res.status(500).json({ error: 'Failed to save checkpoint' });
  }
});

module.exports = router;