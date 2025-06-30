const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const accountService = require('../services/accountService');
const flowService = require('../services/flowService');

const db = admin.firestore();

// Complete task endpoint
router.post('/complete', async (req, res) => {
  try {
    const { taskId, proof } = req.body;
    const userId = req.user.uid;
    
    if (!taskId || !proof) {
      return res.status(400).json({ error: 'Task ID and proof required' });
    }

    // Find task definition
    const DAILY_TASKS = [
      { id: 'tweet', title: 'Tweet on X', reward: 10 },
      { id: 'linkedin', title: 'Write on LinkedIn', reward: 15 },
      { id: 'youtube', title: 'Upload YouTube Short', reward: 20 },
      { id: 'telegram', title: 'Chat on Telegram', reward: 8 },
      { id: 'whatsapp', title: 'Chat on WhatsApp', reward: 8 }
    ];

    const task = DAILY_TASKS.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if already completed today
    const existingCompletion = await db
      .collection('taskCompletions')
      .where('userId', '==', userId)
      .where('taskId', '==', taskId)
      .where('date', '==', today)
      .get();

    if (!existingCompletion.empty) {
      return res.status(400).json({ error: 'Task already completed today' });
    }

    // Get or create Flow account
    const flowAccount = await accountService.getOrCreateFlowAccount(userId);
    
    // Mint reward tokens
    const mintResult = await flowService.mintTokens(flowAccount.address, task.reward);

    // Save task completion
    const completionData = {
      userId,
      taskId,
      date: today,
      proof: {
        type: 'url', // or 'screenshot', 'description'
        data: proof,
        verified: false
      },
      reward: {
        tokens: task.reward,
        transactionId: mintResult.transactionId
      },
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('taskCompletions').add(completionData);

    // Update user stats
    const userDoc = await db.collection('users').doc(userId).get();
    const currentStats = userDoc.data()?.stats || {};
    
    await db.collection('users').doc(userId).update({
      'stats.totalRewards': admin.firestore.FieldValue.increment(task.reward),
      'stats.tasksCompleted': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      taskId,
      reward: task.reward,
      transactionId: mintResult.transactionId,
      flowAddress: flowAccount.address,
      message: `Task completed! You earned ${task.reward} TASK tokens.`
    });

  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ 
      error: 'Failed to complete task',
      details: error.message 
    });
  }
});

// Get user balance
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.uid;
    const flowAccount = await accountService.getFlowAccount(userId);
    
    if (!flowAccount) {
      return res.json({ balance: 0, currency: 'TASK', hasAccount: false });
    }

    const balance = await flowService.getBalance(flowAccount.address);
    
    res.json({
      balance,
      currency: 'TASK',
      hasAccount: true,
      address: flowAccount.address
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

module.exports = router;