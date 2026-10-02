const baseUrl = 'http://localhost:5000/api';

async function runTests() {
  let cToken, c2Token, pToken;
  let serviceId, pId;

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
    // Setup users
    let c = await req('POST', '/auth/register', { name: 'C', email: 'cr@test.com', password: 'p', role: 'customer' });
    if (c.status===400) c = await req('POST', '/auth/login', { email: 'cr@test.com', password: 'p' });
    cToken = c.data.token;

    let c2 = await req('POST', '/auth/register', { name: 'C2', email: 'cr2@test.com', password: 'p', role: 'customer' });
    if (c2.status===400) c2 = await req('POST', '/auth/login', { email: 'cr2@test.com', password: 'p' });
    c2Token = c2.data.token;

    let p = await req('POST', '/auth/register', { name: 'P', email: 'pr@test.com', password: 'p', role: 'provider' });
    if (p.status===400) p = await req('POST', '/auth/login', { email: 'pr@test.com', password: 'p' });
    pToken = p.data.token;
    pId = p.data._id;

    let s = await req('POST', '/services', { title: 'Test Review Svc', description: 'desc', price: 10, category: 'Cleaning', duration: 60 }, pToken);
    serviceId = s.data._id;

    // Set availability
    await req('PUT', '/availability', [{ dayOfWeek: 'monday', isAvailable: true, startTime: '09:00', endTime: '17:00' }], pToken);

    // Create booking
    let b1 = await req('POST', '/bookings', { serviceId, bookingDate: '2026-10-19', startTime: '10:00' }, cToken);
    let b1Id = b1.data._id;

    // 1. Pending booking cannot be reviewed
    let revPending = await req('POST', '/reviews', { bookingId: b1Id, rating: 5 }, cToken);
    log('Pending booking cannot be reviewed', revPending.status === 400, revPending);

    // Accept and Complete booking
    await req('PUT', `/bookings/${b1Id}/accept`, null, pToken);
    await req('PUT', `/bookings/${b1Id}/complete`, null, pToken);

    // 2. Customer cannot review another customer's booking
    let revOther = await req('POST', '/reviews', { bookingId: b1Id, rating: 5 }, c2Token);
    log('Customer cannot review another customer booking', revOther.status === 403, revOther);

    // 3. Provider cannot create a review
    let revProv = await req('POST', '/reviews', { bookingId: b1Id, rating: 5 }, pToken);
    log('Provider cannot create a review', revProv.status === 403, revProv);

    // 4. Rating below 1 is rejected
    let revLow = await req('POST', '/reviews', { bookingId: b1Id, rating: 0 }, cToken);
    log('Rating below 1 is rejected', revLow.status === 400, revLow);

    // 5. Rating above 5 is rejected
    let revHigh = await req('POST', '/reviews', { bookingId: b1Id, rating: 6 }, cToken);
    log('Rating above 5 is rejected', revHigh.status === 400, revHigh);

    // 6. Completed customer booking can be reviewed
    let revValid = await req('POST', '/reviews', { bookingId: b1Id, rating: 4, comment: 'Good' }, cToken);
    log('Completed customer booking can be reviewed', revValid.status === 201, revValid);

    // 7. Duplicate review for the same booking is rejected
    let revDup = await req('POST', '/reviews', { bookingId: b1Id, rating: 5 }, cToken);
    log('Duplicate review for the same booking is rejected', revDup.status === 400, revDup);

    // Create another booking and review to test summary
    let b2 = await req('POST', '/bookings', { serviceId, bookingDate: '2026-10-19', startTime: '11:00' }, c2Token);
    let b2Id = b2.data._id;
    await req('PUT', `/bookings/${b2Id}/accept`, null, pToken);
    await req('PUT', `/bookings/${b2Id}/complete`, null, pToken);
    await req('POST', '/reviews', { bookingId: b2Id, rating: 5 }, c2Token);

    // 8. Service reviews can be retrieved
    let getSvc = await req('GET', `/reviews/service/${serviceId}`);
    log('Service reviews can be retrieved', getSvc.status === 200 && getSvc.data.length === 2, getSvc);

    // 9. Provider reviews can be retrieved
    let getProv = await req('GET', `/reviews/provider/${pId}`);
    log('Provider reviews can be retrieved', getProv.status === 200 && getProv.data.length >= 2, getProv);

    // 10. Rating summary returns correct average, count, and distribution
    let getSum = await req('GET', `/reviews/service/${serviceId}/summary`);
    let sumValid = getSum.data.totalReviews === 2 && getSum.data.averageRating === 4.5 && getSum.data.distribution['4'] === 1 && getSum.data.distribution['5'] === 1;
    log('Rating summary returns correct average, count, and distribution', getSum.status === 200 && sumValid, getSum);

  } catch (err) { console.error(err); }
}
runTests();
