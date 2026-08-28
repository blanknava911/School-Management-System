import assert from 'node:assert/strict';
import test from 'node:test';
import { downloadSchoolFile, getFirebaseServices, loadPlatformState, savePlatformState, uploadSchoolFile } from './firebaseAdmin.js';

const emulatorReady = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST && (process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT));

test('Firebase emulator persists shared state and tenant-scoped files', { skip: !emulatorReady }, async () => {
  assert.ok(getFirebaseServices());
  const marker = `emulator-${Date.now()}`;
  await savePlatformState({ marker });
  assert.equal((await loadPlatformState())?.marker, marker);
  const objectPath = await uploadSchoolFile('SCH-TEST', 'knowledge', marker, 'evidence.txt', 'text/plain', Buffer.from('generated test evidence'));
  assert.match(objectPath || '', /^schools\/SCH-TEST\/knowledge\//);
  const file = await downloadSchoolFile(objectPath!);
  assert.equal(file?.data.toString(), 'generated test evidence');
});
