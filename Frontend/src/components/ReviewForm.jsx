import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ReviewForm = ({ bookingId, onReviewSubmit, onCancel }) => {
  const { token } = useContext(AuthContext);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      return setError('Please select a rating between 1 and 5 stars.');
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId, rating, comment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');
      
      onReviewSubmit(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-1" style={{ border: '2px solid #3498db', padding: '1rem', boxShadow: 'none' }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#2c3e50' }}>Leave a Review</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-1" style={{ display: 'flex', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              type="button"
              aria-label={`Rate ${star} stars`}
              key={star}
              style={{
                fontSize: '1.8rem',
                cursor: 'pointer',
                color: (hoverRating || rating) >= star ? '#f1c40f' : '#ccc',
                transition: 'color 0.2s',
                lineHeight: 1,
                background: 'none',
                border: 'none',
                padding: 0
              }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          ))}
          <span style={{ marginLeft: '1rem', color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>
            {rating > 0 ? `${rating} / 5` : 'Select a rating'}
          </span>
        </div>

        <div className="form-group mb-1">
          <textarea
            className="form-control"
            rows="3"
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
          ></textarea>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: comment.length >= 1000 ? '#e74c3c' : '#888' }}>
            {comment.length} / 1000
          </div>
        </div>

        <div className="flex" style={{ gap: '1rem' }}>
          <button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={loading || rating === 0}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
          <button type="button" className="btn btn-danger" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};
export default ReviewForm;
