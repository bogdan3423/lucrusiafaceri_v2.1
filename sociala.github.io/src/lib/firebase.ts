/**
 * Firebase Configuration for Lucru si Afaceri
 * Connects to the existing Firebase project
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration - existing project
const firebaseConfig = {
  apiKey: "AIzaSyDmm0H8mpcvzt0u6uUgDit9uX0OUhZ614c",
  authDomain: "lucru-si-afaceri.firebaseapp.com",
  projectId: "lucru-si-afaceri",
  storageBucket: "lucru-si-afaceri.firebasestorage.app",
  messagingSenderId: "334361645095",
  appId: "1:334361645095:web:9305f356793cdf9fa1be02",
  measurementId: "G-3MZ1YZYNLB"
};

// Collection names - matching existing data
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products', // Posts are stored in 'products' collection
} as const;

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  // Client-side only
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
export default firebaseConfig;
