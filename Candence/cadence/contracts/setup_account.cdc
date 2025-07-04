// setup_account.cdc - Transaction to setup user account for rewards

import TaskReward from 0xTASKREWARD

transaction {
    prepare(signer: AuthAccount) {
        // Setup reward token vault if it doesn't exist
        if signer.borrow<&TaskReward.Vault>(from: TaskReward.RewardTokenStoragePath) == nil {
            let vault <- TaskReward.createEmptyVault()
            signer.save(<-vault, to: TaskReward.RewardTokenStoragePath)
            
            signer.link<&{TaskReward.RewardTokenReceiver}>(
                TaskReward.RewardTokenPublicPath,
                target: TaskReward.RewardTokenStoragePath
            )
        }
        
        // Setup NFT collection if it doesn't exist
        if signer.borrow<&TaskReward.Collection>(from: TaskReward.NFTCollectionStoragePath) == nil {
            let collection <- TaskReward.createEmptyCollection()
            signer.save(<-collection, to: TaskReward.NFTCollectionStoragePath)
            
            signer.link<&{TaskReward.NFTReceiver}>(
                TaskReward.NFTCollectionPublicPath,
                target: TaskReward.NFTCollectionStoragePath
            )
        }
    }
    
    execute {
        log("Account setup completed successfully")
    }
}