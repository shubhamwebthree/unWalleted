import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import './BalanceDisplay.css';

const BalanceDisplay = ({ balance: propBalance }) => {
  const { token } = useContext(AuthContext);
  const [balance, setBalance] = useState(propBalance || '0.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (propBalance !== undefined) {
      setBalance(propBalance);
      setLastUpdated(new Date());
    }
  }, [propBalance]);

  useEffect(() => {
    if (token && !propBalance) {
      fetchBalance();
      
      // Set up periodic balance refresh every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [token, propBalance]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/users/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setBalance(response.data.balance);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0.0';
    
    // Format with 2 decimal places
    return num.toFixed(2);
  };

  const formatLastUpdated = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  const handleRefresh = () => {
    if (!loading) {
      fetchBalance();
    }
  };

  return (
    <div className="balance-display">
      <div className="balance-header">
        <h3>TASK Tokens</h3>
        <button 
          onClick={handleRefresh}
          className={`refresh-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
          title="Refresh balance"
        >
          <svg className="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="balance-amount">
        {loading ? (
          <div className="balance-loading">
            <div className="spinner-small"></div>
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="balance-error">
            <span className="error-text">{error}</span>
          </div>
        ) : (
          <span className="amount">{formatBalance(balance)}</span>
        )}
      </div>
      
      <div className="balance-footer">
        <div className="balance-info">
          <span className="token-symbol">TASK</span>
          {lastUpdated && (
            <span className="last-updated">
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
        
        <div className="balance-actions">
          <button 
            className="action-link"
            onClick={() => window.location.href = '/task-history'}
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay;  