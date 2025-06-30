import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink } from 'lucide-react';

const WalletModal = ({ isOpen, onClose, user }) => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    currency: 'TASK',
    hasAccount: false,
    address: null
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchWalletData();
    }
  }, [isOpen, user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const response = await fetch('/api/tasks/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (walletData.address) {
      navigator.clipboard.writeText(walletData.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openFlowScan = () => {
    if (walletData.address) {
      window.open(`https://testnet.flowscan.org/account/${walletData.address}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Your Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading wallet...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Balance Display */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Total Balance</p>
              <p className="text-2xl font-bold">
                {walletData.balance.toFixed(2)} {walletData.currency}
              </p>
            </div>

            {/* Account Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  walletData.hasAccount 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {walletData.hasAccount ? 'Active' : 'Pending Setup'}
                </span>
              </div>
            </div>

            {/* Flow Address */}
            {walletData.address && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Flow Address</p>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                    {walletData.address}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Copy address"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={openFlowScan}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="View on FlowScan"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 mt-1">Address copied!</p>
                )}
              </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Recent Activity</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Task Reward</span>
                  <span className="text-green-600">+10 TASK</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Task Reward</span>
                  <span className="text-green-600">+15 TASK</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={fetchWalletData}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;