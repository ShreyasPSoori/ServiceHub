import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ReviewForm from '../components/ReviewForm';

const categoryImages = {
  Cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80',
  Plumbing: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=1200&q=80',
  Electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80',
  Landscaping: 'https://images.unsplash.com/photo-1558904541-efa843a96f09?w=1200&q=80',
  Tutoring: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1200&q=80',
  Other: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80'
};

const ServiceDetails = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [availability, setAvailability] = useState([]);
  const [availLoading, setAvailLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [bookingMode, setBookingMode] = useState(false);
  const [bookingData, setBookingData] = useState({ bookingDate: '', startTime: '', notes: '' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/services/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch service');
        setService(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  useEffect(() => {
    if (!service) return;
    const fetchAvail = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/availability/${service.providerId._id}`);
        const data = await res.json();
        if (res.ok) setAvailability(data);
      } catch (err) {
        console.error('Failed to load availability', err);
      } finally {
        setAvailLoading(false);
      }
    };
    fetchAvail();
  }, [service]);

  useEffect(() => {
    if (!service) return;
    const fetchReviews = async () => {
      try {
        const [revRes, sumRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/reviews/service/${id}`),
          fetch(`${import.meta.env.VITE_API_URL}/reviews/service/${id}/summary`)
        ]);
        if (revRes.ok) setReviews(await revRes.json());
        if (sumRes.ok) setSummary(await sumRes.json());
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [service, id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: service._id,
          providerId: service.providerId._id,
          bookingDate: bookingData.bookingDate,
          startTime: bookingData.startTime,
          notes: bookingData.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed');
      
      navigate('/my-bookings');
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="container loading-state"><div className="spinner"></div>Loading service details...</div>;
  if (error) return <div className="container mt-2"><div className="alert alert-danger">{error}</div></div>;
  if (!service) return <div className="container mt-2">Service not found</div>;

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const sortedAvailability = [...availability].sort((a, b) => daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek));
  const fallbackImg = categoryImages[service.category] || categoryImages.Other;
  const imgSrc = (service.images && service.images.length > 0) ? service.images[0] : fallbackImg;

  return (
    <div className="container">
      <Link to="/services" className="btn btn-secondary mb-2">&larr; Back to Marketplace</Link>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Image and Details */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <img 
              src={imgSrc} 
              alt={service.title} 
              style={{ width: '100%', height: '300px', objectFit: 'cover' }} 
              onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }}
            />
            <div style={{ padding: '2rem' }}>
              <div className="flex mb-1">
                <span className="badge badge-primary">{service.category}</span>
                {summary?.averageRating > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontWeight: 'bold' }}>
                    ★ {summary.averageRating.toFixed(1)} <span style={{ color: 'var(--text-light)', fontWeight: 'normal' }}>({summary.totalReviews})</span>
                  </span>
                )}
              </div>
              <h1 style={{ marginBottom: '1rem' }}>{service.title}</h1>
              <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{service.description}</p>
              
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Price</span>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>₹{service.price}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Duration</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{service.duration} mins</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Profile Snippet */}
          <div className="card mt-2 flex" style={{ alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {service.providerId?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Service Provider</span>
              <h3 style={{ margin: 0 }}>{service.providerId?.name || 'Unknown Provider'}</h3>
            </div>
          </div>
        </div>

        {/* Right Column: Booking and Availability */}
        <div>
          <div className="card mb-2" style={{ borderTop: '4px solid var(--primary)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Book this Service</h2>
            
            {!user ? (
              <div className="alert alert-info">
                Please <Link to="/login" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>log in</Link> to book this service.
              </div>
            ) : user.role !== 'customer' ? (
              <div className="alert alert-info">Only customers can book services.</div>
            ) : !bookingMode ? (
              <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={() => setBookingMode(true)}>
                Book Now — ₹{service.price}
              </button>
            ) : (
              <form onSubmit={handleBooking}>
                {bookingError && <div className="alert alert-danger">{bookingError}</div>}
                <div className="form-group">
                  <label htmlFor="bookingDate">Date</label>
                  <input id="bookingDate" type="date" required className="form-control"
                    value={bookingData.bookingDate} onChange={e=>setBookingData({...bookingData, bookingDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label htmlFor="startTime">Time</label>
                  <input id="startTime" type="time" required className="form-control"
                    value={bookingData.startTime} onChange={e=>setBookingData({...bookingData, startTime: e.target.value})} />
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Notes for Provider (Optional)</label>
                  <textarea id="notes" className="form-control" rows="3"
                    value={bookingData.notes} onChange={e=>setBookingData({...bookingData, notes: e.target.value})}></textarea>
                </div>
                <div className="flex" style={{ gap: '1rem' }}>
                  <button type="submit" className="btn btn-success" style={{ flex: 1, padding: '0.8rem' }} disabled={bookingLoading}>
                    {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setBookingMode(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Provider Availability</h3>
            {availLoading ? (
              <p>Loading schedule...</p>
            ) : sortedAvailability.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {sortedAvailability.map(a => (
                  <li key={a._id} className="flex" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)', color: a.isAvailable ? 'var(--text-main)' : 'var(--text-light)' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{a.dayOfWeek}</span>
                    <span>{a.isAvailable ? `${a.startTime} - ${a.endTime}` : 'Unavailable'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No availability configured.</p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="card mt-3">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Customer Reviews</h2>
        {reviewsLoading ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review after booking!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {reviews.map(r => (
              <div key={r._id} style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--border-radius-sm)' }}>
                <div className="flex mb-1">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                        {r.customerId?.name?.charAt(0) || 'U'}
                     </div>
                     {r.customerId?.name || 'Unknown'}
                  </strong>
                  <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                </div>
                {r.comment && <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.95rem' }}>"{r.comment}"</p>}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '1rem', textAlign: 'right' }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ServiceDetails;