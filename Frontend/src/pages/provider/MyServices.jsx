import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const MyServices = () => {
  const [services, setServices] = useState([]);
  const { user, token } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMyServices = async () => {
    try {
      // In a real prod app, you might have a specific endpoint like /api/services/me. 
      // Here we fetch all and filter client-side for simplicity, leveraging the public GET endpoint.
      const res = await fetch(`${import.meta.env.VITE_API_URL}/services`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      const myServs = data.filter(s => s.providerId?._id === user._id);
      setServices(myServs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyServices();
    // eslint-disable-next-line
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this service?')) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete service');
      }
      // Remove from UI immediately
      setServices(services.filter(s => s._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="flex mb-2">
        <h2>Manage My Services</h2>
        <Link to="/provider/services/new" className="btn" style={{ backgroundColor: '#27ae60' }}>+ Add New Service</Link>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading ? (
        <p>Loading your services...</p>
      ) : (
        <div className="grid">
          {services.length > 0 ? services.map(s => (
            <div key={s._id} className="card">
              <h3 className="mb-1">{s.title}</h3>
              <p className="badge mb-1">{s.category}</p>
              <div className="flex mb-2">
                <strong style={{ fontSize: '1.2rem' }}>₹{s.price}</strong>
                <span style={{ color: '#777' }}>{s.duration} mins</span>
              </div>
              <div className="flex mt-1" style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <Link to={`/provider/services/edit/${s._id}`} className="btn">Edit</Link>
                <button onClick={() => handleDelete(s._id)} className="btn btn-danger">Delete</button>
              </div>
            </div>
          )) : (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              <p className="mb-1">You haven't listed any services yet.</p>
              <Link to="/provider/services/new" className="btn">Create Your First Service</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default MyServices;
