const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { 
    type: String, 
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], 
    required: true 
  },
  isAvailable: { type: Boolean, default: false },
  startTime: { type: String, default: null },
  endTime: { type: String, default: null }
}, { timestamps: true });

availabilitySchema.index({ providerId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
