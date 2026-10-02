require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

// Initialize app
const app = express();

// Connect to database
connectDB();

// Middlewares
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'], // fallback for local dev
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json()); // Allows parsing JSON payloads

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'ServiceHub API is running.' });
});

const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
