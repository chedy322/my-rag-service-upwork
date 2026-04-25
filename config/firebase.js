import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { decodedFIREBASE_SERVICE_ACCOUNT } from '../utils/decode.js';

const serviceAccount = JSON.parse(decodedFIREBASE_SERVICE_ACCOUNT());

let db;
let auth;

export async function getFirebaseContext() {
  if (db && auth) return { db, auth };

  const app =
    getApps().length === 0
      ? initializeApp({ credential: cert(serviceAccount) })
      : getApps()[0];

  db = getFirestore(app);
  auth = getAuth(app);

  return { db, auth };
}