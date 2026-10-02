import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  const fetchReviews = () => {
    fetch(`${import.meta.env.VITE_API_URL}/admin/reviews`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.message && !Array.isArray(data)) throw new Error(data.message);
      setReviews(data);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete review');
      fetchReviews();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="container loading-state">Loading reviews...</div>;

  return (
    <div className="container">
      <h2 className="mb-2">Manage Reviews</h2>
      {error && <div className="alert">{error}</div>}
      
      <div className="table-container">
        <table >
          <thead >
            <tr >
              <th >Customer</th>
              <th >Service</th>
              <th >Provider</th>
              <th >Rating</th>
              <th style={{ padding: '1rem', width: '30%' }}>Comment</th>
              <th >Date</th>
              <th >Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (<tr><td colSpan="6" style={{ padding: "1rem", textAlign: "center", color: "#777" }}>No records found.</td></tr>) : reviews.map(r => (
              <tr key={r._id} >
                <td >{r.customerId?.name || 'Unknown'}</td>
                <td ><strong>{r.serviceId?.title || 'Unknown'}</strong></td>
                <td >{r.providerId?.name || 'Unknown'}</td>
                <td style={{ padding: '1rem', color: '#f1c40f', fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </td>
                <td >{r.comment ? (r.comment.length > 50 ? r.comment.substring(0, 50) + '...' : r.comment) : <em style={{color: '#999'}}>No comment</em>}</td>
                <td >{new Date(r.createdAt).toLocaleDateString()}</td>
                <td >
                  <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleDelete(r._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminReviews;
