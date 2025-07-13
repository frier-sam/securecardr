import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, onAuthChange, signInWithGoogle, signOutUser, checkRedirectResult, reauthorizeForDriveAccess } from '../services/auth';
import { vaultSession } from '../services/vaultSession';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  reauthorize: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Drive Permission Error Modal Component
function DrivePermissionModal({ 
  isOpen, 
  onRetry, 
  onCancel, 
  error 
}: { 
  isOpen: boolean;
  onRetry: () => void;
  onCancel: () => void;
  error: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary">Google Drive Access Required</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-text-secondary mb-4">
            SecureCardr requires access to your Google Drive to store your encrypted card data securely. 
            Your data is encrypted before being stored, and only you have the key to decrypt it.
          </p>
          
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-200 mb-2">Why Do We Need Drive Access?</h3>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• Store your encrypted card data in your personal Google Drive</li>
              <li>• You maintain full control over your data</li>
              <li>• Zero-knowledge architecture - we never see your unencrypted data</li>
              <li>• Sync across devices with your Google account</li>
            </ul>
          </div>
          
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Grant Drive Access
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDrivePermissionModal, setShowDrivePermissionModal] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    
    // Check for redirect result first
    checkRedirectResult().then((redirectUser) => {
      if (redirectUser) {
        console.log('AuthProvider: Redirect result found:', redirectUser);
        setUser(redirectUser);
        setLoading(false);
        setError(null);
      }
    }).catch((error) => {
      console.error('AuthProvider: Error checking redirect result:', error);
      setError(error.message);
      setLoading(false);
      
      // Show Drive permission modal if needed
      if (error.message.includes('Drive access is required')) {
        setShowDrivePermissionModal(true);
      }
    });
    
    const unsubscribe = onAuthChange((user) => {
      console.log('AuthProvider: Auth state changed:', user);
      setUser(user);
      setLoading(false);
      
      // Clear error if user successfully authenticated
      if (user) {
        setError(null);
        setShowDrivePermissionModal(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      console.log('AuthProvider: Starting sign in');
      setError(null);
      setLoading(true);
      
      const result = await signInWithGoogle();
      console.log('AuthProvider: Sign in successful:', result);
      
      // Set the user immediately since we have the complete result
      setUser(result);
      setLoading(false);
      setShowDrivePermissionModal(false);
      
    } catch (error: any) {
      console.error('AuthProvider: Sign in error:', error);
      
      // Don't show error for redirect in progress
      if (error.message === 'REDIRECT_IN_PROGRESS') {
        console.log('AuthProvider: Redirect in progress, not showing error');
        return;
      }
      
      setError(error.message);
      setLoading(false);
      
      // Show Drive permission modal if needed
      if (error.message.includes('Drive access is required') || 
          error.message.includes('Drive permissions') ||
          error.message.includes('Unable to access Google Drive')) {
        setShowDrivePermissionModal(true);
      }
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      // Clear vault session on sign out
      vaultSession.clearSession();
      setError(null);
      setShowDrivePermissionModal(false);
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message);
    }
  };

  const reauthorize = async () => {
    try {
      console.log('AuthProvider: Re-authorizing for Drive access');
      setError(null);
      setLoading(true);
      
      const result = await reauthorizeForDriveAccess();
      console.log('AuthProvider: Re-authorization successful:', result);
      
      setShowDrivePermissionModal(false);
      
    } catch (error: any) {
      console.error('AuthProvider: Re-authorization error:', error);
      
      // Don't show error for redirect in progress
      if (error.message === 'REDIRECT_IN_PROGRESS') {
        console.log('AuthProvider: Redirect in progress, not showing error');
        return;
      }
      
      setError(error.message);
      setLoading(false);
      
      // Keep showing Drive permission modal if needed
      if (error.message.includes('Drive access is required') || 
          error.message.includes('Drive permissions') ||
          error.message.includes('Unable to access Google Drive')) {
        setShowDrivePermissionModal(true);
      }
    }
  };

  const clearError = () => {
    setError(null);
    setShowDrivePermissionModal(false);
  };

  console.log('AuthProvider: Rendering with user:', user, 'loading:', loading, 'error:', error);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      signIn, 
      signOut, 
      reauthorize,
      clearError 
    }}>
      {children}
      
      {/* Drive Permission Modal */}
      <DrivePermissionModal
        isOpen={showDrivePermissionModal}
        onRetry={reauthorize}
        onCancel={clearError}
        error={error || ''}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to check Drive permissions status
export function useDrivePermissions() {
  const { user } = useAuth();
  
  return {
    hasPermission: user?.drivePermissionGranted ?? false,
    grantedScopes: user?.grantedScopes ?? [],
    accessToken: user?.accessToken ?? null
  };
}

// Component to show Drive permission status
export function DrivePermissionStatus({ className = '' }: { className?: string }) {
  const { hasPermission, grantedScopes } = useDrivePermissions();
  
  if (!hasPermission) {
    return (
      <div className={`bg-red-900/20 border border-red-800 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-red-200 text-sm">Google Drive access not granted</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-green-900/20 border border-green-800 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-green-200 text-sm">Google Drive access granted</span>
      </div>
      {grantedScopes.length > 0 && (
        <div className="mt-2 text-xs text-green-300">
          Scopes: {grantedScopes.join(', ')}
        </div>
      )}
    </div>
  );
}