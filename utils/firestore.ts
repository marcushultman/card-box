import app from '@firebase';
import { enableIndexedDbPersistence, initializeFirestore } from 'firebase/firestore';
import { IS_BROWSER } from '$fresh/src/runtime/utils.ts';

const firestore = initializeFirestore(app, { experimentalForceLongPolling: true });
export default firestore;

if (IS_BROWSER) {
  await enableIndexedDbPersistence(firestore, undefined);
}
