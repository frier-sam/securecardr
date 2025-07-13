import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User
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

// Configure Google provider with MANDATORY Drive scope
const googleProvider = new GoogleAuthProvider();

// CRITICAL: These scopes are MANDATORY for SecureCardr to function
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');

// Force consent screen to ensure Drive permissions are granted
// This prevents users from skipping the Drive permission
googleProvider.setCustomParameters({
  prompt: 'consent', // ALWAYS show consent screen
  access_type: 'offline', // Get refresh token
  include_granted_scopes: 'false' // Don't include previously granted scopes
});

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  accessToken?: string;
  drivePermissionGranted: boolean;
  grantedScopes: string[];
}

/**
 * Verify that required Google Drive permissions are granted
 */
function verifyDrivePermissions(result: any): { hasPermission: boolean; grantedScopes: string[] } {
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  
  if (!token) {
    console.error('No access token received from Google');
    return { hasPermission: false, grantedScopes: [] };
  }
  
  // Get granted scopes - try multiple methods as Firebase Auth can be inconsistent
  let grantedScopes: string[] = [];
  
  // Method 1: Check credential.scope
  if (credential.scope) {
    grantedScopes = credential.scope.split(' ');
  }
  
  // Method 2: Check if scopes are in credential object directly
  if (grantedScopes.length === 0 && (credential as any).idToken) {
    // Sometimes scopes are not returned but the token itself indicates permissions
    console.log('Scopes not returned in credential, will verify via Drive API test');
    grantedScopes = ['drive.file']; // Assume granted, will verify with actual API call
  }
  
  // Method 3: Check for any indication of successful auth with scopes
  if (grantedScopes.length === 0 && token) {
    console.log('No scope information available, will rely on Drive API test for verification');
    grantedScopes = ['unknown']; // Mark as unknown, will verify with API call
  }
  
  const hasDrivePermission = grantedScopes.some(scope => 
    scope.includes('drive.file') || scope.includes('drive') || scope === 'unknown'
  );
  
  console.log('Granted scopes:', grantedScopes);
  console.log('Drive permission indicated:', hasDrivePermission);
  
  return { hasPermission: hasDrivePermission, grantedScopes };
}

/**
 * Test Google Drive API access to ensure permissions are working
 */
async function testDriveAccess(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('Drive API access verified successfully');
      return true;
    } else {
      console.error('Drive API access failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error testing Drive API access:', error);
    return false;
  }
}

/**
 * Sign in with Google and REQUIRE Drive permissions
 */
