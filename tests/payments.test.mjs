import assert from 'node:assert/strict';
import { test } from 'node:test';
import { paymentSummary, normalizePayments, reviewPayment } from '../src/lib/payments.ts';
const booking = { id:'booking',serviceId:'service',totalAmount:10000,requiredAmount:5000,status:'Pending',activity:[] };
const gateway = { id:'payment',bookingId:'booking',amount:5000,method:'gateway',status:'approved',createdAt:'2026-09-16T10:00:00Z' };
const state = { services:[],bookings:[booking],payments:[gateway] };
test('only net undisputed payments count toward confirmation', () => {
  assert.equal(paymentSummary(state,booking).confirmed,true);
  const refunded = {...state,payments:[{...gateway,refundedAmount:1000}]};
  assert.equal(paymentSummary(refunded,booking).paid,4000);
  assert.equal(normalizePayments(refunded).bookings[0].status,'Pending');
  const disputed = {...state,payments:[{...gateway,disputed:true}]};
  assert.equal(paymentSummary(disputed,booking).paid,0);
});
test('a verified late payment cannot reopen cancelled or completed bookings', () => {
  for (const status of ['Cancelled','Completed']) assert.equal(normalizePayments({...state,bookings:[{...booking,status}]}).bookings[0].status,status);
});
test('owner receipt review cannot approve or alter gateway transactions', () => {
  assert.equal(reviewPayment(state,'payment','rejected','Not a receipt'),state);
});
