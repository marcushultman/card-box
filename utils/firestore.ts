// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { enableIndexedDbPersistence, Firestore, initializeFirestore } from 'firebase/firestore';
import { IS_BROWSER } from '$fresh/runtime.ts';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAc7D3O00uiPDJDCVs3WMhoOlHXIGghxo8',
  authDomain: 'card-bored-box.firebaseapp.com',
  projectId: 'card-bored-box',
  storageBucket: 'card-bored-box.appspot.com',
  messagingSenderId: '1076181428926',
  appId: '1:1076181428926:web:07098a8f1ef63032ab8cef',
  measurementId: 'G-0KME5NT26D',
};

const w = window as typeof window & { firestore?: Firestore };

if (w.firestore === undefined) {
  const app = initializeApp(firebaseConfig);
  const firestore = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  if (IS_BROWSER) {
    await enableIndexedDbPersistence(firestore, undefined);
  }
  w.firestore = firestore;
}

export default w.firestore!;
