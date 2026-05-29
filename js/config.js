// js/config.js

// Firebase ES Module CDN URLs
const FIREBASE_APP_URL = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
const FIREBASE_AUTH_URL = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
const FIREBASE_FIRESTORE_URL = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const CONFIG_KEY = 'vahanapissa_firebase_config';

export async function getFirebaseConfig() {
    // 1. Try to load config from project file first (for IDE and portability support)
    try {
        const response = await fetch('firebase-config.json');
        if (response.ok) {
            const fileConfig = await response.json();
            if (fileConfig && fileConfig.apiKey && fileConfig.projectId && fileConfig.apiKey !== 'YOUR_API_KEY') {
                console.log('VahanaPissa: Loaded Firebase configuration from firebase-config.json file.');
                return fileConfig;
            }
        }
    } catch (e) {
        // Silently continue to check localStorage
    }

    // 2. Fall back to localStorage
    try {
        const stored = localStorage.getItem(CONFIG_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.error('Error reading Firebase config from localStorage:', e);
        return null;
    }
}

export function saveFirebaseConfig(config) {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        return true;
    } catch (e) {
        console.error('Error saving Firebase config to localStorage:', e);
        return false;
    }
}

export function clearFirebaseConfig() {
    try {
        localStorage.removeItem(CONFIG_KEY);
        return true;
    } catch (e) {
        console.error('Error clearing Firebase config:', e);
        return false;
    }
}

// Variables to hold Firebase instances
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let isFirebaseLive = false;

// Attempt to load and initialize Firebase
export async function initializeFirebase() {
    const config = await getFirebaseConfig();
    
    if (!config || !config.apiKey || !config.projectId) {
        console.log('VahanaPissa: No Firebase config found. Running in Demo Mode (Local Storage).');
        isFirebaseLive = false;
        return { enabled: false, app: null, auth: null, db: null };
    }

    try {
        // Dynamically import Firebase libraries using native ES Modules
        const { initializeApp } = await import(FIREBASE_APP_URL);
        const { getAuth } = await import(FIREBASE_AUTH_URL);
        const { getFirestore } = await import(FIREBASE_FIRESTORE_URL);

        // Initialize Firebase
        firebaseApp = initializeApp(config);
        firebaseAuth = getAuth(firebaseApp);
        firebaseDb = getFirestore(firebaseApp);
        
        isFirebaseLive = true;
        console.log('VahanaPissa: Firebase initialized successfully. Running in LIVE mode!');
        
        return {
            enabled: true,
            app: firebaseApp,
            auth: firebaseAuth,
            db: firebaseDb
        };
    } catch (error) {
        console.error('VahanaPissa: Failed to initialize Firebase with stored config. Falling back to Demo Mode.', error);
        isFirebaseLive = false;
        return { enabled: false, app: null, auth: null, db: null, error: error.message };
    }
}

export { isFirebaseLive, firebaseApp, firebaseAuth, firebaseDb };
