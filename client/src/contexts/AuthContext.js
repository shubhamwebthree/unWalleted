import React, { createContext, useContext, useEffect, useState } from 'react';
// import { initializeApp } from 'firebase/app';
// import { 
//   getAuth, 
//   signInWithPopup, 
//   GoogleAuthProvider, 
//   onAuthStateChanged,
//   signOut as firebaseSignOut
// } from 'firebase/auth';
import axios from 'axios';
import toast from 'react-hot-toast';

// Firebase configuration - COMMENTED OUT FOR TESTING
// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
//   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
//   projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
//   storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
//   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
//   appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
// };

// Initialize Firebase - COMMENTED OUT FOR TESTING
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const provider = new GoogleAuthProvider();

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
  // Mock user for testing - REMOVE THIS WHEN ENABLING AUTH
  const [user, setUser] = useState({
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null
  });
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState('mock-session-token');

  // Configure axios defaults
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Mock sign in - REMOVE THIS WHEN ENABLING AUTH
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      toast.success('Mock sign in successful!');
      
      // Set axios default header for authenticated requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
      
      return { user: user, sessionToken: sessionToken };
    } catch (error) {
      console.error('Mock sign in error:', error);
      toast.error('Failed to sign in. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mock sign out - REMOVE THIS WHEN ENABLING AUTH
  const signOut = async () => {
    try {
      setUser(null);
      setSessionToken(null);
      delete axios.defaults.headers.common['Authorization'];
      toast.success('Mock sign out successful!');
    } catch (error) {
      console.error('Mock sign out error:', error);
      toast.error('Failed to sign out.');
    }
  };

  // Mock auth state listener - REMOVE THIS WHEN ENABLING AUTH
  useEffect(() => {
    // Simulate loading
    setLoading(true);
    
    // Set up mock authentication
    setTimeout(() => {
      setLoading(false);
      // Set axios default header for authenticated requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
    }, 1000);
  }, []);

  // Original Firebase auth code - COMMENTED OUT FOR TESTING
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  //     if (firebaseUser) {
  //       setUser(firebaseUser);
        
  //       // Get fresh token and authenticate with backend
  //       try {
  //         const idToken = await firebaseUser.getIdToken();
  //         const response = await axios.post('/auth/firebase', { idToken });
          
  //         if (response.data.sessionToken) {
  //           setSessionToken(response.data.sessionToken);
  //           axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.sessionToken}`;
  //         }
  //       } catch (error) {
  //         console.error('Backend authentication error:', error);
  //       }
  //     } else {
  //       setUser(null);
  //       setSessionToken(null);
  //       delete axios.defaults.headers.common['Authorization'];
  //     }
  //     setLoading(false);
  //   });

  //   return unsubscribe;
  // }, []);

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