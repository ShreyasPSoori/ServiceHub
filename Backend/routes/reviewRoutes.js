const express = require('express');
const router = express.Router();
const {
  createReview,
  getServiceReviews,
  getProviderReviews,
  getBookingReview,
  getServiceReviewSummary
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, authorize('customer'), createReview);

router.route('/service/:serviceId')
  .get(getServiceReviews);

router.route('/service/:serviceId/summary')
  .get(getServiceReviewSummary);

router.route('/provider/:providerId')
  .get(getProviderReviews);

router.route('/booking/:bookingId')
  .get(getBookingReview);

module.exports = router;
