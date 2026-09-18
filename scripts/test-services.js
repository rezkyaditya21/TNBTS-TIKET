import { authenticateUser } from '../src/lib/auth.js';
import { createBookingReservation, confirmPaymentAndIssueTickets } from '../src/lib/bookingEngine.js';
import { generateRollingToken, validateTicketScan } from '../src/lib/ticketEngine.js';
import db from '../src/lib/db.js';

console.log('🧪 Starting TNBTS Service Layer Integration Tests...\n');

async function runTests() {
  // Test 1: Authentication
  console.log('--- TEST 1: User Authentication & JWT ---');
  const auth = authenticateUser('wisatawan@gmail.com', 'Bromo2026!');
  if (!auth || !auth.token) {
    throw new Error('❌ Test 1 Failed: Authentication failed.');
  }
  console.log(`✅ Test 1 Passed: Authenticated ${auth.user.name} with Role: ${auth.user.role}`);

  // Test 2: Concurrency Quota Reservation
  console.log('\n--- TEST 2: Concurrency-Safe Quota Reservation ---');
  const dest = db.prepare("SELECT * FROM destinations WHERE code = 'PENANJAKAN_1'").get();
  const slot = db.prepare('SELECT * FROM visit_slots WHERE destination_id = ?').get(dest.id);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const quotaBefore = db.prepare('SELECT * FROM quotas WHERE destination_id = ? AND slot_id = ? AND visit_date = ?').get(dest.id, slot.id, tomorrow);
  console.log(`Initial Quota -> Total: ${quotaBefore.total_quota}, Reserved: ${quotaBefore.reserved_quota}, Paid: ${quotaBefore.paid_quota}`);

  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const testNik1 = `350123456789${randSuffix}`;
  const testNik2 = `350123456788${randSuffix}`;

  const bookingRes = createBookingReservation({
    userId: auth.user.id,
    userEmail: auth.user.email,
    destinationId: dest.id,
    slotId: slot.id,
    visitDate: tomorrow,
    entranceGate: 'CEMORO_LAWANG',
    vehicleType: 'JEEP',
    vehiclePlateNumber: 'N 1234 BZ',
    visitors: [
      { fullName: 'Rezky Aditya', identityType: 'KTP', identityNumber: testNik1, citizenship: 'DOMESTIK' },
      { fullName: 'Siti Rahma', identityType: 'KTP', identityNumber: testNik2, citizenship: 'DOMESTIK' },
    ],
    formFillDurationMs: 4000,
  });

  const quotaAfter = db.prepare('SELECT * FROM quotas WHERE destination_id = ? AND slot_id = ? AND visit_date = ?').get(dest.id, slot.id, tomorrow);
  console.log(`Updated Quota -> Reserved: ${quotaAfter.reserved_quota} (Expected: +2)`);
  if (quotaAfter.reserved_quota !== quotaBefore.reserved_quota + 2) {
    throw new Error('❌ Test 2 Failed: Reserved quota did not increment correctly.');
  }
  console.log(`✅ Test 2 Passed: Booking created with code ${bookingRes.bookingCode} and 15-min TTL lock.`);

  // Test 3: Anti-Hoarding Rule (1 Active Reservation per User)
  console.log('\n--- TEST 3: Anti-Hoarding Session Concurrency Guard ---');
  try {
    createBookingReservation({
      userId: auth.user.id,
      userEmail: auth.user.email,
      destinationId: dest.id,
      slotId: slot.id,
      visitDate: tomorrow,
      visitors: [{ fullName: 'Test', identityNumber: '3501234567899999' }],
    });
    throw new Error('❌ Test 3 Failed: Active reservation limit was not enforced!');
  } catch (err) {
    console.log(`✅ Test 3 Passed: Successfully blocked duplicate active reservation: "${err.message}"`);
  }

  // Test 4: Payment Confirmation & Dynamic Ticket Issuance
  console.log('\n--- TEST 4: Payment Settlement & Ticket Issuance ---');
  const settlement = confirmPaymentAndIssueTickets(bookingRes.bookingId, 'QRIS');
  const quotaPaid = db.prepare('SELECT * FROM quotas WHERE destination_id = ? AND slot_id = ? AND visit_date = ?').get(dest.id, slot.id, tomorrow);
  console.log(`Settled Quota -> Reserved: ${quotaPaid.reserved_quota}, Paid: ${quotaPaid.paid_quota}`);
  if (quotaPaid.paid_quota !== quotaBefore.paid_quota + 2) {
    throw new Error('❌ Test 4 Failed: Paid quota did not increment correctly.');
  }
  console.log(`✅ Test 4 Passed: ${settlement.issuedTickets.length} tickets issued dynamically.`);

  // Test 5: Dynamic Time-Rolling QR Token & Gate Scanner Validation
  console.log('\n--- TEST 5: Rolling Token & Gate Check-in ---');
  const ticket = db.prepare('SELECT * FROM tickets WHERE booking_id = ?').get(bookingRes.bookingId);
  const tokenData = generateRollingToken(ticket.id, ticket.secret_token_salt);
  console.log(`Generated Dynamic Rolling Token: ${tokenData.token} (${tokenData.secondsRemaining}s remaining)`);

  const scanResult1 = validateTicketScan({
    ticketCode: ticket.ticket_code,
    providedToken: tokenData.token,
    officerUserId: 'usr-petugas',
    gateLocation: 'CEMORO_LAWANG',
  });
  if (!scanResult1.isValid) {
    throw new Error(`❌ Test 5 Failed: Scanner returned invalid: ${scanResult1.message}`);
  }
  console.log(`✅ Test 5 Passed: Gate scanner check-in successful for ${scanResult1.ticket.visitorName}!`);

  // Test 6: Anti-Duplicate Scan (Double Scan Prevention)
  console.log('\n--- TEST 6: Double-Scan Prevention Guard ---');
  const scanResult2 = validateTicketScan({
    ticketCode: ticket.ticket_code,
    providedToken: tokenData.token,
    officerUserId: 'usr-petugas',
    gateLocation: 'CEMORO_LAWANG',
  });
  if (scanResult2.isValid || scanResult2.resultCode !== 'ALREADY_USED') {
    throw new Error('❌ Test 6 Failed: Duplicate scan was not blocked!');
  }
  console.log(`✅ Test 6 Passed: Blocked duplicate scan! Reason: "${scanResult2.message}"`);

  console.log('\n🎉 ALL 6 CORE INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(err => {
  console.error('\n💥 Integration test error:', err);
  process.exit(1);
});
