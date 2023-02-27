import db from '@firestore';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { sendMulticast } from './firebase-admin-messaging.ts';
import getEnv from './env.ts';

const PROJECT_ID = getEnv('FIREBASE_PROJECT_ID');
const CLIENT_EMAIL = getEnv('FIREBASE_EMAIL');
const PRIVATE_KEY = getEnv('FIREBASE_PRIVATE_KEY_PKCS8');

export default async function sendNotification(ids: string[]) {
  const snapshots = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', ids)));

  const tokens = snapshots.docs.map<string>((snapshot) => snapshot.data().fcmToken).filter(
    (token) => token !== undefined,
  );

  const title = 'title';
  const body = 'body';

  const notification = { title, body };

  return sendMulticast(tokens, {
    notification,
    credentials: {
      projectId: PROJECT_ID,
      clientEmail: CLIENT_EMAIL,
      privateKey: PRIVATE_KEY,
    },
  });
}
