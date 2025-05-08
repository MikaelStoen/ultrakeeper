// Project: Lap Tracker System for Backyard Ultra (MERN Stack)

// Directory structure:
// lap-tracker/
// ├── backend/
// │   ├── models/
// │   ├── routes/
// │   ├── controllers/
// │   ├── server.js
// ├── frontend/
// │   ├── src/
// │   ├── public/
// │   ├── vite.config.ts

// === backend/server.js ===
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const athleteRoutes = require('./routes/athleteRoutes');
const lapRoutes = require('./routes/lapRoutes');


app.use('/api/athletes', athleteRoutes);
app.use('/api/laps', lapRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




