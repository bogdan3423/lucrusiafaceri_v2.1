'use client';

/**
 * Authentication Context and Provider
 * Manages Firebase Auth state across the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '@/lib/firebase';
import { User } from '@/types';
import { timestampToDate } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          uid: data.uid || uid,
          email: data.email || '',
          fullName: data.fullName || '',
          phone: data.phone || '',
          city: data.city || '',
          profileImage: data.profileImage || '',
          coverImage: data.coverImage || '',
          bio: data.bio || '',
          role: data.role || 'user',
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt),
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const userData = await fetchUserData(fbUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setError(null);
      setLoading(true);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, COLLECTIONS.USERS, fbUser.uid), {
        uid: fbUser.uid,
        email: email,
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        city: userData.city || '',
        profileImage: userData.profileImage || '',
        bio: '',
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Refresh user data from Firestore
  const refreshUser = async () => {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser.uid);
      setUser(userData);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Helper to get readable error messages
function getAuthErrorMessage(error: unknown): string {
  const err = error as { code?: string };
  switch (err.code) {
    case 'auth/email-already-in-use':
      return 'Acest email este deja înregistrat.';
    case 'auth/invalid-email':
      return 'Adresa de email nu este validă.';
    case 'auth/operation-not-allowed':
      return 'Operațiunea nu este permisă.';
    case 'auth/weak-password':
      return 'Parola este prea slabă. Folosește minim 6 caractere.';
    case 'auth/user-disabled':
      return 'Acest cont a fost dezactivat.';
    case 'auth/user-not-found':
      return 'Nu există un cont cu acest email.';
    case 'auth/wrong-password':
      return 'Parola este incorectă.';
    case 'auth/invalid-credential':
      return 'Email sau parolă incorectă.';
    case 'auth/too-many-requests':
      return 'Prea multe încercări. Încearcă din nou mai târziu.';
    default:
      return 'A apărut o eroare. Încearcă din nou.';
  }
}
