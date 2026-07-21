const mongoose = require('mongoose');

const OfficerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    badge_id: { type: String, required: true },
    department: { type: String },
    role: { type: String, default: 'officer' }
});

module.exports = mongoose.model('Officer', OfficerSchema);