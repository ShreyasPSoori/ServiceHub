import React, { useState, useEffect } from 'react';
import ServiceCard from '../components/ServiceCard';

const Services = () => {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchServices = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (category) query.append('category', category);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/services?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch services');
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchServices();
  };

  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '3rem 0', background: 'var(--primary-light)', borderRadius: 'var(--border-radius-lg)', marginBottom: '2.5rem' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Service Marketplace</h1>
        <p style={{ color: 'var(--primary)', opacity: 0.8, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Discover top-rated professionals ready to help you with your next project.</p>
      </div>
      
      <div className="card mb-3" style={{ padding: '1rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
        <form onSubmit={handleSearch} className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 300px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search by keywords..." 
              className="form-control" 
              style={{ paddingLeft: '2.5rem' }}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Landscaping">Landscaping</option>
              <option value="Tutoring">Tutoring</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ flex: '0 1 auto', padding: '0 2rem' }}>Search</button>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading ? (
        <div className="loading-state">Loading services...</div>
      ) : (
        <div className="grid">
          {services.length > 0 ? (
            services.map(s => <ServiceCard key={s._id} service={s} />)
          ) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#777' }}>
              No services found matching your criteria.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
export default Services;
