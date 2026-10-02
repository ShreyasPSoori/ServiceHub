const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Availability = require('../models/Availability');

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProviders = await User.countDocuments({ role: 'provider' });
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalReviews = await Review.countDocuments();

    res.json({
      customers: totalUsers,
      providers: totalProviders,
      services: totalServices,
      bookings: totalBookings,
      reviews: totalReviews
    });
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot deactivate another admin' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot deactivate yourself' });
    }

    user.isActive = false;
    await user.save();
    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    await user.save();
    res.json({ message: 'User activated successfully', user });
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().populate('providerId', 'name email').sort('-createdAt');
    res.json(services);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service removed successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customerId', 'name email')
      .populate('providerId', 'name email')
      .populate('serviceId', 'title')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('customerId', 'name email')
      .populate('providerId', 'name email')
      .populate('serviceId', 'title')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review removed successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
