// === backend/models/Athlete.js ===
const mongoose = require('mongoose');

const athleteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rfid: { type: String, required: true, unique: true },
  status: { type: String, default: 'active' },
});

module.exports = mongoose.model('Athlete', athleteSchema);