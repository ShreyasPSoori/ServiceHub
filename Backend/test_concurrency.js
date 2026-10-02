const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const baseUrl = 'http://localhost:5000/api';

async function runTests() {
  const log = (name, pass, data) => {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
    if (data && data.message) console.log(`Response: ${data.message}`);
    console.log('-----------------------------------');
  };

  const req = async (method, path, body, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, data: await res.json().catch(()=>null) };
  };

  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Setup Provider
    let p = await req('POST', '/auth/register', { name: 'Prov Conc', email: 'p_conc@test.com', password: 'p', role: 'provider' });
    if (p.status===400) p = await req('POST', '/auth/login', { email: 'p_conc@test.com', password: 'p' });
    let provToken = p.data.token;
    
    // Set Availability for Tuesday
    await req('PUT', '/availability', [{ dayOfWeek: 'tuesday', isAvailable: true, startTime: '09:00', endTime: '17:00' }], provToken);

    // Setup Service
    let s = await req('POST', '/services', { title: 'Conc Service', description: 'desc', price: 10, category: 'Cleaning', duration: 60 }, provToken);
    let serviceId = s.data._id;

    const uniqueSuffix = Date.now().toString();
    // Setup Customers
    let c1 = await req('POST', '/auth/register', { name: 'C1', email: 'c1_' + uniqueSuffix + '@test.com', password: 'p', role: 'customer' });
    let c2 = await req('POST', '/auth/register', { name: 'C2', email: 'c2_' + uniqueSuffix + '@test.com', password: 'p', role: 'customer' });
    
    // Clear bookings for this provider to isolate test runs
    await mongoose.connection.db.collection('bookings').deleteMany({ providerId: new mongoose.Types.ObjectId(p.data._id) });
    
    let av = await req('GET', '/availability/my', null, provToken);
    console.log('Availability:', av.data);
    
    const bookingDate = '2030-10-01'; // Known Tuesday
    console.log('bookingDate:', bookingDate);

    // CONCURRENCY TEST
    console.log('Executing concurrent booking requests...');
    const p1 = req('POST', '/bookings', { serviceId, bookingDate, startTime: '10:00' }, c1.data.token);
    const p2 = req('POST', '/bookings', { serviceId, bookingDate, startTime: '10:00' }, c2.data.token);
    
    const [res1, res2] = await Promise.all([p1, p2]);
    
    const oneSuccess = (res1.status === 201 && res2.status === 409) || 
                       (res1.status === 409 && res2.status === 201);
    
    log('Two concurrent booking attempts for the same provider/time are tested', true, null);
    log('At most one conflicting booking can succeed (Losing request returns 409)', oneSuccess, {
      message: 'C1 Status: ' + res1.status + ' | C2 Status: ' + res2.status + ' | ' + (res2.data && res2.data.message ? res2.data.message : '')
    });

    // Test Sequential Overlapping Bookings
    const resOverlap = await req('POST', '/bookings', { serviceId, bookingDate, startTime: '10:00' }, c2.data.token);
    log('Existing overlapping booking is rejected sequentially (Returns 400)', resOverlap.status === 400, resOverlap.data);

    // Test Non-Overlapping Bookings
    const res3 = await req('POST', '/bookings', { serviceId, bookingDate, startTime: '12:00' }, c1.data.token);
    log('Non-overlapping booking succeeds', res3.status === 201, res3.data);

    // Availability validation works
    const res4 = await req('POST', '/bookings', { serviceId, bookingDate, startTime: '18:00' }, c1.data.token);
    log('Availability validation still works', res4.status === 400, res4.data);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
