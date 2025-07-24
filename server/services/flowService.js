const fcl = require('@onflow/fcl');
const { send, getAccount } = require('@onflow/fcl');
const { script, transaction, proposer, authorizer, payer, authorizations } = require('@onflow/fcl');
const t = require("@onflow/types");
const elliptic = require("elliptic");
const EC = new elliptic.ec("p256");

class FlowService {
  constructor() {
    this.adminAddress = process.env.FLOW_ADMIN_ADDRESS;
    this.adminPrivateKey = process.env.FLOW_ADMIN_PRIVATE_KEY;
    this.contractAddress = process.env.TASK_TOKEN_ADDRESS;
    
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
      // Generate a new key pair for the user
      const keyPair = EC.genKeyPair();
      const publicKey = keyPair.getPublic("hex").replace(/^04/, ""); // Remove '04' prefix
      const publicKeyHex = Buffer.from(publicKey, "hex").toString("hex");

      // Import admin authorization helper
      const adminAuthorization = require("../utils/flowAdminAuthorization");

      // Account creation transaction
      const response = await fcl.send([
        fcl.transaction`
          transaction(publicKey: String) {
            prepare(signer: AuthAccount) {
              let account = AuthAccount(payer: signer)
              account.addPublicKey(publicKey.decodeHex())
            }
          }
        `,
        fcl.args([fcl.arg(publicKeyHex, t.String)]),
        fcl.payer(adminAuthorization),
        fcl.proposer(adminAuthorization),
        fcl.authorizations([adminAuthorization]),
        fcl.limit(100)
      ]);

      const { events } = await fcl.tx(response).onceSealed();
      const accountCreatedEvent = events.find(d => d.type === "flow.AccountCreated");
      const address = accountCreatedEvent.data.address;

      // For demonstration, store the private key in a file (not for production!)
      const fs = require('fs');
      fs.writeFileSync(
        `user-keypair-${address}.json`,
        JSON.stringify({
          address,
          privateKey: keyPair.getPrivate("hex"),
          publicKey: publicKeyHex
        }, null, 2)
      );

      return {
        address,
        privateKey: keyPair.getPrivate("hex"),
        publicKey: publicKeyHex,
        success: true
      };
    } catch (error) {
      console.error("Error creating Flow account:", error);
      throw new Error("Failed to create Flow account");
    }
  }

  /**
   * Mint tokens to a user's account
   */
  async mintTokens(recipientAddress, amount) {
    try {
      const transactionCode = `
        import TaskToken from ${this.contractAddress}
        
        transaction(recipient: Address, amount: UFix64) {
          let admin: &TaskToken.Admin
          let recipientVault: &{TaskToken.Receiver}
          
          prepare(signer: AuthAccount) {
            self.admin = signer.borrow<&TaskToken.Admin>(from: /storage/TaskTokenAdmin)
              ?? panic("Admin not found")
            self.recipientVault = getAccount(recipient).getCapability<&{TaskToken.Receiver}>(/public/TaskTokenReceiver)
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
   * Convert DID address to Flow address
   */
  convertDIDToFlowAddress(didAddress) {
    if (typeof didAddress === 'string' && didAddress.startsWith('did:ethr:')) {
      return didAddress.replace('did:ethr:', '');
    }
    return didAddress;
  }

  /**
   * Get token balance for a user
   */
  async getBalance(userAddress) {
    try {
      // Convert DID to Flow address if needed
      const flowAddress = this.convertDIDToFlowAddress(userAddress);
      const scriptCode = `
         import TaskToken from ${this.contractAddress}

  access(all) fun main(address: Address): UFix64 {
      let account = getAccount(address)
      let vaultRef = account.capabilities
          .get<&TaskToken.Vault>(/public/TaskTokenVault)
          .borrow()
          ?? panic("Could not borrow balance reference to the Vault")
      return vaultRef.balance
  }
`;

      const result = await fcl.query({
        cadence: scriptCode,
        args: (arg, t) => [arg(flowAddress, t.Address)]
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
        import TaskToken from ${this.contractAddress}
        
        transaction(to: Address, amount: UFix64) {
          let senderVault: &TaskToken.Vault{TaskToken.Provider}
          let receiverVault: &{TaskToken.Receiver}
          
          prepare(signer: AuthAccount) {
            self.senderVault = signer.borrow<&TaskToken.Vault{TaskToken.Provider}>(from: /storage/TaskTokenVault)
              ?? panic("Sender vault not found")
            self.receiverVault = getAccount(to).getCapability<&{TaskToken.Receiver}>(/public/TaskTokenReceiver)
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
        import TaskToken from ${this.contractAddress}
        
        transaction(userAddress: Address) {
          prepare(signer: AuthAccount) {
            let user = getAccount(userAddress)
            let userAcct = user.address
            let acct = getAccount(userAcct)
            // Create vault if it doesn't exist
            if acct.getCapability<&TaskToken.Vault>(/public/TaskTokenBalance).borrow() == nil {
              let vault <- TaskToken.createEmptyVault()
              signer.save(<-vault, to: /storage/TaskTokenVault)
              // Create receiver capability
              signer.link<&{TaskToken.Receiver}>(
                /public/TaskTokenReceiver,
                target: /storage/TaskTokenVault
              )
              // Create balance capability
              signer.link<&TaskToken.Vault{TaskToken.Balance}>(
                /public/TaskTokenBalance,
                target: /storage/TaskTokenVault
              )
            }
          }
        }
      `;

      const adminAuthorization = require("../utils/flowAdminAuthorization");

      const result = await send([
        transaction(transactionCode),
        proposer(adminAuthorization),
        authorizations([adminAuthorization]),
        payer(adminAuthorization),
        fcl.args([fcl.arg(userAddress, t.Address)]),
        fcl.limit(100)
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