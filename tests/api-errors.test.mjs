import assert from 'node:assert/strict';
import { test } from 'node:test';
import { api, ApiError } from '../src/lib/api.ts';

async function withFetch(implementation, check) {
  const original = globalThis.fetch;
  globalThis.fetch = implementation;
  try { await check(); } finally { globalThis.fetch = original; }
}

test('unreachable backend produces a recoverable connection error', async () => {
  await withFetch(async () => { throw new TypeError('Failed to fetch'); }, async () => {
    await assert.rejects(api.health(), error => error instanceof ApiError && error.status === 0 && error.message.includes('connection'));
  });
});

test('expired sessions remain distinguishable from service outages', async () => {
  await withFetch(async () => new Response(JSON.stringify({ message: 'Session expired' }), { status: 401, headers: { 'Content-Type': 'application/json' } }), async () => {
    await assert.rejects(api.auth.getMe(), error => error instanceof ApiError && error.status === 401);
  });
});

test('timeouts offer a retry instead of a browser exception', async () => {
  await withFetch(async () => { throw new DOMException('Timed out', 'TimeoutError'); }, async () => {
    await assert.rejects(api.health(), error => error instanceof ApiError && error.message.includes('too long'));
  });
});

test('HTML fallback responses do not masquerade as successful API data', async () => {
  await withFetch(async () => new Response('<html>Unavailable</html>', { headers: { 'Content-Type': 'text/html' } }), async () => {
    await assert.rejects(api.health(), error => error instanceof ApiError && error.status === 502);
  });
});
