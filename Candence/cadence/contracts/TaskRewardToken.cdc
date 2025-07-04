// TaskReward.cdc - Main smart contract for task completion and rewards

pub contract TaskReward {
    
    // Events
    pub event TaskCompleted(userId: String, taskId: String, rewardAmount: UFix64, timestamp: UFix64)
    pub event RewardTokenMinted(recipient: Address, amount: UFix64)
    pub event NFTRewardMinted(recipient: Address, tokenId: UInt64, metadata: {String: String})
    
    // Paths
    pub let AdminStoragePath: StoragePath
    pub let RewardTokenStoragePath: StoragePath
    pub let RewardTokenPublicPath: PublicPath
    pub let NFTCollectionStoragePath: StoragePath
    pub let NFTCollectionPublicPath: PublicPath
    
    // Total supply tracking
    pub var totalSupply: UFix64
    pub var totalNFTSupply: UInt64
    
    // Task definitions
    pub struct TaskDefinition {
        pub let id: String
        pub let title: String
        pub let description: String
        pub let rewardAmount: UFix64
        pub let rewardType: String // "TOKEN" or "NFT"
        pub let isActive: Bool
        pub let metadata: {String: String}
        
        init(
            id: String,
            title: String,
            description: String,
            rewardAmount: UFix64,
            rewardType: String,
            metadata: {String: String}
        ) {
            self.id = id
            self.title = title
            self.description = description
            self.rewardAmount = rewardAmount
            self.rewardType = rewardType
            self.isActive = true
            self.metadata = metadata
        }
    }
    
    // User completion record
    pub struct UserTaskCompletion {
        pub let userId: String
        pub let taskId: String
        pub let completedAt: UFix64
        pub let rewardAmount: UFix64
        pub let transactionId: String?
        
        init(userId: String, taskId: String, rewardAmount: UFix64, transactionId: String?) {
            self.userId = userId
            self.taskId = taskId
            self.completedAt = getCurrentBlock().timestamp
            self.rewardAmount = rewardAmount
            self.transactionId = transactionId
        }
    }
    
    // User stats for leaderboard
    pub struct UserStats {
        pub let userId: String
        pub let walletAddress: Address?
        pub var totalTokensEarned: UFix64
        pub var tasksCompleted: UInt64
        pub var nftsEarned: UInt64
        pub let joinedAt: UFix64
        pub var lastActivity: UFix64
        
        init(userId: String, walletAddress: Address?) {
            self.userId = userId
            self.walletAddress = walletAddress
            self.totalTokensEarned = 0.0
            self.tasksCompleted = 0
            self.nftsEarned = 0
            self.joinedAt = getCurrentBlock().timestamp
            self.lastActivity = getCurrentBlock().timestamp
        }
        
        pub fun updateStats(tokenReward: UFix64, nftReward: UInt64) {
            self.totalTokensEarned = self.totalTokensEarned + tokenReward
            self.tasksCompleted = self.tasksCompleted + 1
            self.nftsEarned = self.nftsEarned + nftReward
            self.lastActivity = getCurrentBlock().timestamp
        }
    }
    
    // Storage
    access(self) var tasks: {String: TaskDefinition}
    access(self) var userCompletions: {String: [UserTaskCompletion]} // userId -> completions
    access(self) var userStats: {String: UserStats}
    access(self) var userWallets: {String: Address} // email -> wallet address mapping
    
    // Reward Token Resource
    pub resource RewardToken {
        pub let balance: UFix64
        
        init(balance: UFix64) {
            self.balance = balance
        }
    }
    
    // NFT Resource
    pub resource NFT {
        pub let id: UInt64
        pub let metadata: {String: String}
        
        init(id: UInt64, metadata: {String: String}) {
            self.id = id
            self.metadata = metadata
        }
    }
    
    // NFT Collection Resource
    pub resource Collection {
        pub var ownedNFTs: @{UInt64: NFT}
        
        init() {
            self.ownedNFTs <- {}
        }
        
        pub fun deposit(token: @NFT) {
            let id = token.id
            self.ownedNFTs[id] <-! token
        }
        
        pub fun withdraw(withdrawID: UInt64): @NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("NFT not found")
            return <-token
        }
        
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        destroy() {
            destroy self.ownedNFTs
        }
    }
    
    // Admin Resource
    pub resource Admin {
        pub fun createTask(
            id: String,
            title: String,
            description: String,
            rewardAmount: UFix64,
            rewardType: String,
            metadata: {String: String}
        ) {
            let task = TaskDefinition(
                id: id,
                title: title,
                description: description,
                rewardAmount: rewardAmount,
                rewardType: rewardType,
                metadata: metadata
            )
            TaskReward.tasks[id] = task
        }
        
        pub fun deactivateTask(taskId: String) {
            if let task = TaskReward.tasks[taskId] {
                let updatedTask = TaskDefinition(
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    rewardAmount: task.rewardAmount,
                    rewardType: task.rewardType,
                    metadata: task.metadata
                )
                TaskReward.tasks[taskId] = updatedTask
            }
        }
        
        pub fun mintRewardTokens(recipient: Address, amount: UFix64) {
            let token <- create RewardToken(balance: amount)
            
            // Get recipient's account
            let recipientAccount = getAccount(recipient)
            let receiverRef = recipientAccount.getCapability(TaskReward.RewardTokenPublicPath)
                .borrow<&{RewardTokenReceiver}>()
                ?? panic("Could not get receiver reference")
            
            receiverRef.deposit(from: <-token)
            TaskReward.totalSupply = TaskReward.totalSupply + amount
            
            emit RewardTokenMinted(recipient: recipient, amount: amount)
        }
        
        pub fun mintNFT(recipient: Address, metadata: {String: String}): UInt64 {
            let tokenId = TaskReward.totalNFTSupply + 1
            TaskReward.totalNFTSupply = tokenId
            
            let nft <- create NFT(id: tokenId, metadata: metadata)
            
            let recipientAccount = getAccount(recipient)
            let collectionRef = recipientAccount.getCapability(TaskReward.NFTCollectionPublicPath)
                .borrow<&{NFTReceiver}>()
                ?? panic("Could not get collection reference")
            
            collectionRef.deposit(token: <-nft)
            
            emit NFTRewardMinted(recipient: recipient, tokenId: tokenId, metadata: metadata)
            return tokenId
        }
    }
    
    // Public interfaces
    pub resource interface RewardTokenReceiver {
        pub fun deposit(from: @RewardToken)
        pub fun getBalance(): UFix64
    }
    
    pub resource interface NFTReceiver {
        pub fun deposit(token: @NFT)
        pub fun getIDs(): [UInt64]
    }
    
    // Vault for holding reward tokens
    pub resource Vault: RewardTokenReceiver {
        pub var balance: UFix64
        
        init(balance: UFix64) {
            self.balance = balance
        }
        
        pub fun deposit(from: @RewardToken) {
            self.balance = self.balance + from.balance
            destroy from
        }
        
        pub fun withdraw(amount: UFix64): @RewardToken {
            pre {
                self.balance >= amount: "Insufficient balance"
            }
            self.balance = self.balance - amount
            return <-create RewardToken(balance: amount)
        }
        
        pub fun getBalance(): UFix64 {
            return self.balance
        }
        
        destroy() {
            if self.balance > 0.0 {
                TaskReward.totalSupply = TaskReward.totalSupply - self.balance
            }
        }
    }
    
    // Public functions
    pub fun createEmptyVault(): @Vault {
        return <-create Vault(balance: 0.0)
    }
    
    pub fun createEmptyCollection(): @Collection {
        return <-create Collection()
    }
    
    pub fun registerUser(userId: String, walletAddress: Address) {
        if self.userStats[userId] == nil {
            self.userStats[userId] = UserStats(userId: userId, walletAddress: walletAddress)
            self.userWallets[userId] = walletAddress
        }
    }
    
    pub fun completeTask(userId: String, taskId: String, walletAddress: Address): Bool {
        // Verify task exists and is active
        guard let task = self.tasks[taskId] else {
            return false
        }
        
        if !task.isActive {
            return false
        }
        
        // Check if user already completed this task
        if let completions = self.userCompletions[userId] {
            for completion in completions {
                if completion.taskId == taskId {
                    return false // Task already completed
                }
            }
        }
        
        // Record completion
        let completion = UserTaskCompletion(
            userId: userId,
            taskId: taskId,
            rewardAmount: task.rewardAmount,
            transactionId: nil
        )
        
        if self.userCompletions[userId] == nil {
            self.userCompletions[userId] = []
        }
        self.userCompletions[userId]!.append(completion)
        
        // Update user stats
        if self.userStats[userId] == nil {
            self.registerUser(userId: userId, walletAddress: walletAddress)
        }
        
        let nftReward: UInt64 = task.rewardType == "NFT" ? 1 : 0
        self.userStats[userId]!.updateStats(tokenReward: task.rewardAmount, nftReward: nftReward)
        
        emit TaskCompleted(
            userId: userId,
            taskId: taskId,
            rewardAmount: task.rewardAmount,
            timestamp: getCurrentBlock().timestamp
        )
        
        return true
    }
    
    pub fun getTasks(): {String: TaskDefinition} {
        return self.tasks
    }
    
    pub fun getActiveTask(taskId: String): TaskDefinition? {
        if let task = self.tasks[taskId] {
            return task.isActive ? task : nil
        }
        return nil
    }
    
    pub fun getUserCompletions(userId: String): [UserTaskCompletion] {
        return self.userCompletions[userId] ?? []
    }
    
    pub fun getUserStats(userId: String): UserStats? {
        return self.userStats[userId]
    }
    
    pub fun getLeaderboard(): [UserStats] {
        let stats: [UserStats] = []
        for userId in self.userStats.keys {
            if let userStat = self.userStats[userId] {
                stats.append(userStat)
            }
        }
        return stats
    }
    
    pub fun getUserWallet(userId: String): Address? {
        return self.userWallets[userId]
    }
    
    pub fun getTotalSupply(): UFix64 {
        return self.totalSupply
    }
    
    init() {
        // Initialize paths
        self.AdminStoragePath = /storage/TaskRewardAdmin
        self.RewardTokenStoragePath = /storage/TaskRewardVault
        self.RewardTokenPublicPath = /public/TaskRewardReceiver
        self.NFTCollectionStoragePath = /storage/TaskRewardCollection
        self.NFTCollectionPublicPath = /public/TaskRewardCollection
        
        // Initialize storage
        self.tasks = {}
        self.userCompletions = {}
        self.userStats = {}
        self.userWallets = {}
        self.totalSupply = 0.0
        self.totalNFTSupply = 0
        
        // Create admin resource
        let admin <- create Admin()
        self.account.save(<-admin, to: self.AdminStoragePath)
        
        // Create and link empty vault
        let vault <- self.createEmptyVault()
        self.account.save(<-vault, to: self.RewardTokenStoragePath)
        self.account.link<&{RewardTokenReceiver}>(
            self.RewardTokenPublicPath,
            target: self.RewardTokenStoragePath
        )
        
        // Create and link empty collection
        let collection <- self.createEmptyCollection()
        self.account.save(<-collection, to: self.NFTCollectionStoragePath)
        self.account.link<&{NFTReceiver}>(
            self.NFTCollectionPublicPath,
            target: self.NFTCollectionStoragePath
        )
    }
}