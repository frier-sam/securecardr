import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
  getAdditionalUserInfo
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google provider with Drive scope
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.setCustomParameters({
  prompt: 'consent', // Force consent screen to ensure Drive permissions
  access_type: 'offline' // Get refresh token
});

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  accessToken?: string;
}

/**
 * Sign in with Google and get Drive permissions
 */
export async function signInWithGoogle(): Promise<AuthUser> {
  try {
    console.log('Starting Google sign in...');
    
    // First try popup method
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign in popup completed');
      return processAuthResult(result);
    } catch (popupError: any) {
      console.warn('Popup sign in failed:', popupError.message);
      
      // If popup fails due to blocking, try redirect method
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.message.includes('popup')) {
        console.log('Falling back to redirect sign in...');
        await signInWithRedirect(auth, googleProvider);
        // The redirect will handle the rest, return will happen in checkRedirectResult
        throw new Error('REDIRECT_IN_PROGRESS');
      }
      
      // Re-throw other errors
      throw popupError;
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    if (error.message === 'REDIRECT_IN_PROGRESS') {
      throw error;
    }
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

/**
 * Check for redirect result on app initialization
 */
export async function checkRedirectResult(): Promise<AuthUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('Redirect sign in completed');
      return processAuthResult(result);
    }
    return null;
  } catch (error: any) {
    console.error('Error handling redirect result:', error);
    throw new Error(error.message || 'Failed to handle redirect result');
  }
}

/**
 * Process authentication result from either popup or redirect
 */
function processAuthResult(result: any): AuthUser {
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  
  const user = result.user;
  const additionalInfo = getAdditionalUserInfo(result);
  
  console.log('User info:', {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    hasToken: !!token
  });
  
  // Store the access token for Drive API calls
  if (token) {
    console.log('Storing access token in sessionStorage');
    sessionStorage.setItem('googleAccessToken', token);
  } else {
    console.warn('No access token received from Google');
  }
  
  const authUser: AuthUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    accessToken: token
  };
  
  console.log('Returning auth user:', authUser);
  return authUser;
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    sessionStorage.removeItem('googleAccessToken');
    sessionStorage.removeItem('driveFolderId');
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
    if (user) {
      // Get the access token from sessionStorage
      const token = sessionStorage.getItem('googleAccessToken');
      console.log('Access token found:', !!token);
      
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        accessToken: token || undefined
      };
      
      console.log('Calling callback with user:', authUser);
      callback(authUser);
    } else {
      console.log('Calling callback with null');
      callback(null);
    }
  });
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return sessionStorage.getItem('googleAccessToken');
}