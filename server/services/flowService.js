const fcl = require('@onflow/fcl');
const t = require('@onflow/types');
const { ec: EC } = require('elliptic');
const { SHA3 } = require('sha3');
const crypto = require('crypto');

class FlowService {
  constructor() {
    this.adminAddress = process.env.FLOW_ADMIN_ADDRESS;
    this.adminPrivateKey = process.env.FLOW_ADMIN_PRIVATE_KEY;
    this.contractAddress = process.env.FLOW_CONTRACT_ADDRESS;
    this.isTestnet = process.env.FLOW_NETWORK === 'testnet';
    
    // Configure FCL
    fcl.config()
      .put('accessNode.api', this.isTestnet ? 
        'https://rest-testnet.onflow.org' : 
        'https://rest-mainnet.onflow.org')
      .put('discovery.wallet', this.isTestnet ?
        'https://fcl-discovery.onflow.org/testnet/authn' :
        'https://fcl-discovery.onflow.org/authn')
      .put('0xFungibleToken', this.isTestnet ? '0x9a0766d93b6608b7' : '0xf233dcee88fe0abe')
      .put('0xTaskRewardToken', this.contractAddress);
  }

  /**
   * Generate a new Flow keypair
   */
  generateKeyPair() {
    const ec = new EC('p256');
    const keyPair = ec.genKeyPair();
    
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic('hex').replace(/^04/, '');
    
    return { privateKey, publicKey };
  }

  /**
   * Create authorization function for transactions
   */
  createAuthz(privateKey, address, keyIndex = 0) {
    return (account) => {
      return {
        ...account,
        tempId: `${address}-${keyIndex}`,
        addr: fcl.sansPrefix(address),
        keyId: keyIndex,
        signingFunction: (signable) => {
          const ec = new EC('p256');
          const key = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'));
          const sig = key.sign(Buffer.from(signable.message, 'hex'));
          const n = 32;
          const r = sig.r.toArrayLike(Buffer, 'be', n);
          const s = sig.s.toArrayLike(Buffer, 'be', n);
          return {
            addr: fcl.sansPrefix(address),
            keyId: keyIndex,
            signature: Buffer.concat([r, s]).toString('hex')
          };
        }
      };
    };
  }

  /**
   * Create a Flow account (custodial)
   */
  async createAccount(userId) {
    try {
      // Generate new keypair
      const { privateKey, publicKey } = this.generateKeyPair();
      
      // Create account transaction
      const createAccountTx = `
        transaction(publicKey: String) {
          prepare(signer: AuthAccount) {
            let account = AuthAccount(payer: signer)
            account.keys.add(
              publicKey: PublicKey(
                publicKey: publicKey.decodeHex(),
                signatureAlgorithm: SignatureAlgorithm.ECDSA_P256
              ),
              hashAlgorithm: HashAlgorithm.SHA3_256,
              weight: 1000.0
            )
          }
        }
      `;

      const adminAuthz = this.createAuthz(this.adminPrivateKey, this.adminAddress);

      const txId = await fcl.mutate({
        cadence: createAccountTx,
        args: (arg, t) => [
          arg(publicKey, t.String)
        ],
        proposer: adminAuthz,
        authorizations: [adminAuthz],
        payer: adminAuthz,
        limit: 1000
      });

      // Get transaction result to extract new account address
      const txResult = await fcl.tx(txId).onceSealed();
      
      // Extract account address from events
      const accountCreatedEvent = txResult.events.find(e => 
        e.type === 'flow.AccountCreated'
      );
      
      const newAccountAddress = accountCreatedEvent?.data?.address;

      if (!newAccountAddress) {
        throw new Error('Failed to extract account address from transaction');
      }

      return {
        address: newAccountAddress,
        publicKey,
        privateKey, // Will be encrypted before storing
        transactionId: txId,
        success: true
      };
    } catch (error) {
      console.error('Error creating Flow account:', error);
      throw new Error(`Failed to create Flow account: ${error.message}`);
    }
  }

