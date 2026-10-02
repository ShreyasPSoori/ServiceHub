const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Availability = require('../models/Availability');

// Helper functions for time overlap
const timeToMins = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minsToTime = (mins) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};


// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private/Customer
exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { serviceId, bookingDate, startTime, notes } = req.body;

    if (!serviceId || !bookingDate || !startTime) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Please provide serviceId, bookingDate, and startTime' });
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid startTime format. Use HH:mm' });
    }

    const bookingDateObj = new Date(bookingDate);
    if (isNaN(bookingDateObj.getTime())) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid bookingDate format' });
    }

    // Check if booking date is in the past
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    if (bookingDateObj < today) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cannot book in the past' });
    }

    const service = await Service.findById(serviceId).session(session).populate('providerId', 'isActive');
    if (!service || !service.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Service not found or inactive' });
    }
    
    if (service.providerId && service.providerId.isActive === false) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Provider account has been deactivated' });
    }

    const startMins = timeToMins(startTime);
    const endMins = startMins + service.duration;
    const endTime = minsToTime(endMins);

    const dayIndex = bookingDateObj.getUTCDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const requestedDay = days[dayIndex];

    // ATOMIC LOCK: We use findOneAndUpdate to acquire a write lock on the provider's availability document for this specific day.
    // If two bookings for the same provider+day arrive at the exact same millisecond, MongoDB will serialize them at this exact line.
    const providerAvailability = await Availability.findOneAndUpdate(
      { providerId: service.providerId._id, dayOfWeek: requestedDay },
      { $set: { updatedAt: new Date() } },
      { session, new: true }
    );

    if (!providerAvailability || !providerAvailability.isAvailable) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Provider is not available on this day' });
    }

    const provStartMins = timeToMins(providerAvailability.startTime);
    const provEndMins = timeToMins(providerAvailability.endTime);

    if (startMins < provStartMins || endMins > provEndMins) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Booking time is outside provider availability' });
    }

    // Prevent double booking for the provider
    const existingBookings = await Booking.find({
      providerId: service.providerId._id,
      bookingDate: new Date(bookingDate),
      status: { $nin: ['rejected', 'cancelled'] }
    }).session(session);

    for (let b of existingBookings) {
      const bStart = timeToMins(b.startTime);
      const bEnd = timeToMins(b.endTime);
      
      // Check for overlap
      if (startMins < bEnd && endMins > bStart) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Provider is already booked at this time' });
      }
    }

    // Booking.create returns an array when passed an array (required to pass {session} options)
    const booking = await Booking.create([{
      customerId: req.user._id,
      providerId: service.providerId._id,
      serviceId: service._id,
      bookingDate,
      startTime,
      endTime,
      notes
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(booking[0]);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    if (
      error.message.includes('Write conflict') || 
      error.message.includes('WriteConflict') || 
      (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError'))
    ) {
      return res.status(409).json({ message: 'This time slot was just booked by another customer. Please choose another time.' });
    }

    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Get logged in customer bookings
// @route   GET /api/bookings/my
// @access  Private/Customer
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id })
      .populate('providerId', 'name email phone profilePicture')
      .populate('serviceId', 'title category price duration')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Get logged in provider bookings
// @route   GET /api/bookings/provider
// @access  Private/Provider
exports.getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.user._id })
      .populate('customerId', 'name email phone profilePicture')
      .populate('serviceId', 'title category price duration')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId providerId', 'name email phone profilePicture')
      .populate('serviceId', 'title category price duration');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (booking.customerId._id.toString() !== req.user._id.toString() &&
        booking.providerId._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Accept booking
// @route   PUT /api/bookings/:id/accept
// @access  Private/Provider
exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Can only accept pending bookings' });
    }

    booking.status = 'accepted';
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Reject booking
// @route   PUT /api/bookings/:id/reject
// @access  Private/Provider
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Can only reject pending bookings' });
    }

    booking.status = 'rejected';
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private/Customer
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot cancel a completed, rejected or already cancelled booking' });
    }

    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Complete booking
// @route   PUT /api/bookings/:id/complete
// @access  Private/Provider
exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only complete an accepted booking' });
    }

    booking.status = 'completed';
    // Optional: mark payment as paid if it's integrated, skipping for now
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
