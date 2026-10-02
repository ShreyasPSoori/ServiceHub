import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ServiceForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', category: 'Cleaning', duration: '', imageUrl: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetch(`${import.meta.env.VITE_API_URL}/services/${id}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category,
            duration: data.duration,
            imageUrl: data.images && data.images.length > 0 ? data.images[0] : ''
          });
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load the service for editing.');
          setLoading(false);
        });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      const url = isEdit 
        ? `${import.meta.env.VITE_API_URL}/services/${id}`
        : `${import.meta.env.VITE_API_URL}/services`;
        
      const method = isEdit ? 'PUT' : 'POST';

      // Ensure price and duration are numbers
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        duration: Number(formData.duration),
        images: formData.imageUrl ? [formData.imageUrl] : []
      };

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save service');
      
      navigate('/provider/services');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container">Loading service data...</div>;

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <Link to="/provider/services" className="btn mb-1" style={{ backgroundColor: '#7f8c8d' }}>&larr; Cancel</Link>
      
      <div className="card">
        <h2 className="mb-2">{isEdit ? 'Edit Service' : 'Add New Service'}</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Service Title</label>
            <input id="title" type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="form-control" required placeholder="e.g. Deep House Cleaning" />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="form-control" required>
              <option value="Cleaning">Cleaning</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Landscaping">Landscaping</option>
              <option value="Tutoring">Tutoring</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="flex" style={{ gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Price (₹)</label>
              <input id="price" type="number" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="form-control" required min="1" step="0.01" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="duration">Duration (Minutes)</label>
              <input id="duration" type="number" value={formData.duration} onChange={e=>setFormData({...formData, duration: e.target.value})} className="form-control" required min="1" />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" rows="5" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="form-control" required placeholder="Detail what is included in this service..."></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="imageUrl">Service Image URL (Optional)</label>
            <input id="imageUrl" type="url" value={formData.imageUrl} onChange={e=>setFormData({...formData, imageUrl: e.target.value})} className="form-control" placeholder="https://example.com/image.jpg" />
            {formData.imageUrl && (
              <div style={{ marginTop: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.5rem', background: 'var(--bg-subtle)' }}>
                <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Image Preview:</p>
                <img 
                  src={formData.imageUrl} 
                  alt="Service Preview" 
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)' }} 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL'; }}
                />
              </div>
            )}
          </div>
          
          <button type="submit" className="btn btn-success mt-1" style={{ width: '100%' }} disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Service' : 'Create Service')}
          </button>
        </form>
      </div>
    </div>
  );
};
export default ServiceForm;