  /**
   * Setup user vault for TaskRewardToken
   */
  async setupUserVault(userAddress, userPrivateKey) {
    try {
      const setupVaultTx = `
        import FungibleToken from 0xFungibleToken
        import TaskRewardToken from 0xTaskRewardToken

        transaction() {
          prepare(signer: AuthAccount) {
            // Return early if the account already has a Vault
            if signer.borrow<&TaskRewardToken.Vault>(from: TaskRewardToken.VaultStoragePath) != nil {
              return
            }

            // Create a new vault and put it in storage
            let vault <- TaskRewardToken.createEmptyVault()
            signer.save(<-vault, to: TaskRewardToken.VaultStoragePath)

            // Create a public capability for the vault
            signer.link<&{FungibleToken.Receiver}>(
              TaskRewardToken.VaultPublicPath,
              target: TaskRewardToken.VaultStoragePath
            )

            // Create a public capability for the vault balance
            signer.link<&{FungibleToken.Balance}>(
              /public/taskRewardTokenBalance,
              target: TaskRewardToken.VaultStoragePath
            )
          }
        }
      `;

      const userAuthz = this.createAuthz(userPrivateKey, userAddress);

      const txId = await fcl.mutate({
        cadence: setupVaultTx,
        proposer: userAuthz,
        authorizations: [userAuthz],
        payer: userAuthz,
        limit: 1000
      });

      await fcl.tx(txId).onceSealed();

      return {
        transactionId: txId,
        success: true
      };
    } catch (error) {
      console.error('Error setting up user vault:', error);
      throw new Error(`Failed to setup user vault: ${error.message}`);
    }
  }

  /**
   * Mint tokens to user account
   */
  async mintTokens(recipientAddress, amount) {
    try {
      const mintTokensTx = `
        import FungibleToken from 0xFungibleToken
        import TaskRewardToken from 0xTaskRewardToken

        transaction(recipient: Address, amount: UFix64) {
          let tokenAdmin: &TaskRewardToken.Admin
          let tokenReceiver: &{FungibleToken.Receiver}

          prepare(signer: AuthAccount) {
            self.tokenAdmin = signer
              .borrow<&TaskRewardToken.Admin>(from: TaskRewardToken.AdminStoragePath)
              ?? panic("Signer is not the token admin")

            self.tokenReceiver = getAccount(recipient)
              .getCapability(TaskRewardToken.VaultPublicPath)
              .borrow<&{FungibleToken.Receiver}>()
              ?? panic("Unable to borrow receiver reference")
          }

          execute {
            let minterVault <- self.tokenAdmin.createNewMinter(allowedAmount: amount)
            let mintedVault <- minterVault.mintTokens(amount: amount)
            
            self.tokenReceiver.deposit(from: <-mintedVault)
            destroy minterVault
          }
        }
      `;

      const adminAuthz = this.createAuthz(this.adminPrivateKey, this.adminAddress);

      const txId = await fcl.mutate({
        cadence: mintTokensTx,
        args: (arg, t) => [
          arg(recipientAddress, t.Address),
          arg(amount.toFixed(8), t.UFix64)
        ],
        proposer: adminAuthz,
        authorizations: [adminAuthz],
        payer: adminAuthz,
        limit: 1000
      });

      await fcl.tx(txId).onceSealed();

      return {
        transactionId: txId,
        amount,
        success: true
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  /**
   * Get user's token balance
   */
  async getBalance(userAddress) {
    try {
      const balanceScript = `
        import FungibleToken from 0xFungibleToken
        import TaskRewardToken from 0xTaskRewardToken

        pub fun main(address: Address): UFix64 {
          let account = getAccount(address)
          let vaultRef = account
            .getCapability(/public/taskRewardTokenBalance)
            .borrow<&{FungibleToken.Balance}>()
            ?? panic("Could not borrow Balance reference")

          return vaultRef.balance
        }
      `;

      const balance = await fcl.query({
        cadence: balanceScript,
        args: (arg, t) => [arg(userAddress, t.Address)]
      });

      return parseFloat(balance) || 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(address) {
    try {
      const account = await fcl.account(address);
      return {
        address: account.address,
        balance: account.balance,
        keys: account.keys,
        exists: true
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      return { exists: false };
    }
  }
}

module.exports = new FlowService();