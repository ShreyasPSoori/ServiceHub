import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">ServiceHub</Link>
        <div className="navbar-links">
          <Link to="/services">Marketplace</Link>
          {user ? (
            <>
              {user.role === 'customer' && <Link to="/my-bookings">My Bookings</Link>}
              {user.role === 'provider' && (
                <>
                  <Link to="/provider/dashboard">Dashboard</Link>
                  <Link to="/provider/bookings">Manage Bookings</Link>
                  <Link to="/provider/availability">Manage Availability</Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link to="/admin">Dashboard</Link>
                  <Link to="/admin/users">Users</Link>
                  <Link to="/admin/services">Services</Link>
                  <Link to="/admin/bookings">Bookings</Link>
                  <Link to="/admin/reviews">Reviews</Link>
                </>
              )}
              <span className="user-greeting" style={{ marginLeft: '1rem' }}>Hi, {user.name}</span>
              <button onClick={handleLogout} className="btn btn-danger" style={{ marginLeft: '1rem', padding: '0.4rem 1rem' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ fontWeight: 600 }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ marginLeft: '1rem' }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
