import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import ReviewForm from '../../components/ReviewForm';

const BookingItem = ({ b, token, onCancel }) => {
  const [review, setReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    if (b.status === 'completed') {
      setLoadingReview(true);
      fetch(`${import.meta.env.VITE_API_URL}/reviews/booking/${b._id}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.message) { 
            setReview(data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingReview(false));
    }
  }, [b.status, b._id]);

  return (
    <div className="card" style={{ borderLeft: b.status === 'pending' ? '4px solid #f39c12' : b.status === 'accepted' ? '4px solid #3498db' : b.status === 'completed' ? '4px solid #27ae60' : '4px solid #e74c3c' }}>
      <div className="flex mb-1">
        <h3 style={{ margin: 0 }}>{b.serviceId?.title || 'Unknown Service'}</h3>
        <span className="badge" style={{ textTransform: 'capitalize' }}>{b.status}</span>
      </div>
      <p><strong>Provider:</strong> {b.providerId?.name || 'Unknown'}</p>
      <p><strong>Date:</strong> {new Date(b.bookingDate).toLocaleDateString()}</p>
      <p><strong>Time:</strong> {b.startTime} - {b.endTime}</p>
      {b.notes && <p><strong>Notes:</strong> {b.notes}</p>}
      
      {b.status === 'pending' && (
        <div className="mt-1" style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <button className="btn btn-danger" onClick={() => onCancel(b._id)}>Cancel Booking</button>
        </div>
      )}

      {b.status === 'completed' && !loadingReview && (
        <div className="mt-1" style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          {review ? (
            <div style={{ backgroundColor: '#fcfcfc', padding: '1rem', borderRadius: '4px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#27ae60' }}>✓ Reviewed</strong>
                <span style={{ color: '#f1c40f', fontSize: '1.2rem' }}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              {review.comment && <p style={{ fontStyle: 'italic', color: '#555', margin: 0 }}>"{review.comment}"</p>}
            </div>
          ) : showForm ? (
            <ReviewForm 
              bookingId={b._id} 
              onReviewSubmit={(rev) => { setReview(rev); setShowForm(false); }} 
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button className="btn" style={{ backgroundColor: '#2ecc71', width: '100%' }} onClick={() => setShowForm(true)}>Leave a Review</button>
          )}
        </div>
      )}
    </div>
  );
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/my`, {
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

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to cancel booking');
      }
      fetchBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="container loading-state">Loading bookings...</div>;

  return (
    <div className="container">
      <h2 className="mb-2">My Bookings</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      
      {bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="mb-1">You haven't made any bookings yet.</p>
          <Link to="/services" className="btn">Browse Services</Link>
        </div>
      ) : (
        <div className="grid">
          {bookings.map(b => (
            <BookingItem key={b._id} b={b} token={token} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
};
export default MyBookings;
