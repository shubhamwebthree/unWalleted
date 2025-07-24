import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Sparkles, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    try {
      await signIn(email);
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

        {/* Sign In Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            ) : (
              <LogIn className="h-5 w-5 mr-3" />
            )}
            {loading ? 'Sending magic link...' : 'Sign in with Magic Link'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>No password required • Powered by Flow blockchain</p>
          <p className="mt-1">Sponsored transactions for seamless experience</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 