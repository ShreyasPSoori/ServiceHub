const baseUrl = 'http://localhost:5000/api';

async function runTests() {
  let cToken, pToken;
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
    let c = await req('POST', '/auth/register', { name: 'C', email: 'c_avail@test.com', password: 'p', role: 'customer' });
    if (c.status===400) c = await req('POST', '/auth/login', { email: 'c_avail@test.com', password: 'p' });
    cToken = c.data.token;

    let p = await req('POST', '/auth/register', { name: 'P', email: 'p_avail@test.com', password: 'p', role: 'provider' });
    if (p.status===400) p = await req('POST', '/auth/login', { email: 'p_avail@test.com', password: 'p' });
    pToken = p.data.token;
    pId = p.data._id;

    let s = await req('POST', '/services', { title: 'Test Svc Avail', description: 'desc', price: 10, category: 'Cleaning', duration: 60 }, pToken);
    serviceId = s.data._id;

    // Wait, let's fix the date to a known day. 
    // 2026-10-19 is a Monday. 
    // 2026-10-20 is a Tuesday.

    // 1. Provider creates a weekly schedule
    const validSchedule = [
      { dayOfWeek: 'monday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'tuesday', isAvailable: false }
    ];
    let putAvail = await req('PUT', '/availability', validSchedule, pToken);
    log('Provider creates a weekly schedule', putAvail.status === 200, putAvail);

    // 2. Provider retrieves their schedule
    let getMyAvail = await req('GET', '/availability/my', null, pToken);
    log('Provider retrieves their schedule', getMyAvail.status === 200 && getMyAvail.data.length >= 2, getMyAvail);

    // 3. Customer can retrieve a provider schedule
    let getProvAvail = await req('GET', `/availability/provider/${pId}`);
    log('Customer can retrieve a provider schedule', getProvAvail.status === 200 && getProvAvail.data.length >= 2, getProvAvail);

    // 4. Customer cannot modify a provider schedule
    let cModify = await req('PUT', '/availability', validSchedule, cToken);
    log('Customer cannot modify a provider schedule', cModify.status === 403, cModify);

    // 5. Invalid time ranges are rejected
    let badSchedule1 = [{ dayOfWeek: 'monday', isAvailable: true, startTime: '17:00', endTime: '09:00' }];
    let badPut1 = await req('PUT', '/availability', badSchedule1, pToken);
    log('Invalid time ranges are rejected', badPut1.status === 400, badPut1);

    // Duplicate day
    let badSchedule2 = [{ dayOfWeek: 'monday', isAvailable: false }, { dayOfWeek: 'monday', isAvailable: false }];
    let badPut2 = await req('PUT', '/availability', badSchedule2, pToken);
    log('Duplicate days are rejected', badPut2.status === 400, badPut2);

    // 6. Booking on an unavailable day is rejected (Tuesday is unavailable)
    let bookTues = await req('POST', '/bookings', { serviceId, bookingDate: '2026-10-20', startTime: '10:00' }, cToken);
    log('Booking on an unavailable day is rejected', bookTues.status === 400, bookTues);

    // 7. Booking outside working hours is rejected (Monday available 09:00-17:00)
    let bookEarly = await req('POST', '/bookings', { serviceId, bookingDate: '2026-10-19', startTime: '08:00' }, cToken);
    log('Booking outside working hours is rejected', bookEarly.status === 400, bookEarly);

    // 8. Booking inside working hours succeeds
    let bookValid = await req('POST', '/bookings', { serviceId, bookingDate: '2026-10-19', startTime: '10:00' }, cToken);
    log('Booking inside working hours succeeds', bookValid.status === 201, bookValid);

    // 9. Existing double-booking prevention still works
    // Duration is 60 minutes, so existing booking is 10:00-11:00.
    let bookDouble = await req('POST', '/bookings', { serviceId, bookingDate: '2026-10-19', startTime: '10:30' }, cToken);
    log('Existing double-booking prevention still works', bookDouble.status === 400, bookDouble);

  } catch (err) { console.error(err); }
}
runTests();
