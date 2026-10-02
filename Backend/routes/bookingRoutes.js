const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getProviderBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Base route requires authentication for all paths
router.use(protect);

router.route('/')
  .post(authorize('customer'), createBooking);

router.route('/my')
  .get(authorize('customer'), getMyBookings);

router.route('/provider')
  .get(authorize('provider'), getProviderBookings);

router.route('/:id')
  .get(getBookingById);

router.route('/:id/accept')
  .put(authorize('provider'), acceptBooking);

router.route('/:id/reject')
  .put(authorize('provider'), rejectBooking);

router.route('/:id/cancel')
  .put(authorize('customer'), cancelBooking);

router.route('/:id/complete')
  .put(authorize('provider'), completeBooking);

module.exports = router;
