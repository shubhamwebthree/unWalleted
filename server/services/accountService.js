const admin = require('firebase-admin');
const crypto = require('crypto');
const flowService = require('./flowService');

class AccountService {
  constructor() {
    this.db = admin.firestore();
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key';
  }

  /**
   * Encrypt private key before storing
   */
  encryptPrivateKey(privateKey) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt private key for use
   */
  decryptPrivateKey(encryptedPrivateKey) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Create Flow account for user
   */
  async createFlowAccount(userId) {
    try {
      // Check if user already has a Flow account
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (userDoc.exists && userDoc.data().flowAccount?.address) {
        throw new Error('User already has a Flow account');
      }

      // Create new Flow account
      const accountData = await flowService.createAccount(userId);
      
      // Encrypt private key
      const encryptedPrivateKey = this.encryptPrivateKey(accountData.privateKey);

      // Setup user vault
      await flowService.setupUserVault(accountData.address, accountData.privateKey);

      // Store account info in Firestore
      const flowAccountData = {
        address: accountData.address,
        publicKey: accountData.publicKey,
        encryptedPrivateKey,
        isSetup: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        setupTransactionId: accountData.transactionId
      };

      await this.db.collection('users').doc(userId).set({
        flowAccount: flowAccountData,
        stats: {
          totalRewards: 0,
          tasksCompleted: 0,
          currentStreak: 0,
          longestStreak: 0
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return {
        address: accountData.address,
        publicKey: accountData.publicKey,
        success: true
      };
    } catch (error) {
      console.error('Error creating Flow account:', error);
      throw new Error(`Failed to create Flow account: ${error.message}`);
    }
  }

  /**
   * Get or create Flow account for user
   */
  async getOrCreateFlowAccount(userId) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (userDoc.exists && userDoc.data().flowAccount?.address) {
        return userDoc.data().flowAccount;
      }

      // Create new account if doesn't exist
      return await this.createFlowAccount(userId);
    } catch (error) {
      console.error('Error getting/creating Flow account:', error);
      throw error;
    }
  }

  /**
   * Get user's Flow account details
   */
  async getFlowAccount(userId) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      return userData.flowAccount || null;
    } catch (error) {
      console.error('Error getting Flow account:', error);
      return null;
    }
  }

  /**
   * Get decrypted private key for transactions
   */
  async getPrivateKey(userId) {
    try {
      const flowAccount = await this.getFlowAccount(userId);
      if (!flowAccount?.encryptedPrivateKey) {
        throw new Error('No private key found for user');
      }

      return this.decryptPrivateKey(flowAccount.encryptedPrivateKey);
    } catch (error) {
      console.error('Error getting private key:', error);
      throw error;
    }
  }

  /**
   * Update user stats
   */
  async updateUserStats(userId, updates) {
    try {
      await this.db.collection('users').doc(userId).update({
        [`stats.${Object.keys(updates).join('`], [`stats.')}`]: Object.values(updates),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }
}

module.exports = new AccountService();