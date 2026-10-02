const Service = require('../models/Service');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res) => {
  try {
    const query = {};

    // Support basic filtering/searching
    if (req.query.category) {
      query.category = { $regex: req.query.category, $options: 'i' };
    }
    
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    // Populate provider info, explicitly omitting password
    let services = await Service.find(query)
      .populate('providerId', '-password')
      .sort('-createdAt');
      
    // Filter out services where the provider has been deactivated
    services = services.filter(s => s.providerId && s.providerId.isActive !== false);
      
    res.json(services);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('providerId', '-password');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Provider
exports.createService = async (req, res) => {
  try {
    const { title, description, price, category, duration, images } = req.body;

    if (!title || !description || !price || !category || !duration) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Set provider ID to the logged in user
    const service = await Service.create({
      providerId: req.user._id,
      title,
      description,
      price,
      category,
      duration,
      images
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Provider/Admin
exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Make sure user is service owner OR admin
    if (service.providerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json(service);
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Provider/Admin
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Make sure user is service owner OR admin
    if (service.providerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }

    await service.deleteOne();

    res.json({ message: 'Service removed successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : 'Server Error',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};
