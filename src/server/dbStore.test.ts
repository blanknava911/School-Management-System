import assert from 'node:assert/strict';
import test from 'node:test';

import { db } from './dbStore.js';

test('unknown email addresses are not provisioned during login lookup', () => {
  assert.equal(db.getUserByEmail('unknown-user@example.test'), undefined);
});

test('password verification requires the stored password', () => {
  const result = db.getUserByEmail('admin@platform.com');

  assert.ok(result);
  assert.notEqual(result.passwordHash, 'admin123');
  assert.match(result.passwordHash, /^scrypt\$/);
  assert.equal(db.verifyPassword(result.user, 'definitely-wrong', result.passwordHash), false);
  assert.equal(db.verifyPassword(result.user, 'admin123', result.passwordHash), true);
});
