import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Availability = () => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const defaultSchedule = [
    { dayOfWeek: 'monday', isAvailable: false, startTime: '', endTime: '' },
    { dayOfWeek: 'tuesday', isAvailable: false, startTime: '', endTime: '' },
    { dayOfWeek: 'wednesday', isAvailable: false, startTime: '', endTime: '' },
    { dayOfWeek: 'thursday', isAvailable: false, startTime: '', endTime: '' },
    { dayOfWeek: 'friday', isAvailable: false, startTime: '', endTime: '' },
    { dayOfWeek: 'saturday', isAvailable: false, startTime: '', endTime: '' },
    { dayOfWeek: 'sunday', isAvailable: false, startTime: '', endTime: '' }
  ];

  const [schedule, setSchedule] = useState(defaultSchedule);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/availability/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        const merged = defaultSchedule.map(defDay => {
          const found = data.find(d => d.dayOfWeek === defDay.dayOfWeek);
          if (found) return { ...defDay, ...found, startTime: found.startTime || '', endTime: found.endTime || '' };
          return defDay;
        });
        setSchedule(merged);
      }
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
    // eslint-disable-next-line
  }, [token]);

  const handleChange = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    for (let day of schedule) {
      if (day.isAvailable) {
        if (!day.startTime || !day.endTime) {
          return setError(`Please provide start and end times for ${day.dayOfWeek}`);
        }
        if (day.startTime >= day.endTime) {
          return setError(`Start time must be before end time on ${day.dayOfWeek}`);
        }
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ schedule })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save availability');
      
      setSuccess('Availability saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container loading-state">Loading schedule...</div>;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h2 className="mb-2">Manage Availability</h2>
      <div className="card">
        <p className="mb-2" style={{ color: '#555' }}>Set the weekly hours you are available to accept bookings.</p>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <form onSubmit={handleSave}>
          {schedule.map((day, index) => (
            <div key={day.dayOfWeek} className="flex mb-1" style={{ alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px' }}>
                <strong style={{ textTransform: 'capitalize' }}>{day.dayOfWeek}</strong>
              </div>
              
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={day.isAvailable} 
                    onChange={e => handleChange(index, 'isAvailable', e.target.checked)} 
                    style={{ marginRight: '0.5rem', width: '18px', height: '18px' }}
                  />
                  {day.isAvailable ? 'Available' : 'Unavailable'}
                </label>
              </div>
              
              <div className="flex" style={{ flex: '2 1 250px', gap: '1rem', opacity: day.isAvailable ? 1 : 0.5, pointerEvents: day.isAvailable ? 'auto' : 'none' }}>
                <input 
                  type="time" 
                  className="form-control" 
                  value={day.startTime} 
                  onChange={e => handleChange(index, 'startTime', e.target.value)} 
                  required={day.isAvailable}
                  disabled={!day.isAvailable}
                />
                <span style={{ alignSelf: 'center', color: '#666' }}>to</span>
                <input 
                  type="time" 
                  className="form-control" 
                  value={day.endTime} 
                  onChange={e => handleChange(index, 'endTime', e.target.value)} 
                  required={day.isAvailable}
                  disabled={!day.isAvailable}
                />
              </div>
            </div>
          ))}
          <button type="submit" className="btn mt-2" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={saving}>
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Availability;
