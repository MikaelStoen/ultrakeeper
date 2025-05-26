// backend/server.js

global.crypto = require('crypto').webcrypto;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

const Athlete = require('./models/Athlete');
const Lap = require('./models/Lap');
const athleteRoutes = require('./routes/athleteRoutes');
const lapRoutes = require('./routes/lapRoutes');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.use('/api/athletes', athleteRoutes);
app.use('/api/laps', lapRoutes);

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

app.post('/admin/wipe-db', async (req, res) => {
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`)
    return res.status(401).send('Unauthorized');
  try {
    await Athlete.deleteMany({});
    await Lap.deleteMany({});
    return res.send('✅ Database wiped');
  } catch (err) {
    console.error('Wipe DB error:', err);
    return res.status(500).send('Error wiping database');
  }
});

app.post('/admin/wipe-laps', async (req, res) => {
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`)
    return res.status(401).send('Unauthorized');
  try {
    await Lap.deleteMany({});
    return res.send('✅ All laps deleted');
  } catch (err) {
    console.error('Wipe laps error:', err);
    return res.status(500).send('Error deleting laps');
  }
});

app.post('/admin/delete-athlete-by-name', async (req, res) => {
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing athlete name' });

  try {
    const athlete = await Athlete.findOneAndDelete({ name });
    if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

    await Lap.deleteMany({ athleteId: athlete._id });
    return res.send(`✅ Athlete "${name}" and their laps deleted`);
  } catch (err) {
    console.error('❌ Failed to delete athlete by name:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const startOfThisH = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const startOfPrevH = new Date(startOfThisH.getTime() - 60 * 60 * 1000);
    const activeAthletes = await Athlete.find({ status: 'active' });
    for (const ath of activeAthletes) {
      const lastLap = await Lap.findOne({ athleteId: ath._id }).sort({ timestamp: -1 });
      if (!lastLap || new Date(lastLap.timestamp) < startOfPrevH) {
        ath.status = 'forfeited';
        await ath.save();
        console.log(`Auto-forfeited ${ath.name}`);
      }
    }
  } catch (err) {
    console.error('Auto-forfeit error:', err);
  }
});

cron.schedule('18 * * * *', () => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(__dirname, 'backups', `dump-${ts}.gz`);
  const cmd = `mongodump --uri="${process.env.MONGO_URI}" --archive="${outFile}" --gzip`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('[Backup] failed:', err.message);
    } else {
      console.log(`[Backup] saved to ${outFile}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
