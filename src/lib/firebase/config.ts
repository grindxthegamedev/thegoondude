/**
 * Firebase Configuration
 * Initialize Firebase app and export services
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase config from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lustlist411',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we're in dev mode
const isDev = process.env.NODE_ENV === 'development';

// Track emulator connection status
let emulatorsConnected = false;

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

function getFirebaseApp(): FirebaseApp {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }
    return app;
}

export function getDb(): Firestore {
    if (!db) {
        db = getFirestore(getFirebaseApp());
        // Connect to emulator in dev
        if (isDev && !emulatorsConnected && typeof window !== 'undefined') {
            connectFirestoreEmulator(db, 'localhost', 8081);
            emulatorsConnected = true;
        }
    }
    return db;
}

export function getAuthInstance(): Auth {
    if (!auth) {
        auth = getAuth(getFirebaseApp());
        // Connect to emulator in dev
        if (isDev && typeof window !== 'undefined') {
            try {
                connectAuthEmulator(auth, 'http://localhost:9100', { disableWarnings: true });
            } catch {
                // Already connected
            }
        }
    }
    return auth;
}

export function getStorageInstance(): FirebaseStorage {
    if (!storage) {
        storage = getStorage(getFirebaseApp());
    }
    return storage;
}

export { app, db, auth, storage };
