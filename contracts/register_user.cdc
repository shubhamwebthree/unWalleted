// register_user.cdc - Transaction to register a new user
import TaskReward from 0xTASKREWARD

transaction(userId: String, userAddress: Address) {
    prepare(signer: AuthAccount) {
        // This can be called by admin or the user themselves
    }
    
    execute {
        TaskReward.registerUser(userId: userId, walletAddress: userAddress)
        log("User registered successfully")
    }
}