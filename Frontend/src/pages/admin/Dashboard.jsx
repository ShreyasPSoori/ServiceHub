import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.message && !data.customers) throw new Error(data.message);
      setStats(data);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="container loading-state">Loading dashboard...</div>;

  return (
    <div className="container">
      <div className="flex mb-2" style={{ alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Admin Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Platform overview and moderation tools.</p>
        </div>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="card mb-3" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color: 'white', border: 'none' }}>
        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Welcome Administrator, {user?.name}</h3>
        <p style={{ color: '#94a3b8' }}>Here is the current platform overview.</p>
      </div>

      {stats && (
        <div className="grid">
          <div className="card card-hover" style={{ textAlign: 'center', padding: '2rem', borderTop: '4px solid #3b82f6' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>Customers</h3>
            <h2 style={{ fontSize: '3rem', color: '#3b82f6', margin: '0.5rem 0 1.5rem 0' }}>{stats.customers}</h2>
            <Link to="/admin/users" className="btn btn-secondary" style={{ width: '100%' }}>View Users</Link>
          </div>
          <div className="card card-hover" style={{ textAlign: 'center', padding: '2rem', borderTop: '4px solid #10b981' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>Providers</h3>
            <h2 style={{ fontSize: '3rem', color: '#10b981', margin: '0.5rem 0 1.5rem 0' }}>{stats.providers}</h2>
            <Link to="/admin/users" className="btn btn-secondary" style={{ width: '100%' }}>View Users</Link>
          </div>
          <div className="card card-hover" style={{ textAlign: 'center', padding: '2rem', borderTop: '4px solid #8b5cf6' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>Services</h3>
            <h2 style={{ fontSize: '3rem', color: '#8b5cf6', margin: '0.5rem 0 1.5rem 0' }}>{stats.services}</h2>
            <Link to="/admin/services" className="btn btn-secondary" style={{ width: '100%' }}>View Services</Link>
          </div>
          <div className="card card-hover" style={{ textAlign: 'center', padding: '2rem', borderTop: '4px solid #f59e0b' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>Bookings</h3>
            <h2 style={{ fontSize: '3rem', color: '#f59e0b', margin: '0.5rem 0 1.5rem 0' }}>{stats.bookings}</h2>
            <Link to="/admin/bookings" className="btn btn-secondary" style={{ width: '100%' }}>View Bookings</Link>
          </div>
          <div className="card card-hover" style={{ textAlign: 'center', padding: '2rem', borderTop: '4px solid #eab308' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase' }}>Reviews</h3>
            <h2 style={{ fontSize: '3rem', color: '#eab308', margin: '0.5rem 0 1.5rem 0' }}>{stats.reviews}</h2>
            <Link to="/admin/reviews" className="btn btn-secondary" style={{ width: '100%' }}>View Reviews</Link>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
