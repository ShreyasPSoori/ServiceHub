import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, user: currentUser } = useContext(AuthContext);

  const fetchUsers = () => {
    fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.message && !Array.isArray(data)) throw new Error(data.message);
      setUsers(data);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [token]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this account? Existing bookings and reviews will be preserved.')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}/deactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to deactivate user');
      setSuccess('User deactivated successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Are you sure you want to activate this account?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}/activate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to activate user');
      setSuccess('User activated successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="container loading-state">Loading users...</div>;

  return (
    <div className="container">
      <h2 className="mb-2">Manage Users</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="table-container">
        <table >
          <thead >
            <tr >
              <th >Name</th>
              <th >Email</th>
              <th >Role</th>
              <th >Status</th>
              <th >Joined</th>
              <th >Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (<tr><td colSpan="6" style={{ padding: "1rem", textAlign: "center", color: "#777" }}>No records found.</td></tr>) : users.map(u => (
              <tr key={u._id} >
                <td >{u.name}</td>
                <td >{u.email}</td>
                <td >
                  <span className="badge" style={{ backgroundColor: u.role === 'admin' ? '#e74c3c' : u.role === 'provider' ? '#2ecc71' : '#3498db', color: 'white' }}>
                    {u.role}
                  </span>
                </td>
                <td >
                  {u.isActive !== false ? (
                    <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Active</span>
                  ) : (
                    <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Inactive</span>
                  )}
                </td>
                <td >{new Date(u.createdAt).toLocaleDateString()}</td>
                <td >
                  {u.role !== 'admin' && (
                    <>
                      {u.isActive !== false ? (
                        <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleDeactivate(u._id)}>Deactivate</button>
                      ) : (
                        <button className="btn btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleActivate(u._id)}>Activate</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminUsers;
