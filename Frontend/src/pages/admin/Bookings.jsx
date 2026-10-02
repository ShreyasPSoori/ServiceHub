import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.message && !Array.isArray(data)) throw new Error(data.message);
      setBookings(data);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="container loading-state">Loading bookings...</div>;

  return (
    <div className="container">
      <h2 className="mb-2">View Bookings</h2>
      {error && <div className="alert">{error}</div>}
      
      <div className="table-container">
        <table >
          <thead >
            <tr >
              <th >Service</th>
              <th >Customer</th>
              <th >Provider</th>
              <th >Date</th>
              <th >Time</th>
              <th >Status</th>
              <th >Payment</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (<tr><td colSpan="7" style={{ padding: "1rem", textAlign: "center", color: "#777" }}>No records found.</td></tr>) : bookings.map(b => (
              <tr key={b._id} >
                <td ><strong>{b.serviceId?.title || 'Unknown'}</strong></td>
                <td >{b.customerId?.name || 'Unknown'}</td>
                <td >{b.providerId?.name || 'Unknown'}</td>
                <td >{new Date(b.bookingDate).toLocaleDateString()}</td>
                <td >{b.startTime} - {b.endTime}</td>
                <td >
                  <span className="badge" style={{ backgroundColor: b.status === 'completed' ? '#27ae60' : b.status === 'pending' ? '#f39c12' : b.status === 'accepted' ? '#3498db' : '#e74c3c' }}>
                    {b.status}
                  </span>
                </td>
                <td >{b.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminBookings;
