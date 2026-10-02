const Review = require('../models/Review');
const Booking = require('../models/Booking');

exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ message: 'Please provide bookingId and rating' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    if (comment && comment.length > 1000) {
      return res.status(400).json({ message: 'Comment exceeds maximum length of 1000 characters' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review your own bookings' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed bookings' });
    }

    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Booking has already been reviewed' });
    }

    const review = await Review.create({
      customerId: req.user._id,
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      bookingId,
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Booking has already been reviewed' });
    }
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.getServiceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.serviceId })
      .populate('customerId', 'name profilePicture')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId })
      .populate('customerId', 'name profilePicture')
      .populate('serviceId', 'title category')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.getBookingReview = async (req, res) => {
  try {
    const review = await Review.findOne({ bookingId: req.params.bookingId })
      .populate('customerId', 'name profilePicture');
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.getServiceReviewSummary = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const reviews = await Review.find({ serviceId });
    
    let totalReviews = reviews.length;
    let sum = 0;
    let distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

    reviews.forEach(r => {
      sum += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    let averageRating = totalReviews > 0 ? (sum / totalReviews) : 0;
    averageRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal

    res.json({
      averageRating,
      totalReviews,
      distribution
    });
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
