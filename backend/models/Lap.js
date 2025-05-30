
// === backend/models/Lap.js ===
const mongoose = require('mongoose');

const lapSchema = new mongoose.Schema({
  athleteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete' },
  timestamp: { type: Date, default: Date.now },
  source: { type: String, default: 'scan' },
});

module.exports = mongoose.model('Lap', lapSchema);