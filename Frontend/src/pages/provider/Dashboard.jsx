import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container">
      <div className="flex mb-2" style={{ alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Provider Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage your services, schedule, and business metrics.</p>
        </div>
      </div>
      
      <div className="card mb-3" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #3730a3 100%)', color: 'white', border: 'none' }}>
        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Welcome back, {user?.name}!</h3>
        <p style={{ color: 'var(--primary-light)' }}>You have access to all provider tools to grow your business.</p>
      </div>
      
      <h3 className="mb-1">Quick Actions</h3>
      <div className="grid mt-1">
        <div className="card card-hover" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderTop: '4px solid var(--primary)' }}>
          <h3 className="mb-1">My Services</h3>
          <p className="mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>View, edit, or delete the services you currently offer on the marketplace.</p>
          <Link to="/provider/services" className="btn btn-primary" style={{ width: '100%' }}>Manage Services</Link>
        </div>
        
        <div className="card card-hover" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderTop: '4px solid var(--success)' }}>
          <h3 className="mb-1">Add New Service</h3>
          <p className="mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create a brand new service listing to reach more customers immediately.</p>
          <Link to="/provider/services/new" className="btn btn-success" style={{ width: '100%' }}>+ Add Service</Link>
        </div>
        
        <div className="card card-hover" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderTop: '4px solid #8b5cf6' }}>
          <h3 className="mb-1">Availability</h3>
          <p className="mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Set your weekly working hours to let customers know when to book you.</p>
          <Link to="/provider/availability" className="btn" style={{ background: '#8b5cf6', color: 'white', width: '100%' }}>Manage Availability</Link>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
