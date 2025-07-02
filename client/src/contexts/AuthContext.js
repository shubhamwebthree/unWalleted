import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import magic from '../utils/magic'; // Your magic.js file

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
  const [flowAddress, setFlowAddress] = useState(null);

  // Configure axios defaults
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Sign in with Magic Link (email)
  const signInWithEmail = async (email) => {
    try {
      setLoading(true);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Magic Link authentication
      const didToken = await magic.auth.loginWithMagicLink({ 
        email,
        showUI: true // This will show Magic's built-in UI
      });
      
      if (didToken) {
        // Get user info from Magic
        const userInfo = await magic.user.getInfo();
        const flowAddress = await magic.flow.getAccount();
        
        // Store user info
        setUser({
          email: userInfo.email,
          issuer: userInfo.issuer,
          publicAddress: userInfo.publicAddress
        });
        setFlowAddress(flowAddress);

        // Backend authentication with Magic DID token
        try {
          const response = await axios.post('/auth/magic', { 
            didToken,
            email: userInfo.email,
            flowAddress: flowAddress
          });
          
          if (response.data.sessionToken) {
            setSessionToken(response.data.sessionToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.sessionToken}`;
          }
          
          toast.success(`Welcome! ${userInfo.email}`);
          
        } catch (backendError) {
          console.error('Backend authentication error:', backendError);
          // Continue with frontend-only auth for development
          toast.success(`Signed in as ${userInfo.email}`);
        }
        
        return { user: userInfo, flowAddress, sessionToken };
      }
    } catch (error) {
      console.error('Magic Link sign in error:', error);
      
      // Handle specific Magic errors
      if (error.code === 'MAGIC_LINK_FAILED_VERIFICATION') {
        toast.error('Magic link verification failed. Please try again.');
      } else if (error.code === 'MAGIC_LINK_EXPIRED') {
        toast.error('Magic link has expired. Please request a new one.');
      } else if (error.code === 'USER_ALREADY_LOGGED_IN') {
        toast.error('You are already logged in.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Alternative sign in method using Magic's OAuth providers (if needed later)
  const signInWithSocial = async (provider = 'google') => {
    try {
      setLoading(true);
      
      const didToken = await magic.oauth.loginWithRedirect({
        provider: provider, // 'google', 'facebook', 'apple', etc.
        redirectURI: `${window.location.origin}/auth/callback`
      });
      
      if (didToken) {
        const userInfo = await magic.user.getInfo();
        const flowAddress = await magic.flow.getAccount();
        
        setUser({
          email: userInfo.email,
          issuer: userInfo.issuer,
          publicAddress: userInfo.publicAddress
        });
        setFlowAddress(flowAddress);

        // Backend authentication
        try {
          const response = await axios.post('/auth/magic', { 
            didToken,
            email: userInfo.email,
            flowAddress: flowAddress,
            provider: provider
          });
          
          if (response.data.sessionToken) {
            setSessionToken(response.data.sessionToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.sessionToken}`;
          }
        } catch (backendError) {
          console.error('Backend authentication error:', backendError);
        }
        
        toast.success(`Welcome! ${userInfo.email}`);
        return { user: userInfo, flowAddress, sessionToken };
      }
    } catch (error) {
      console.error('Social sign in error:', error);
      toast.error('Failed to sign in with social provider.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is currently logged in
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const isLoggedIn = await magic.user.isLoggedIn();
      
      if (isLoggedIn) {
        const userInfo = await magic.user.getInfo();
        const flowAddress = await magic.flow.getAccount();
        
        setUser({
          email: userInfo.email,
          issuer: userInfo.issuer,
          publicAddress: userInfo.publicAddress
        });
        setFlowAddress(flowAddress);

        // Get fresh DID token for backend
        try {
          const didToken = await magic.user.getIdToken();
          const response = await axios.post('/auth/magic', { 
            didToken,
            email: userInfo.email,
            flowAddress: flowAddress
          });
          
          if (response.data.sessionToken) {
            setSessionToken(response.data.sessionToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.sessionToken}`;
          }
        } catch (error) {
          console.error('Backend session restore error:', error);
        }
      }
    } catch (error) {
      console.error('Auth status check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      await magic.user.logout();
      
      setUser(null);
      setSessionToken(null);
      setFlowAddress(null);
      delete axios.defaults.headers.common['Authorization'];
      
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get Flow account balance
  const getFlowBalance = async () => {
    try {
      if (!flowAddress) return 0;
      
      // This would call your Flow service to get balance
      const response = await axios.get('/api/tasks/balance');
      return response.data.balance || 0;
    } catch (error) {
      console.error('Error getting Flow balance:', error);
      return 0;
    }
  };

  // Execute Flow transaction
  const executeFlowTransaction = async (transactionCode, args = []) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const txHash = await magic.flow.sendTransaction({
        transaction: transactionCode,
        args: args
      });

      return txHash;
    } catch (error) {
      console.error('Flow transaction error:', error);
      throw error;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle OAuth callback (if using social login)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (window.location.pathname === '/auth/callback') {
        try {
          const result = await magic.oauth.getRedirectResult();
          if (result) {
            // OAuth login successful, redirect to dashboard
            window.history.replaceState({}, document.title, '/dashboard');
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast.error('OAuth authentication failed');
          window.history.replaceState({}, document.title, '/');
        }
      }
    };

    handleOAuthCallback();
  }, []);

  // Value object for context
  const value = {
    user,
    sessionToken,
    flowAddress,
    loading,
    signInWithEmail,
    signInWithSocial,
    signOut,
    checkAuthStatus,
    getFlowBalance,
    executeFlowTransaction,
    // Helper properties
    isAuthenticated: !!user,
    hasFlowAccount: !!flowAddress
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};