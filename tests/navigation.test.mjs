import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeNextPath } from '../src/lib/navigation.ts';

test('login redirects remain within the application', () => {
  for (const value of [null, '', 'https://example.com', '//example.com', '/\\example.com', 'javascript:alert(1)', '/login', '/%2e/login', '/\n/example.com']) {
    assert.equal(safeNextPath(value), '/', String(value));
  }
  assert.equal(safeNextPath('/bookings?status=Pending#upcoming'), '/bookings?status=Pending#upcoming');
});
