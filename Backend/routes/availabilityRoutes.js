const express = require('express');
const router = express.Router();
const {
  getMyAvailability,
  updateAvailability,
  getProviderAvailability
} = require('../controllers/availabilityController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/my')
  .get(protect, authorize('provider'), getMyAvailability);

router.route('/')
  .put(protect, authorize('provider'), updateAvailability);

router.route('/provider/:providerId')
  .get(getProviderAvailability);

module.exports = router;
