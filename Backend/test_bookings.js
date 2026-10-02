const baseUrl = 'http://localhost:5000/api';

async function runTests() {
  let customer1Token, provider1Token, customer2Token, provider2Token;
  let customer1Id, provider1Id;
  let serviceId;
  let bookingId;

  const log = (testName, pass, data) => {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${testName}`);
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
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${baseUrl}${path}`, opts);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };

  try {
    // 1. Create/Login Customer 1
    let c1 = await req('POST', '/auth/register', { name: 'Cust1', email: 'c1@test.com', password: 'pass', role: 'customer' });
    if (c1.status === 400) c1 = await req('POST', '/auth/login', { email: 'c1@test.com', password: 'pass' });
    customer1Token = c1.data.token;
    customer1Id = c1.data._id;
    log('Login as Customer 1', c1.status === 200 || c1.status === 201, { status: c1.status, _id: customer1Id });

    // 2. Create/Login Provider 1
    let p1 = await req('POST', '/auth/register', { name: 'Prov1', email: 'p1@test.com', password: 'pass', role: 'provider' });
    if (p1.status === 400) p1 = await req('POST', '/auth/login', { email: 'p1@test.com', password: 'pass' });
    provider1Token = p1.data.token;
    provider1Id = p1.data._id;
    log('Login as Provider 1', p1.status === 200 || p1.status === 201, { status: p1.status, _id: provider1Id });

    // 3. Provider 1 creates Service
    let s = await req('POST', '/services', { title: 'House Cleaning Test', description: 'Deep clean', price: 100, category: 'Cleaning', duration: 120 }, provider1Token);
    serviceId = s.data._id;
    log('Provider 1 creates House Cleaning service', s.status === 201, { status: s.status, serviceId });

    // 4. Customer 1 creates Booking
    let b1 = await req('POST', '/bookings', { serviceId, bookingDate: '2026-10-20', startTime: '10:00', notes: 'Test' }, customer1Token);
    bookingId = b1.data._id;
    
    // Verify derived
    let derivedPass = (b1.data.customerId === customer1Id) && (b1.data.providerId === provider1Id) && (b1.data.endTime === '12:00');
    log('Customer 1 creates booking & verified derived props', b1.status === 201 && derivedPass, {
      status: b1.status, 
      customerId: b1.data.customerId, 
      providerId: b1.data.providerId, 
      startTime: b1.data.startTime,
      endTime: b1.data.endTime 
    });

    // 5. Customer retrieves their bookings
    let cb = await req('GET', '/bookings/my', null, customer1Token);
    let hasBookingC = cb.data.some(b => b._id === bookingId);
    log('Customer retrieves bookings', cb.status === 200 && hasBookingC, { status: cb.status, count: cb.data.length });

    // 6. Provider retrieves their bookings
    let pb = await req('GET', '/bookings/provider', null, provider1Token);
    let hasBookingP = pb.data.some(b => b._id === bookingId);
    log('Provider retrieves bookings', pb.status === 200 && hasBookingP, { status: pb.status, count: pb.data.length });

    // 7. Customer double books (Overlapping time: 11:00 to 13:00)
    let b2 = await req('POST', '/bookings', { serviceId, bookingDate: '2026-10-20', startTime: '11:00' }, customer1Token);
    log('Double booking rejected with overlapping time', b2.status === 400, { status: b2.status, message: b2.data.message });

    // 8. Accept booking
    let acc = await req('PUT', `/bookings/${bookingId}/accept`, null, provider1Token);
    log('Provider accepts booking', acc.status === 200 && acc.data.status === 'accepted', { status: acc.status, newStatus: acc.data.status });

    // 9. Invalid transition (Accept an already accepted booking)
    let acc2 = await req('PUT', `/bookings/${bookingId}/accept`, null, provider1Token);
    log('Invalid transition rejected (Accepting an accepted booking)', acc2.status === 400, { status: acc2.status, message: acc2.data.message });

    // 10. Complete booking
    let comp = await req('PUT', `/bookings/${bookingId}/complete`, null, provider1Token);
    log('Provider completes accepted booking', comp.status === 200 && comp.data.status === 'completed', { status: comp.status, newStatus: comp.data.status });

    // 11. Customer 2 cannot access Customer 1's booking
    let c2 = await req('POST', '/auth/register', { name: 'Cust2', email: 'c2@test.com', password: 'pass', role: 'customer' });
    if (c2.status === 400) c2 = await req('POST', '/auth/login', { email: 'c2@test.com', password: 'pass' });
    customer2Token = c2.data.token;
    
    let badGet = await req('GET', `/bookings/${bookingId}`, null, customer2Token);
    log('Customer 2 denied access to Customer 1 booking', badGet.status === 403, { status: badGet.status, message: badGet.data.message });

    // 12. Provider 2 cannot accept Provider 1's booking
    let p2 = await req('POST', '/auth/register', { name: 'Prov2', email: 'p2@test.com', password: 'pass', role: 'provider' });
    if (p2.status === 400) p2 = await req('POST', '/auth/login', { email: 'p2@test.com', password: 'pass' });
    provider2Token = p2.data.token;

    let badAcc = await req('PUT', `/bookings/${bookingId}/accept`, null, provider2Token);
    log('Provider 2 denied modifying Provider 1 booking', badAcc.status === 403, { status: badAcc.status, message: badAcc.data.message });

  } catch (err) {
    console.error('Test script crashed:', err);
  }
}

runTests();
