const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .get(getServices)
  .post(protect, authorize('provider'), createService);

router.route('/:id')
  .get(getServiceById)
  .put(protect, authorize('provider', 'admin'), updateService)
  .delete(protect, authorize('provider', 'admin'), deleteService);

module.exports = router;
