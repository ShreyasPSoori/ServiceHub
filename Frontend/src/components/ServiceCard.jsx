import React from 'react';
import { Link } from 'react-router-dom';

const categoryImages = {
  Cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
  Plumbing: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=800&q=80',
  Electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
  Landscaping: 'https://images.unsplash.com/photo-1558904541-efa843a96f09?w=800&q=80',
  Tutoring: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=800&q=80',
  Other: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80'
};

const ServiceCard = ({ service }) => {
  const fallbackImg = categoryImages[service.category] || categoryImages.Other;
  const imgSrc = (service.images && service.images.length > 0) ? service.images[0] : fallbackImg;

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
      <img 
        src={imgSrc} 
        alt={service.title} 
        className="service-img" 
        onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }}
      />
      <div className="flex mb-1">
        <span className="badge badge-primary">{service.category}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>⏱ {service.duration} mins</span>
      </div>
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>{service.title}</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', flex: 1, fontSize: '0.95rem' }}>
        {service.description.length > 80 ? service.description.substring(0, 80) + '...' : service.description}
      </p>
      
      <div className="flex mb-1" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</span>
          <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>₹{service.price}</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
           <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Provider</span>
           <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{service.providerId?.name || 'Unknown'}</span>
        </div>
      </div>
      
      <Link to={`/services/${service._id}`} className="btn btn-primary" style={{ display: 'block', width: '100%' }}>View Service</Link>
    </div>
  );
};
export default ServiceCard;