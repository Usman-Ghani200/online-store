/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
  throw new Error(
    'Missing Firebase settings. Add the VITE_FIREBASE_* values to your .env file, and to Vercel under Settings > Environment Variables (see .env.example).'
  );
}

const app = initializeApp(config);

export const auth = getAuth(app);
// ignoreUndefinedProperties: optional fields that are undefined are simply skipped instead of causing an error
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
