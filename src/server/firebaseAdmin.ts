import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

export interface FirebaseServices {
  app: App;
  auth: Auth;
  firestore: Firestore;
  storage: Storage;
  bucketName: string;
}

let cachedServices: FirebaseServices | null | undefined;

export function getFirebaseServices(): FirebaseServices | null {
  if (cachedServices !== undefined) return cachedServices;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const emulatorConfigured = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
  if (!projectId || (process.env.NODE_ENV !== 'production' && !emulatorConfigured && process.env.USE_FIREBASE !== 'true')) {
    cachedServices = null;
    return cachedServices;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const credential = serviceAccountJson
      ? cert(JSON.parse(serviceAccountJson))
      : applicationDefault();
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
    const app = getApps()[0] || initializeApp({ credential, projectId, storageBucket: bucketName });
    const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
    cachedServices = {
      app,
      auth: getAuth(app),
      firestore: getFirestore(app, databaseId),
      storage: getStorage(app),
      bucketName,
    };
    return cachedServices;
  } catch (error) {
    console.error('[firebase] Admin services could not be initialized:', error);
    cachedServices = null;
    return cachedServices;
  }
}

export async function loadPlatformState(): Promise<Record<string, unknown> | null> {
  const services = getFirebaseServices();
  if (!services) return null;
  const snapshot = await services.firestore.collection('system').doc('platformState').get();
  return snapshot.exists ? (snapshot.data() as Record<string, unknown>) : null;
}

export async function savePlatformState(state: Record<string, unknown>): Promise<void> {
  const services = getFirebaseServices();
  if (!services) return;
  await services.firestore.collection('system').doc('platformState').set({
    ...state,
    updatedAt: new Date().toISOString(),
  });
}

export async function uploadSchoolFile(
  schoolId: string,
  category: 'knowledge' | 'marks-imports' | 'assessments',
  objectId: string,
  fileName: string,
  mimeType: string,
  data: Buffer
): Promise<string | null> {
  const services = getFirebaseServices();
  if (!services) return null;
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  const objectPath = `schools/${schoolId}/${category}/${objectId}/${safeName}`;
  const file = services.storage.bucket(services.bucketName).file(objectPath);
  await file.save(data, {
    contentType: mimeType || 'application/octet-stream',
    resumable: false,
    metadata: { metadata: { schoolId, category, objectId } },
  });
  return objectPath;
}

export async function downloadSchoolFile(objectPath: string): Promise<{ data: Buffer; contentType: string } | null> {
  const services = getFirebaseServices();
  if (!services) return null;
  const file = services.storage.bucket(services.bucketName).file(objectPath);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [downloadResult, metadataResult] = await Promise.all([file.download(), file.getMetadata()]);
  const data = downloadResult[0];
  const metadata = metadataResult[0];
  return { data, contentType: metadata.contentType || 'application/octet-stream' };
}
