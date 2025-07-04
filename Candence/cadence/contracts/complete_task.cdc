// // complete_task.cdc - Transaction to complete a task and receive rewards

// import TaskReward from TaskReward

// transaction(userId: String, taskId: String) {
//     let userAddress: Address
//     let adminRef: &TaskReward.Admin
    
//     prepare(signer: AuthAccount) {
//         self.userAddress = signer.address
        
//         // Get admin reference (this should be called by the backend service account)
//         self.adminRef = signer.borrow<&TaskReward.Admin>(from: TaskReward.AdminStoragePath)
//             ?? panic("Could not borrow admin reference")
//     }
    
//     execute {
//         // Complete the task (this records the completion)
//         let success = TaskReward.completeTask(
//             userId: userId, 
//             taskId: taskId, 
//             walletAddress: self.userAddress
//         )
        
//         if !success {
//             panic("Task completion failed - task may not exist, be inactive, or already completed")
//         }
        
//         // Get task details to determine reward type
//         let task = TaskReward.getActiveTask(taskId: taskId)
//             ?? panic("Task not found or inactive")
        
//         // Mint and distribute rewards based on task type
//         if task.rewardType == "TOKEN" && task.rewardAmount > 0.0 {
//             self.adminRef.mintRewardTokens(
//                 recipient: self.userAddress,
//                 amount: task.rewardAmount
//             )
//         } else if task.rewardType == "NFT" {
//             let metadata: {String: String} = {
//                 "taskId": taskId,
//                 "completedBy": userId,
//                 "completedAt": getCurrentBlock().timestamp.toString(),
//                 "name": task.title,
//                 "description": task.description
//             }
            
//             // Add any custom metadata from the task
//             for key in task.metadata.keys {
//                 metadata[key] = task.metadata[key]!
//             }
            
//             self.adminRef.mintNFT(
//                 recipient: self.userAddress,
//                 metadata: metadata
//             )
//         }
        
//         log("Task completed successfully and rewards distributed")
//     }
// }