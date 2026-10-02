import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const ProviderBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/provider`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load bookings');
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [token]);

  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this booking?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Failed to ${action} booking`);
      }
      fetchBookings(); // Refresh
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="container loading-state">Loading bookings...</div>;

  return (
    <div className="container">
      <h2 className="mb-2">Manage Customer Bookings</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      
      {bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>You have no bookings yet.</p>
        </div>
      ) : (
        <div className="grid">
          {bookings.map(b => (
            <div key={b._id} className="card" style={{ borderLeft: b.status === 'pending' ? '4px solid #f39c12' : b.status === 'accepted' ? '4px solid #3498db' : b.status === 'completed' ? '4px solid #27ae60' : '4px solid #e74c3c' }}>
              <div className="flex mb-1">
                <h3 style={{ margin: 0 }}>{b.serviceId?.title || 'Unknown Service'}</h3>
                <span className="badge" style={{ textTransform: 'capitalize' }}>{b.status}</span>
              </div>
              <p><strong>Customer:</strong> {b.customerId?.name || 'Unknown'}</p>
              <p><strong>Contact:</strong> <a href={`mailto:${b.customerId?.email}`}>{b.customerId?.email}</a></p>
              <p><strong>Date:</strong> {new Date(b.bookingDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {b.startTime} - {b.endTime}</p>
              {b.notes && <p><strong>Notes:</strong> {b.notes}</p>}
              
              <div className="flex mt-1" style={{ borderTop: '1px solid #eee', paddingTop: '1rem', gap: '0.5rem' }}>
                {b.status === 'pending' && (
                  <>
                    <button className="btn" style={{ backgroundColor: '#27ae60', flex: 1 }} onClick={() => handleAction(b._id, 'accept')}>Accept</button>
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleAction(b._id, 'reject')}>Reject</button>
                  </>
                )}
                {b.status === 'accepted' && (
                  <button className="btn" style={{ backgroundColor: '#2980b9', width: '100%' }} onClick={() => handleAction(b._id, 'complete')}>Mark Completed</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ProviderBookings;
