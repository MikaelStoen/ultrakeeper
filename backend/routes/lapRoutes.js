// === backend/routes/lapRoutes.js ===
const express = require('express');
const router = express.Router();
const Lap = require('../models/Lap');

router.post('/', async (req, res) => {
  const { athleteId, timestamp, source } = req.body;
  const lap = new Lap({
    athleteId,
    if (timestamp) {
      const [hours, minutes] = timestamp.split(':');
      const now = new Date();
      now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      now.setSeconds(0, 0);
      finalTimestamp = now;
    },
    source: source || 'scan',
  });
  await lap.save();
  res.status(201).json(lap);
});


router.get('/', async (req, res) => {
  const laps = await Lap.find().populate('athleteId');
  res.json(laps);
});

module.exports = router;