export async function signInWithGoogle(): Promise<AuthUser> {
  try {
    console.log('Starting Google sign in with MANDATORY Drive access...');
    
    let result;
    
    // First try popup method
    try {
      result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign in popup completed');
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
    
    // Verify Drive permissions are granted (but rely primarily on API test)
    const { hasPermission, grantedScopes } = verifyDrivePermissions(result);
    
    // Get access token and test Drive API access (this is the definitive test)
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    if (!token) {
      await signOut(auth);
      throw new Error('NO_ACCESS_TOKEN');
    }
    
    console.log('Testing actual Drive API access...');
    // Test actual Drive API access - this is the real verification
    const driveAccessWorks = await testDriveAccess(token);
    
    if (!driveAccessWorks) {
      await signOut(auth);
      throw new Error('DRIVE_API_ACCESS_FAILED');
    }
    
    console.log('Drive API access verified successfully!');
    
    // If we get here, Drive access is working regardless of scope detection issues
    
    // Store the access token for Drive API calls
    console.log('Storing access token in sessionStorage');
    sessionStorage.setItem('googleAccessToken', token);
    
    const user = result.user;
    console.log('User authenticated successfully with Drive access:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      hasToken: !!token,
      drivePermission: hasPermission,
      grantedScopes: grantedScopes
    });
    
    const authUser: AuthUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      accessToken: token,
      drivePermissionGranted: true,
      grantedScopes: grantedScopes
    };
    
    return authUser;
    
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Provide specific error messages for different failure scenarios
    if (error.message === 'REDIRECT_IN_PROGRESS') {
      throw error;
    } else if (error.message === 'DRIVE_PERMISSION_REQUIRED') {
      throw new Error('Google Drive access is required for SecureCardr to function. Please sign in again and grant Drive permissions.');
    } else if (error.message === 'NO_ACCESS_TOKEN') {
      throw new Error('Failed to obtain access token. Please try signing in again.');
    } else if (error.message === 'DRIVE_API_ACCESS_FAILED') {
      throw new Error('Unable to access Google Drive. Please check your permissions and try again.');
    }
    
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

/**
 * Check for redirect result and verify Drive permissions
 */
export async function checkRedirectResult(): Promise<AuthUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) {
      return null;
    }
    
    console.log('Redirect sign in completed');
    
    // Verify Drive permissions are granted (but rely primarily on API test)
    const { hasPermission, grantedScopes } = verifyDrivePermissions(result);
    
    // Get access token and test Drive API access (this is the definitive test)
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    if (!token) {
      await signOut(auth);
      throw new Error('NO_ACCESS_TOKEN');
    }
    
    console.log('Testing actual Drive API access...');
    // Test actual Drive API access - this is the real verification
    const driveAccessWorks = await testDriveAccess(token);
    
    if (!driveAccessWorks) {
      await signOut(auth);
      throw new Error('DRIVE_API_ACCESS_FAILED');
    }
    
    console.log('Drive API access verified successfully!');
    
    // If we get here, Drive access is working regardless of scope detection issues
    
    // Store the access token for Drive API calls
    console.log('Storing access token in sessionStorage');
    sessionStorage.setItem('googleAccessToken', token);
    
    const user = result.user;
    
    const authUser: AuthUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      accessToken: token,
      drivePermissionGranted: true,
      grantedScopes: grantedScopes
    };
    
    return authUser;
    
  } catch (error: any) {
    console.error('Error handling redirect result:', error);
    
    if (error.message === 'DRIVE_PERMISSION_REQUIRED') {
      throw new Error('Google Drive access is required for SecureCardr to function. Please sign in again and grant Drive permissions.');
    } else if (error.message === 'NO_ACCESS_TOKEN') {
      throw new Error('Failed to obtain access token. Please try signing in again.');
    } else if (error.message === 'DRIVE_API_ACCESS_FAILED') {
      throw new Error('Unable to access Google Drive. Please check your permissions and try again.');
    }
    
    throw new Error(error.message || 'Failed to handle redirect result');
  }
}

// Removed processAuthResult function as it's replaced by the new verification logic

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
 * Subscribe to auth state changes with Drive permission verification
 */
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
    
    if (user) {
      // Get the access token from sessionStorage
      let token = sessionStorage.getItem('googleAccessToken');
      
      // If no token found, wait a bit for the sign-in process to complete
      if (!token) {
        console.log('No access token found initially, waiting for sign-in process...');
        
        // Wait up to 3 seconds for the token to be stored
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          token = sessionStorage.getItem('googleAccessToken');
          if (token) {
            console.log('Access token found after waiting');
            break;
          }
        }
      }
      
      if (!token) {
        console.warn('No access token found after waiting - user may need to sign in again');
        callback(null);
        return;
      }
      
      // Verify Drive API access is still working
      const driveAccessWorks = await testDriveAccess(token);
      
      if (!driveAccessWorks) {
        console.error('Drive API access lost, signing out user');
        await signOutUser();
        callback(null);
        return;
      }
      
      console.log('Access token found and Drive access verified:', !!token);
      
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        accessToken: token || undefined,
        drivePermissionGranted: true,
        grantedScopes: [] // Will be populated on next sign-in
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

/**
 * Check if user has required Drive permissions
 */
export async function checkDrivePermissions(): Promise<boolean> {
  const token = getAccessToken();
  if (!token) {
    return false;
  }
  
  return await testDriveAccess(token);
}

/**
 * Re-authenticate user if Drive permissions are missing
 */
export async function reauthorizeForDriveAccess(): Promise<AuthUser> {
  console.log('Re-authorizing for Drive access...');
  
  // Sign out current user first
  await signOutUser();
  
  // Force new sign-in with Drive permissions
  return await signInWithGoogle();
}