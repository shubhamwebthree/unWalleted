/// TaskRewardToken is a fungible token that represents rewards earned
/// by completing daily tasks in the unWalleted system
///
access(all) contract TaskRewardToken {
    /// The total supply of TASK tokens
    access(all) var totalSupply: UFix64
    
    /// Events
    access(all) event TokensInitialized(initialSupply: UFix64)
    access(all) event TokensWithdrawn(amount: UFix64, from: Address?)
    access(all) event TokensDeposited(amount: UFix64, to: Address?)
    access(all) event TokensMinted(amount: UFix64)
    
    /// Storage and Public Paths
    access(all) let VaultStoragePath: StoragePath
    access(all) let VaultPublicPath: PublicPath
    access(all) let AdminStoragePath: StoragePath
    
    /// The Provider interface defines the requirements for withdrawing tokens
    access(all) resource interface Provider {
        access(all) fun withdraw(amount: UFix64): @Vault
        access(all) fun getBalance(): UFix64
    }
    
    /// The Receiver interface defines the requirements for depositing tokens
    access(all) resource interface Receiver {
        access(all) fun deposit(from: @Vault)
        access(all) fun getBalance(): UFix64
    }
    
    /// The Balance interface defines the requirements for reading the balance
    access(all) resource interface Balance {
        access(all) fun getBalance(): UFix64
    }
    
    /// Get the total supply of tokens
    access(all) view fun getTotalSupply(): UFix64 {
        return self.totalSupply
    }
    
    /// The admin resource that can mint new tokens
    access(all) resource Admin {
        /// Mint new tokens and deposit them into the given vault
        access(all) fun mintTokens(amount: UFix64, recipient: &{Receiver}) {
            TaskRewardToken.totalSupply = TaskRewardToken.totalSupply + amount
            
            let vault <- create Vault(balance: amount)
            recipient.deposit(from: <-vault)
            
            emit TokensMinted(amount: amount)
        }
    }
    
    /// The Vault resource represents a location where tokens are stored
    access(all) resource Vault: Provider, Receiver, Balance {
        /// The current balance of tokens in this vault
        access(all) var balance: UFix64
        
        /// Initialize the vault with an initial balance
        init(balance: UFix64) {
            self.balance = balance
        }
        
        /// Withdraw tokens from this vault
        access(all) fun withdraw(amount: UFix64): @Vault {
            pre {
                amount > 0.0: "Amount must be positive"
                amount <= self.balance: "Insufficient balance"
            }
            post {
                result.balance == amount: "Withdrawal amount must equal vault balance"
            }
            
            self.balance = self.balance - amount
            
            emit TokensWithdrawn(amount: amount, from: self.owner?.address)
            
            return <-create Vault(balance: amount)
        }
        
        /// Deposit tokens into this vault
        access(all) fun deposit(from: @Vault) {
            pre {
                from.balance > 0.0: "Deposit amount must be positive"
            }
            post {
                self.balance == before(self.balance) + before(from.balance): 
                    "Balance must equal previous balance plus deposited amount"
            }
            
            let depositAmount = from.balance
            self.balance = self.balance + from.balance
            
            emit TokensDeposited(amount: depositAmount, to: self.owner?.address)
            
            destroy from
        }
        
        /// Get the current balance of tokens in this vault
        access(all) fun getBalance(): UFix64 {
            return self.balance
        }
    }
    
    /// Create a new vault with zero balance
    access(all) fun createEmptyVault(): @Vault {
        return <-create Vault(balance: 0.0)
    }
    
    /// Transfer tokens between vaults
    access(all) fun transfer(from: &{Provider}, to: &{Receiver}, amount: UFix64) {
        let vault <- from.withdraw(amount: amount)
        to.deposit(from: <-vault)
    }
    
    /// Get the balance of tokens in a vault
    access(all) fun getBalance(vault: &{Balance}): UFix64 {
        return vault.getBalance()
    }
    
    /// Initialize the contract
    init() {
        self.totalSupply = 0.0
        
        // Set storage paths
        self.VaultStoragePath = /storage/taskRewardTokenVault
        self.VaultPublicPath = /public/taskRewardTokenVault
        self.AdminStoragePath = /storage/taskRewardTokenAdmin
        
        // Create the admin resource and save it to storage
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
        
        emit TokensInitialized(initialSupply: self.totalSupply)
    }
}
