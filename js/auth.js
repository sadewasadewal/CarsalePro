// js/auth.js
import { isFirebaseLive, firebaseAuth } from './config.js';

const MOCK_USER_KEY = 'vahanapissa_mock_user';
let authCallbacks = [];
let currentMockUser = null;

// Initial load of mock user from storage
try {
    const saved = localStorage.getItem(MOCK_USER_KEY);
    if (saved) {
        currentMockUser = JSON.parse(saved);
    }
} catch (e) {
    console.error('Error loading mock user:', e);
}

// Unified user interface returned by the auth module:
// {
//    uid: String,
//    displayName: String,
//    email: String,
//    photoURL: String
// }

export function getCurrentUser() {
    if (isFirebaseLive && firebaseAuth) {
        return firebaseAuth.currentUser;
    }
    return currentMockUser;
}

// Register a callback to listen to auth state changes
export async function listenToAuthChanges(callback) {
    authCallbacks.push(callback);
    
    if (isFirebaseLive && firebaseAuth) {
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        onAuthStateChanged(firebaseAuth, (user) => {
            callback(user);
        });
    } else {
        // Immediately trigger for mock user
        callback(currentMockUser);
    }
}

// Trigger all registered callbacks (used in mock mode changes)
function notifyAuthChange(user) {
    authCallbacks.forEach(cb => {
        try {
            cb(user);
        } catch (e) {
            console.error('Error in auth callback:', e);
        }
    });
}

// Login operation
export async function loginWithGoogle() {
    if (isFirebaseLive && firebaseAuth) {
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(firebaseAuth, provider);
            return result.user;
        } catch (error) {
            console.error('Firebase sign-in error:', error);
            throw error;
        }
    } else {
        // Under mock mode, app.js will open a modal to select/input mock details.
        // This function will return null to signify we need to show the mock modal.
        return null;
    }
}

// Complete mock login with custom details
export function loginMockUser(name, email, avatarUrl) {
    // Generate a simple mock avatar if not provided
    const avatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
    const isAdmin = email.toLowerCase().trim() === 'admin@wahanapissa.com';
    
    currentMockUser = {
        uid: isAdmin ? 'mock_uid_admin' : 'mock_uid_' + Math.random().toString(36).substr(2, 9),
        displayName: name,
        email: email,
        photoURL: avatar,
        isAdmin: isAdmin
    };
    
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(currentMockUser));
    notifyAuthChange(currentMockUser);
    return currentMockUser;
}

// Logout operation
export async function logoutUser() {
    if (isFirebaseLive && firebaseAuth) {
        try {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
            await signOut(firebaseAuth);
        } catch (error) {
            console.error('Firebase sign-out error:', error);
            throw error;
        }
    } else {
        currentMockUser = null;
        localStorage.removeItem(MOCK_USER_KEY);
        notifyAuthChange(null);
    }
}

// ----------------- MANUAL AUTH & MOCK USERS DB -----------------
const MOCK_USERS_LIST_KEY = 'vahanapissa_mock_users_list';

function getMockUsersList() {
    try {
        const stored = localStorage.getItem(MOCK_USERS_LIST_KEY);
        let users = [];
        
        if (!stored) {
            users = [
                { displayName: 'Kasun Perera', email: 'kasun.perera@gmail.com', password: 'password', uid: 'mock_uid_kasun', photoURL: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=kasun' },
                { displayName: 'Shashini Silva', email: 'shashini.silva@gmail.com', password: 'password', uid: 'mock_uid_shashini', photoURL: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=shashini' }
            ];
        } else {
            users = JSON.parse(stored);
        }
        
        // Ensure admin user is always in the mock list
        const adminEmail = 'admin@wahanapissa.com';
        const hasAdmin = users.some(u => u.email.toLowerCase() === adminEmail);
        if (!hasAdmin) {
            users.push({
                displayName: 'System Admin',
                email: adminEmail,
                password: 'adminpassword',
                uid: 'mock_uid_admin',
                photoURL: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=admin',
                isAdmin: true
            });
            localStorage.setItem(MOCK_USERS_LIST_KEY, JSON.stringify(users));
        }
        return users;
    } catch (e) {
        console.error('Error loading mock users list:', e);
        return [];
    }
}

function saveMockUsersList(users) {
    try {
        localStorage.setItem(MOCK_USERS_LIST_KEY, JSON.stringify(users));
        return true;
    } catch (e) {
        console.error('Error saving mock users list:', e);
        return false;
    }
}

export function registerMockUser(name, email, password) {
    const users = getMockUsersList();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        throw new Error('This email is already registered.');
    }
    const newUser = {
        uid: 'mock_uid_' + Math.random().toString(36).substr(2, 9),
        displayName: name,
        email: email.toLowerCase().trim(),
        password: password,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    };
    users.push(newUser);
    saveMockUsersList(users);
    
    currentMockUser = {
        uid: newUser.uid,
        displayName: newUser.displayName,
        email: newUser.email,
        photoURL: newUser.photoURL
    };
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(currentMockUser));
    notifyAuthChange(currentMockUser);
    return currentMockUser;
}

export function loginMockUserEmail(email, password) {
    const users = getMockUsersList();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
        throw new Error('Invalid email or password.');
    }
    if (user.password !== password) {
        throw new Error('Invalid email or password.');
    }
    
    currentMockUser = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        isAdmin: user.isAdmin || user.email.toLowerCase() === 'admin@wahanapissa.com'
    };
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(currentMockUser));
    notifyAuthChange(currentMockUser);
    return currentMockUser;
}

export async function registerFirebaseUser(name, email, password) {
    if (isFirebaseLive && firebaseAuth) {
        try {
            const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            await updateProfile(userCredential.user, { 
                displayName: name,
                photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
            });
            const user = firebaseAuth.currentUser;
            notifyAuthChange(user);
            return user;
        } catch (error) {
            console.error('Firebase manual registration error:', error);
            throw error;
        }
    }
    throw new Error('Firebase is not connected.');
}

export async function loginFirebaseUser(email, password) {
    if (isFirebaseLive && firebaseAuth) {
        try {
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
            const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
            return userCredential.user;
        } catch (error) {
            // Check if admin credentials were used but account doesn't exist in Firebase yet.
            // If so, automatically register the admin account.
            const cleanEmail = email.toLowerCase().trim();
            if (cleanEmail === 'admin@wahanapissa.com' && 
                (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found')) {
                try {
                    console.log('VahanaPissa: Admin account not found in Firebase. Auto-registering admin...');
                    const user = await registerFirebaseUser('System Admin', email, password);
                    return user;
                } catch (regError) {
                    console.error('Failed to auto-register admin in Firebase:', regError);
                }
            }
            console.error('Firebase manual login error:', error);
            throw error;
        }
    }
    throw new Error('Firebase is not connected.');
}

// Check if a user has admin privileges
export function isAdminUser(user) {
    if (!user) return false;
    const adminEmails = ['admin@wahanapissa.com', 'admin@carsalepro.com'];
    return adminEmails.includes(user.email.toLowerCase().trim()) || user.isAdmin === true;
}
