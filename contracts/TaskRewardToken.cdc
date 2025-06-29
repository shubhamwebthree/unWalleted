/// TaskRewardToken is a fungible token that represents rewards earned
/// by completing daily tasks in the unWalleted system
///
access(all) contract TaskRewardToken {
    /// The total supply of TASK tokens
    access(all) var totalSupply: UFix64

    /// The admin resource that can mint new tokens
    access(all) resource Admin {
        /// Mint new tokens and deposit them into the given vault
        access(all) fun mintTokens(amount: UFix64, recipient: &{Receiver}) {
            TaskRewardToken.totalSupply = TaskRewardToken.totalSupply + amount
            
            let vault <- create Vault(balance: amount)
            recipient.deposit(from: <-vault)
        }
    }

    /// The Vault resource represents a location where tokens are stored
    access(all) resource Vault {
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
            
            self.balance = self.balance - amount
            
            let vault <- create Vault(balance: amount)
            return <-vault
        }

        /// Deposit tokens into this vault
        access(all) fun deposit(from: @Vault) {
            self.balance = self.balance + from.balance
            destroy from
        }

        /// Get the current balance of tokens in this vault
        access(all) fun balance(): UFix64 {
            return self.balance
        }
    }

    /// Receiver interface for depositing tokens
    access(all) resource interface Receiver {
        access(all) fun deposit(from: @Vault)
    }

    /// Initialize the contract
    init() {
        self.totalSupply = 0.0
    }

    /// Create a new vault with zero balance
    access(all) fun createEmptyVault(): @Vault {
        return <-create Vault(balance: 0.0)
    }

    /// Get the total supply of tokens
    access(all) fun totalSupply(): UFix64 {
        return self.totalSupply
    }

    /// Transfer tokens between vaults
    pub fun transfer(from: &{FungibleToken.Provider}, to: &{FungibleToken.Receiver}, amount: UFix64) {
        let vault <- from.withdraw(amount: amount)
        to.deposit(from: <-vault)
    }

    /// Get the balance of tokens in a vault
    pub fun balance(of: &{FungibleToken.Provider}): UFix64 {
        return of.balance()
    }
} 