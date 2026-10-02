const Availability = require('../models/Availability');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeToMins = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

exports.getMyAvailability = async (req, res) => {
  try {
    const availabilities = await Availability.find({ providerId: req.user._id });
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const schedule = req.body;
    if (!Array.isArray(schedule)) {
      return res.status(400).json({ message: 'Schedule must be an array' });
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const seenDays = new Set();
    
    for (let day of schedule) {
      if (!validDays.includes(day.dayOfWeek)) {
        return res.status(400).json({ message: `Invalid day: ${day.dayOfWeek}` });
      }
      if (seenDays.has(day.dayOfWeek)) {
        return res.status(400).json({ message: `Duplicate day: ${day.dayOfWeek}` });
      }
      seenDays.add(day.dayOfWeek);

      if (day.isAvailable) {
        if (!timeRegex.test(day.startTime) || !timeRegex.test(day.endTime)) {
          return res.status(400).json({ message: `Invalid time format for ${day.dayOfWeek}. Use HH:mm` });
        }
        if (timeToMins(day.startTime) >= timeToMins(day.endTime)) {
          return res.status(400).json({ message: `startTime must be before endTime on ${day.dayOfWeek}` });
        }
      }
    }

    const operations = schedule.map(day => ({
      updateOne: {
        filter: { providerId: req.user._id, dayOfWeek: day.dayOfWeek },
        update: {
          $set: {
            isAvailable: day.isAvailable,
            startTime: day.isAvailable ? day.startTime : null,
            endTime: day.isAvailable ? day.endTime : null
          }
        },
        upsert: true
      }
    }));

    await Availability.bulkWrite(operations);
    const updated = await Availability.find({ providerId: req.user._id });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.getProviderAvailability = async (req, res) => {
  try {
    const availabilities = await Availability.find({ providerId: req.params.providerId })
      .select('dayOfWeek isAvailable startTime endTime -_id');
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
