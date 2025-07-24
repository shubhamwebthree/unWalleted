// This transaction is a template for a transaction to allow
// anyone to add a Vault resource to their account so that
// they can use the exampleToken

import "FungibleToken"
import "TaskToken"
import "ViewResolver"
import "FungibleTokenMetadataViews"

transaction () {

    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue) &Account) {

        let vaultData = TaskToken.resolveContractView(resourceType: nil, viewType: Type<FungibleTokenMetadataViews.FTVaultData>()) as! FungibleTokenMetadataViews.FTVaultData?
            ?? panic("Could not resolve FTVaultData view. The TaskToken"
                .concat(" contract needs to implement the FTVaultData Metadata view in order to execute this transaction."))

        // Return early if the account already stores a TaskToken Vault
        if signer.storage.borrow<&TaskToken.Vault>(from: vaultData.storagePath) != nil {
            return
        }

        let vault <- TaskToken.createEmptyVault(vaultType: Type<@TaskToken.Vault>())

        // Create a new TaskToken Vault and put it in storage
        signer.storage.save(<-vault, to: vaultData.storagePath)

        // Create a public capability to the Vault that exposes the Vault interfaces
        let vaultCap = signer.capabilities.storage.issue<&TaskToken.Vault>(
            vaultData.storagePath
        )
        signer.capabilities.publish(vaultCap, at: vaultData.metadataPath)

        // Create a public Capability to the Vault's Receiver functionality
        let receiverCap = signer.capabilities.storage.issue<&TaskToken.Vault>(
            vaultData.storagePath
        )
        signer.capabilities.publish(receiverCap, at: vaultData.receiverPath)
    }
}