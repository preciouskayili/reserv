import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createActionLock } from '../src/lib/action-lock.ts';

test('rapid submissions execute once until the request settles', async () => {
  const lock = createActionLock();
  let complete;
  let calls = 0;
  const action = () => { calls++; return new Promise(resolve => { complete = resolve; }); };
  const first = lock.run(action);
  assert.equal(await lock.run(action), false);
  assert.equal(calls, 1);
  complete(true);
  assert.equal(await first, true);
  assert.equal(await lock.run(async () => true), true);
});

test('failed saves and exceptions release the lock for retries', async () => {
  const lock = createActionLock();
  assert.equal(await lock.run(async () => false), false);
  await assert.rejects(lock.run(async () => { throw new Error('offline'); }), /offline/);
  await assert.rejects(lock.run(() => { throw new Error('invalid'); }), /invalid/);
  assert.equal(await lock.run(async () => true), true);
});

test('independent actions remain available while another request is pending', async () => {
  const first = createActionLock();
  const second = createActionLock();
  let complete;
  const pending = first.run(() => new Promise(resolve => { complete = resolve; }));
  assert.equal(await second.run(async () => true), true);
  complete(true);
  await pending;
});
