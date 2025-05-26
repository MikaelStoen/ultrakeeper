// backend/server.js
const express       = require('express');
const mongoose      = require('mongoose');
const cors          = require('cors');
const cron          = require('node-cron');
const { exec }      = require('child_process');
const path          = require('path');
require('dotenv').config();

const Athlete       = require('./models/Athlete');
const Lap           = require('./models/Lap');
const athleteRoutes = require('./routes/athleteRoutes');
const lapRoutes     = require('./routes/lapRoutes');
const checkpointRoutes = require('./routes/checkpointRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// ——— Connect to MongoDB ———
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ——— Public API routes ———
app.use('/api/athletes', athleteRoutes);
app.use('/api/laps',     lapRoutes);
app.use('/api/checkpoints', checkpointRoutes);


// ——— Admin routes ———
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

app.post('/admin/restart', (req, res) => {
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`)
    return res.status(401).send('Unauthorized');
  exec('docker-compose restart', err => {
    if (err) {
      console.error('Restart error:', err);
      return res.status(500).send(err.message);
    }
    return res.send('🔁 Services restarting');
  });
});

// ——— Auto-forfeit job: every hour on the hour ———
cron.schedule('0 * * * *', async () => {
  try {
    const now            = new Date();
    const startOfThisH   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const startOfPrevH   = new Date(startOfThisH.getTime() - 60 * 60 * 1000);
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

// ——— Hourly backup job (Windows) ———
// Runs at minute 5 every hour: uses mongodump to gzip an archive into /backups
cron.schedule('18 * * * *', () => {
  const ts      = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(__dirname, 'backups', `dump-${ts}.gz`);
  // If mongodump.exe is on your PATH, this works:
  const cmd     = `mongodump --uri="${process.env.MONGO_URI}" --archive="${outFile}" --gzip`;
  // Otherwise, replace `mongodump` with the full path to mongodump.exe

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('[Backup] failed:', err.message);
    } else {
      console.log(`[Backup] saved to ${outFile}`);
    }
  });
});

// ——— Start the server ———
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
