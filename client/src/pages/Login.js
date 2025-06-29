import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Sparkles } from 'lucide-react';

const Login = () => {
  const { signInWithGoogle, loading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to unWalleted
          </h2>
          <p className="text-gray-600 mb-8">
            Complete daily tasks and earn TASK tokens on Flow blockchain
          </p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What you can do:
          </h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Tweet on X and earn 10 TASK tokens
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Write LinkedIn content for 15 TASK tokens
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              Upload YouTube Shorts for 20 TASK tokens
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Engage in Telegram/WhatsApp for 8 TASK tokens
            </li>
          </ul>
        </div>

        {/* Sign In Button */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            ) : (
              <LogIn className="h-5 w-5 mr-3" />
            )}
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>No wallet required • Powered by Flow blockchain</p>
          <p className="mt-1">Sponsored transactions for seamless experience</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 