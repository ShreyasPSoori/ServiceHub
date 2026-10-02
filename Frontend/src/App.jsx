import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import ServiceDetails from './pages/ServiceDetails';
import Dashboard from './pages/provider/Dashboard';
import MyServices from './pages/provider/MyServices';
import ServiceForm from './pages/provider/ServiceForm';
import ProviderBookings from './pages/provider/Bookings';
import ProviderAvailability from './pages/provider/Availability';
import MyBookings from './pages/customer/MyBookings';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminServices from './pages/admin/Services';
import AdminBookings from './pages/admin/Bookings';
import AdminReviews from './pages/admin/Reviews';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Public Service Routes */}
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetails />} />
        
        {/* Customer Protected Route */}
        <Route path="/my-bookings" element={
          <ProtectedRoute><MyBookings /></ProtectedRoute>
        } />
        
        {/* Provider Routes */}
        <Route path="/provider/dashboard" element={
          <ProtectedRoute roleRequired="provider"><Dashboard /></ProtectedRoute>
        } />
        <Route path="/provider/services" element={
          <ProtectedRoute roleRequired="provider"><MyServices /></ProtectedRoute>
        } />
        <Route path="/provider/services/new" element={
          <ProtectedRoute roleRequired="provider"><ServiceForm /></ProtectedRoute>
        } />
        <Route path="/provider/services/edit/:id" element={
          <ProtectedRoute roleRequired="provider"><ServiceForm /></ProtectedRoute>
        } />
        <Route path="/provider/bookings" element={
          <ProtectedRoute roleRequired="provider"><ProviderBookings /></ProtectedRoute>
        } />
        <Route path="/provider/availability" element={
          <ProtectedRoute roleRequired="provider"><ProviderAvailability /></ProtectedRoute>
        } />
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute roleRequired="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roleRequired="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute roleRequired="admin"><AdminServices /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute roleRequired="admin"><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute roleRequired="admin"><AdminReviews /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
export default App;
