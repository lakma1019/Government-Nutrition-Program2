// Firebase configuration for the application
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3l-w9qwi0msQjmm2jtHUh7xpvKnr6rxo",
  authDomain: "goverment-nutrition-program.firebaseapp.com",
  projectId: "goverment-nutrition-program",
  storageBucket: "goverment-nutrition-program.firebasestorage.app",
  messagingSenderId: "403137200151",
  appId: "1:403137200151:web:44d85e36a60397d4e6dc52",
  measurementId: "G-N3YED2VBVE"
};

// Log Firebase configuration for debugging
console.log('[FIREBASE_CONFIG] Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? "API_KEY_PRESENT" : "API_KEY_MISSING",
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase
let app = initializeApp(firebaseConfig);
console.log('[FIREBASE_CONFIG] Firebase app initialized successfully');

// Initialize Firebase Storage
console.log('[FIREBASE_CONFIG] Initializing Firebase Storage...');
let storage = getStorage(app);
console.log('[FIREBASE_CONFIG] Firebase Storage initialized successfully with bucket:',
  storage.app.options.storageBucket || 'unknown bucket');

// Initialize Firebase Analytics if supported
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Check if we're using the Firebase emulator
const isUsingFirebaseEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true';

// If using emulator, connect to it
if (isUsingFirebaseEmulator && typeof window !== 'undefined') {
  console.log('[FIREBASE_CONFIG] Using Firebase emulator');
  // You can add emulator connection code here if needed
}

export { app, storage, analytics, firebaseConfig, isUsingFirebaseEmulator };
