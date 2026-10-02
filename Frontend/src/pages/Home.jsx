import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
  { name: 'Cleaning', icon: '✨', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80' },
  { name: 'Plumbing', icon: '🔧', img: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=400&q=80' },
  { name: 'Electrical', icon: '⚡', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80' },
  { name: 'Landscaping', icon: '🌿', img: 'https://images.unsplash.com/photo-1558904541-efa843a96f09?w=400&q=80' },
];

const Home = () => {
  return (
    <div className="container">
      <div className="hero mb-3">
        <h1>Find Trusted Professionals</h1>
        <p>Book top-rated services for your home and business with ServiceHub.</p>
        <Link to="/services" className="btn" style={{ background: 'white', color: 'var(--primary)', fontSize: '1.1rem', padding: '0.8rem 2rem' }}>
          Explore Services
        </Link>
      </div>

      <h2 className="text-center mb-2">Popular Categories</h2>
      <div className="grid mb-3">
        {categories.map(cat => (
          <div key={cat.name} className="card card-hover" style={{ padding: 0, overflow: 'hidden', textAlign: 'center' }}>
            <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            <div style={{ padding: '1.5rem' }}>
              <h3>{cat.name}</h3>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Expert {cat.name.toLowerCase()} professionals</p>
              <Link to={`/services?category=${cat.name}`} className="btn btn-secondary mt-1" style={{ width: '100%' }}>View Providers</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-3" style={{ background: 'var(--bg-subtle)', border: 'none', textAlign: 'center', padding: '3rem 2rem' }}>
        <h2>Are you a professional?</h2>
        <p className="mb-2" style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Join thousands of service providers who are growing their business and managing bookings seamlessly with ServiceHub.
        </p>
        <Link to="/register" className="btn btn-primary">Become a Provider</Link>
      </div>
    </div>
  );
};

export default Home;
