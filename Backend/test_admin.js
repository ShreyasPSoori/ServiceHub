const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const baseUrl = 'http://localhost:5000/api';

async function runTests() {
  let adminToken, customerToken;
  let adminId, userId;
  let serviceId, reviewId;

  const log = (name, pass, data) => {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
    if (data) {
      if (data.token) data.token = '***REDACTED***';
      if (data.password) data.password = '***REDACTED***';
      console.log(`Response: ${JSON.stringify(data)}`);
    }
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

    // Register admin user
    let a = await req('POST', '/auth/register', { name: 'Admin', email: 'admin123@test.com', password: 'p', role: 'customer' });
    if (a.status===400) a = await req('POST', '/auth/login', { email: 'admin123@test.com', password: 'p' });
    adminToken = a.data.token;
    adminId = a.data._id;

    // Force update DB role to admin
    await User.findByIdAndUpdate(adminId, { role: 'admin' });

    // Register customer
    let c = await req('POST', '/auth/register', { name: 'CustToDel', email: 'del@test.com', password: 'p', role: 'customer' });
    if (c.status===400) c = await req('POST', '/auth/login', { email: 'del@test.com', password: 'p' });
    customerToken = c.data.token;
    userId = c.data._id;

    // Test 1: Admin can get stats
    let getStats = await req('GET', '/admin/stats', null, adminToken);
    log('Admin can get stats', getStats.status === 200 && getStats.data.customers !== undefined, getStats);

    // Test 2: Admin can get users
    let getUsers = await req('GET', '/admin/users', null, adminToken);
    log('Admin can get users', getUsers.status === 200 && Array.isArray(getUsers.data), getUsers);

    // Test 3: Admin can delete user
    let delUser = await req('DELETE', `/admin/users/${userId}`, null, adminToken);
    log('Admin can delete user', delUser.status === 200, delUser);

    // Test 4: Cannot delete another admin
    let delAdmin = await req('DELETE', `/admin/users/${adminId}`, null, adminToken);
    log('Admin cannot delete themselves/another admin', delAdmin.status === 403, delAdmin);

    // Register another customer to test 403
    let c3 = await req('POST', '/auth/register', { name: 'Cust3', email: 'cust3@test.com', password: 'p', role: 'customer' });
    let c3Token = c3.data.token;
    
    // Test 5: Customer cannot access admin routes
    let cStats = await req('GET', '/admin/stats', null, c3Token);
    log('Customer cannot access admin routes', cStats.status === 403, cStats);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
