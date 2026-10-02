import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  const fetchServices = () => {
    fetch(`${import.meta.env.VITE_API_URL}/admin/services`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.message && !Array.isArray(data)) throw new Error(data.message);
      setServices(data);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete service');
      fetchServices();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="container loading-state">Loading services...</div>;

  return (
    <div className="container">
      <h2 className="mb-2">Manage Services</h2>
      {error && <div className="alert">{error}</div>}
      
      <div className="table-container">
        <table >
          <thead >
            <tr >
              <th >Title</th>
              <th >Provider</th>
              <th >Category</th>
              <th >Price</th>
              <th >Duration</th>
              <th >Status</th>
              <th >Created</th>
              <th >Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (<tr><td colSpan="6" style={{ padding: "1rem", textAlign: "center", color: "#777" }}>No records found.</td></tr>) : services.map(s => (
              <tr key={s._id} >
                <td ><strong>{s.title}</strong></td>
                <td >{s.providerId?.name || 'Unknown'}</td>
                <td ><span className="badge">{s.category}</span></td>
                <td style={{ padding: '1rem', color: '#27ae60', fontWeight: 'bold' }}>₹{s.price}</td>
                <td >{s.duration} mins</td>
                <td >{s.isActive ? 'Active' : 'Inactive'}</td>
                <td >{new Date(s.createdAt).toLocaleDateString()}</td>
                <td >
                  <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleDelete(s._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminServices;
