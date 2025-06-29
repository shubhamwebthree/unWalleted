import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import axios from 'axios';
import toast from 'react-hot-toast';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(null);

  // Configure axios defaults
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      
      // Backend authentication
      try {
        const idToken = await result.user.getIdToken();
        const response = await axios.post('/auth/firebase', { idToken });
        
        if (response.data.sessionToken) {
          setSessionToken(response.data.sessionToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.sessionToken}`;
        }
      } catch (backendError) {
        console.error('Backend authentication error:', backendError);
        // Continue with frontend-only auth for now
        toast.success('Signed in successfully!');
      }
      
      return { user: result.user, sessionToken: sessionToken };
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setSessionToken(null);
      delete axios.defaults.headers.common['Authorization'];
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out.');
      throw error;
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Get fresh token and authenticate with backend (optional for now)
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await axios.post('/auth/firebase', { idToken });
          
          if (response.data.sessionToken) {
            setSessionToken(response.data.sessionToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.sessionToken}`;
          }
        } catch (error) {
          console.error('Backend authentication error:', error);
          // Continue without backend auth for development
        }
      } else {
        setUser(null);
        setSessionToken(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Value object for context
  const value = {
    user,
    sessionToken,
    loading,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};