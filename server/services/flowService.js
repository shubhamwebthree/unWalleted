const { fcl } = require('@onflow/fcl');
const { send, getAccount } = require('@onflow/fcl');
const { script, transaction, proposer, authorizer, payer } = require('@onflow/fcl');

class FlowService {
  constructor() {
    this.adminAddress = process.env.FLOW_ADMIN_ADDRESS;
    this.adminPrivateKey = process.env.FLOW_ADMIN_PRIVATE_KEY;
    this.contractAddress = process.env.FLOW_CONTRACT_ADDRESS;
    
    // Configure FCL for admin operations
    fcl.config()
      .put('accessNode.api', process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
      .put('discovery.wallet', process.env.FLOW_WALLET || 'https://fcl-discovery.onflow.org/testnet/authn');
  }

  /**
   * Create a Flow account for a user (custodial)
   */
  async createUserAccount(userId) {
    try {
      // This would typically involve creating a new Flow account
      // For now, we'll use a simple mapping
      const accountAddress = `0x${userId.slice(0, 16)}`; // Simplified for demo
      
      return {
        address: accountAddress,
        success: true
      };
    } catch (error) {
      console.error('Error creating user account:', error);
      throw new Error('Failed to create Flow account');
    }
  }

  /**
   * Mint tokens to a user's account
   */
  async mintTokens(recipientAddress, amount) {
    try {
      const transactionCode = `
        import TaskRewardToken from ${this.contractAddress}
        
        transaction(recipient: Address, amount: UFix64) {
          let admin: &TaskRewardToken.Admin
          let recipientVault: &{TaskRewardToken.Receiver}
          
          prepare(signer: AuthAccount) {
            self.admin = signer.borrow<&TaskRewardToken.Admin>(from: /storage/TaskRewardTokenAdmin)
              ?? panic("Admin not found")
            self.recipientVault = getAccount(recipient).getCapability<&{TaskRewardToken.Receiver}>(/public/TaskRewardTokenReceiver)
              ?? panic("Recipient vault not found")
          }
          
          execute {
            self.admin.mintTokens(amount: amount, recipient: self.recipientVault)
          }
        }
      `;

      const result = await send([
        transaction(transactionCode),
        proposer(fcl.authz),
        authorizer(fcl.authz),
        payer(fcl.authz),
        fcl.args([
          fcl.arg(recipientAddress, fcl.t.Address),
          fcl.arg(amount.toString(), fcl.t.UFix64)
        ])
      ]);

      return {
        transactionId: result.transactionId,
        success: true
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw new Error('Failed to mint tokens');
    }
  }

  /**
   * Get token balance for a user
   */
  async getBalance(userAddress) {
    try {
      const scriptCode = `
        import TaskRewardToken from ${this.contractAddress}
        
        pub fun main(address: Address): UFix64 {
          let vault = getAccount(address).getCapability<&TaskRewardToken.Vault{TaskRewardToken.Balance}>(/public/TaskRewardTokenBalance)
            ?? panic("Vault not found")
          return vault.balance()
        }
      `;

      const result = await fcl.query({
        cadence: scriptCode,
        args: (arg, t) => [arg(userAddress, t.Address)]
      });

      return parseFloat(result);
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Transfer tokens between accounts
   */
  async transferTokens(fromAddress, toAddress, amount) {
    try {
      const transactionCode = `
        import TaskRewardToken from ${this.contractAddress}
        
        transaction(to: Address, amount: UFix64) {
          let senderVault: &TaskRewardToken.Vault{TaskRewardToken.Provider}
          let receiverVault: &{TaskRewardToken.Receiver}
          
          prepare(signer: AuthAccount) {
            self.senderVault = signer.borrow<&TaskRewardToken.Vault{TaskRewardToken.Provider}>(from: /storage/TaskRewardTokenVault)
              ?? panic("Sender vault not found")
            self.receiverVault = getAccount(to).getCapability<&{TaskRewardToken.Receiver}>(/public/TaskRewardTokenReceiver)
              ?? panic("Receiver vault not found")
          }
          
          execute {
            let vault <- self.senderVault.withdraw(amount: amount)
            self.receiverVault.deposit(from: <-vault)
          }
        }
      `;

      const result = await send([
        transaction(transactionCode),
        proposer(fcl.authz),
        authorizer(fcl.authz),
        payer(fcl.authz),
        fcl.args([
          fcl.arg(toAddress, fcl.t.Address),
          fcl.arg(amount.toString(), fcl.t.UFix64)
        ])
      ]);

      return {
        transactionId: result.transactionId,
        success: true
      };
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw new Error('Failed to transfer tokens');
    }
  }

  /**
   * Setup user vault (called when user first completes a task)
   */
  async setupUserVault(userAddress) {
    try {
      const transactionCode = `
        import TaskRewardToken from ${this.contractAddress}
        
        transaction() {
          prepare(signer: AuthAccount) {
            // Create vault if it doesn't exist
            if signer.borrow<&TaskRewardToken.Vault>(from: /storage/TaskRewardTokenVault) == nil {
              let vault <- TaskRewardToken.createEmptyVault()
              signer.save(<-vault, to: /storage/TaskRewardTokenVault)
              
              // Create receiver capability
              let receiver = signer.link<&{TaskRewardToken.Receiver}>(
                /public/TaskRewardTokenReceiver,
                target: /storage/TaskRewardTokenVault
              )
              
              // Create balance capability
              let balance = signer.link<&TaskRewardToken.Vault{TaskRewardToken.Balance}>(
                /public/TaskRewardTokenBalance,
                target: /storage/TaskRewardTokenVault
              )
            }
          }
        }
      `;

      const result = await send([
        transaction(transactionCode),
        proposer(fcl.authz),
        authorizer(fcl.authz),
        payer(fcl.authz)
      ]);

      return {
        transactionId: result.transactionId,
        success: true
      };
    } catch (error) {
      console.error('Error setting up user vault:', error);
      throw new Error('Failed to setup user vault');
    }
  }

  /**
   * Reward user for completing a task
   */
  async rewardUser(userId, taskId, rewardAmount) {
    try {
      // Get or create user's Flow account
      let userAccount = await this.getUserAccount(userId);
      if (!userAccount) {
        userAccount = await this.createUserAccount(userId);
      }

      // Setup vault if needed
      await this.setupUserVault(userAccount.address);

      // Mint tokens to user
      const mintResult = await this.mintTokens(userAccount.address, rewardAmount);

      return {
        success: true,
        transactionId: mintResult.transactionId,
        rewardAmount,
        userAddress: userAccount.address
      };
    } catch (error) {
      console.error('Error rewarding user:', error);
      throw new Error('Failed to reward user');
    }
  }

  /**
   * Get user's Flow account (simplified for demo)
   */
  async getUserAccount(userId) {
    // In a real implementation, this would query a database
    // For now, return a mock account
    return {
      address: `0x${userId.slice(0, 16)}`,
      userId
    };
  }
}

module.exports = new FlowService(); 