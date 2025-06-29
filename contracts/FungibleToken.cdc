// Remove the import since it's not being used and causing import errors
// import NonFungibleToken from "./NonFungibleToken.cdc"

/// FungibleToken defines a contract interface for tokens that are fungible (interchangeable).
/// Fungible tokens have a field for total supply and can be transferred between accounts.
///
/// The term "tokens" is used loosely, and can be interpreted as currency, loyalty points,
/// shares in a company, or any other fungible asset.
///
access(all) contract interface FungibleToken {
    
    /// Total number of tokens in existence
    /// This should be implemented as a field in the implementing contract
    access(all) view fun getTotalSupply(): UFix64
    
    /// Event that is emitted when tokens are withdrawn from a Vault
    access(all) event Withdraw(amount: UFix64, from: Address?)
    
    /// Event that is emitted when tokens are deposited to a Vault
    access(all) event Deposit(amount: UFix64, to: Address?)
    
    /// The interface that contains the withdraw method for withdrawing tokens
    access(all) resource interface Provider {
        /// Subtracts tokens from the owner's Vault
        /// and returns a Vault with the removed tokens.
        ///
        /// The function's access level is access(all)
        /// since entitlements are not supported in this context
        ///
        access(all) fun withdraw(amount: UFix64): @{FungibleToken.Vault}
    }
    
    /// The interface that contains the deposit method for depositing tokens
    access(all) resource interface Receiver {
        /// Takes a Vault and deposits it into the implementing resource type
        ///
        access(all) fun deposit(from: @{FungibleToken.Vault})
        
        /// Below getter will return the accepted types by the implementing
        /// resource type to inform callers what types of tokens they accept
        access(all) view fun getSupportedVaultTypes(): {Type: Bool}
        
        access(all) view fun isSupportedVaultType(type: Type): Bool
    }
    
    /// The interface that contains the balance field for getting balance information
    access(all) resource interface Balance {
        /// The total balance of the account's tokens
        access(all) var balance: UFix64
    }
    
    /// The Vault resource interface that contains the methods for depositing, withdrawing,
    /// and getting balance information
    access(all) resource interface Vault: Provider, Receiver, Balance {
        /// The total balance of the account's tokens
        access(all) var balance: UFix64
        
        /// Initialize the vault with an initial balance
        init(balance: UFix64)
        
        /// Function that subtracts amount from the Vault's balance
        /// and returns a new Vault with the subtracted balance
        /// This is just the function signature - implementation will be in concrete contracts
        ///
        access(all) fun withdraw(amount: UFix64): @{FungibleToken.Vault}
        
        /// Function that takes a Vault object as an argument and adds
        /// its balance to the balance of the owners Vault
        /// This is just the function signature - implementation will be in concrete contracts
        ///
        access(all) fun deposit(from: @{FungibleToken.Vault})
    }
    
    /// Allows any user to create a new Vault that has a zero balance
    ///
    access(all) fun createEmptyVault(vaultType: Type): @{FungibleToken.Vault} {
        post {
            result.balance == 0.0: "The newly created Vault must have zero balance"
        }
    }
}