import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, token } = useContext(AuthContext);
  const [balance, setBalance] = useState(null);

  // Function to fetch token balance
  const fetchBalance = async () => {
    try {
      const response = await axios.get('/user/balance', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  // Periodically fetch balance every 15 seconds
  useEffect(() => {
    if (token) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 15000);
      return () => clearInterval(interval); // clean up
    }
  }, [token]);

  return (
    <nav style={styles.nav}>
      <h2>UnWalleted DApp</h2>
      {user && (
        <div style={styles.info}>
          <span>{user.email}</span>
          <span style={styles.balance}>
            {balance !== null ? `Balance: ${balance} TASK` : "Loading..."}
          </span>
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem',
    background: '#111',
    color: '#fff',
    alignItems: 'center'
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  balance: {
    fontWeight: 'bold',
    marginTop: '0.5rem'
  }
};

export default Navbar;
