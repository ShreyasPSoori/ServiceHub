const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  deactivateUser,
  activateUser,
  getServices,
  deleteService,
  getBookings,
  getReviews,
  deleteReview
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('admin')); // All routes require admin role

router.route('/stats').get(getStats);

router.route('/users').get(getUsers);
router.route('/users/:id/deactivate').put(deactivateUser);
router.route('/users/:id/activate').put(activateUser);

router.route('/services')
  .get(getServices);
router.route('/services/:id')
  .delete(deleteService);

router.route('/bookings')
  .get(getBookings);

router.route('/reviews')
  .get(getReviews);
router.route('/reviews/:id')
  .delete(deleteReview);

module.exports = router;
