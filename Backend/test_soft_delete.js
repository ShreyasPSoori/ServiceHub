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

    // Setup accounts
    let aReq = await req('POST', '/auth/register', { name: 'Admin Fresh', email: 'adminfresh@test.com', password: 'p', role: 'customer' });
    if (aReq.status === 400) aReq = await req('POST', '/auth/login', { email: 'adminfresh@test.com', password: 'p' });
    
    // Elevate to admin in DB
    await User.findByIdAndUpdate(aReq.data._id, { role: 'admin' });
    
    let a = await req('POST', '/auth/login', { email: 'adminfresh@test.com', password: 'p' });
    let adminToken = a.data.token;
    let adminId = a.data._id;

    let c = await req('POST', '/auth/register', { name: 'Cust Deact', email: 'c_deact@test.com', password: 'p', role: 'customer' });
    if (c.status===400) c = await req('POST', '/auth/login', { email: 'c_deact@test.com', password: 'p' });
    let custToken = c.data.token;
    let custId = c.data._id;

    let p = await req('POST', '/auth/register', { name: 'Prov Deact', email: 'p_deact@test.com', password: 'p', role: 'provider' });
    if (p.status===400) p = await req('POST', '/auth/login', { email: 'p_deact@test.com', password: 'p' });
    let provToken = p.data.token;
    let provId = p.data._id;

    // Create a service before deactivation
    let s = await req('POST', '/services', { title: 'Test Service', description: 'desc', price: 10, category: 'Cleaning', duration: 60 }, provToken);
    let serviceId = s.data._id;

    // 1. Admin deactivates a test customer
    let deactCust = await req('PUT', `/admin/users/${custId}/deactivate`, null, adminToken);
    log('Admin deactivates a test customer', deactCust.status === 200, deactCust.data);

    // 2. Customer's existing JWT is rejected on the next protected request
    let meReq = await req('GET', '/auth/me', null, custToken);
    log('Customer existing JWT is rejected on the next protected request', meReq.status === 401, meReq.data);

    // 3. Customer cannot log in while inactive
    let loginFail = await req('POST', '/auth/login', { email: 'c_deact@test.com', password: 'p' });
    log('Customer cannot log in while inactive', loginFail.status === 401, loginFail.data);

    // 4. Admin reactivates customer
    let reactCust = await req('PUT', `/admin/users/${custId}/activate`, null, adminToken);
    log('Admin reactivates customer', reactCust.status === 200, reactCust.data);

    // 5. Customer can log in again
    let loginSuccess = await req('POST', '/auth/login', { email: 'c_deact@test.com', password: 'p' });
    log('Customer can log in again', loginSuccess.status === 200, loginSuccess.data);

    // 6. Admin cannot deactivate themselves
    let deactSelf = await req('PUT', `/admin/users/${adminId}/deactivate`, null, adminToken);
    log('Admin cannot deactivate themselves', deactSelf.status === 403, deactSelf.data);

    // Create another admin to test
    let a2 = await req('POST', '/auth/register', { name: 'Admin 2', email: 'admin2@test.com', password: 'p', role: 'customer' });
    if (a2.status===400) a2 = await req('POST', '/auth/login', { email: 'admin2@test.com', password: 'p' });
    await User.findByIdAndUpdate(a2.data._id, { role: 'admin' });

    // 7. Admin cannot deactivate another admin
    let deactOtherAdmin = await req('PUT', `/admin/users/${a2.data._id}/deactivate`, null, adminToken);
    log('Admin cannot deactivate another admin', deactOtherAdmin.status === 403, deactOtherAdmin.data);

    // 8. Admin deactivates a provider
    let deactProv = await req('PUT', `/admin/users/${provId}/deactivate`, null, adminToken);
    log('Admin deactivates a test provider', deactProv.status === 200, deactProv.data);

    // 9. Deactivated provider cannot create/manage new provider activity
    let newSvc = await req('POST', '/services', { title: 'Test 2', description: 'desc', price: 10, category: 'Cleaning', duration: 60 }, provToken);
    log('Deactivated provider cannot create new provider activity', newSvc.status === 401, newSvc.data);

    // 10. Deactivated provider's service cannot receive a new booking
    // Try to book the existing service
    let bookFail = await req('POST', '/bookings', { serviceId, bookingDate: '2026-10-25', startTime: '10:00' }, loginSuccess.data.token);
    log('Deactivated provider service cannot receive a new booking', bookFail.status === 400 || bookFail.status === 401 || bookFail.status === 404, bookFail.data);

    // 11. Existing historical records remain intact
    let checkSvc = await User.findById(provId);
    let checkSvcDb = await mongoose.connection.db.collection('services').findOne({ _id: new mongoose.Types.ObjectId(serviceId) });
    log('Existing historical records remain intact', checkSvc !== null && checkSvcDb !== null && checkSvc.isActive === false, { message: 'DB confirmed' });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
