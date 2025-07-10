import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, onAuthChange, signInWithGoogle, signOutUser, checkRedirectResult } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    
    // Check for redirect result first
    checkRedirectResult().then((redirectUser) => {
      if (redirectUser) {
        console.log('AuthProvider: Redirect result found:', redirectUser);
        setUser(redirectUser);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('AuthProvider: Error checking redirect result:', error);
    });
    
    const unsubscribe = onAuthChange((user) => {
      console.log('AuthProvider: Auth state changed:', user);
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      console.log('AuthProvider: Starting sign in');
      const result = await signInWithGoogle();
      console.log('AuthProvider: Sign in successful:', result);
    } catch (error: any) {
      console.error('AuthProvider: Sign in error:', error);
      // Don't throw error for redirect in progress
      if (error.message === 'REDIRECT_IN_PROGRESS') {
        console.log('AuthProvider: Redirect in progress, not throwing error');
        return;
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  console.log('AuthProvider: Rendering with user:', user, 'loading:', loading);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
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