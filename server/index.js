const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require('../unwalleted-6d5f5-firebase-adminsdk-fbsvc-26a3a6e54d.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize Flow Client Library (with error handling)
let fcl;
try {
  fcl = require('@onflow/fcl');
  fcl.config()
    .put('accessNode.api', process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
    .put('discovery.wallet', process.env.FLOW_WALLET || 'https://fcl-discovery.onflow.org/testnet/authn');
} catch (error) {
  console.warn('Flow Client Library not available, blockchain features will be disabled');
  fcl = null;
}

// In-memory storage (replace with database in production)
const users = new Map();
const tasks = new Map();
const taskCompletions = new Map();

// Daily tasks configuration
const DAILY_TASKS = [
  {
    id: 'tweet',
    title: 'Tweet on X',
    description: 'Share a tweet about your day or interests',
    reward: 10,
    type: 'social',
    platform: 'twitter'
  },
  {
    id: 'linkedin',
    title: 'Write a Blog or Thread on LinkedIn',
    description: 'Create engaging content on LinkedIn',
    reward: 15,
    type: 'content',
    platform: 'linkedin'
  },
  {
    id: 'youtube',
    title: 'Upload a Short on YouTube',
    description: 'Create and upload a YouTube Short',
    reward: 20,
    type: 'video',
    platform: 'youtube'
  },
  {
    id: 'telegram',
    title: 'Talk in Telegram Group Chat',
    description: 'Engage in a Telegram group conversation',
    reward: 8,
    type: 'social',
    platform: 'telegram'
  },
  {
    id: 'whatsapp',
    title: 'Talk in WhatsApp Group Chat',
    description: 'Participate in a WhatsApp group discussion',
    reward: 8,
    type: 'social',
    platform: 'whatsapp'
  }
];

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/auth/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Create or get user
    let user = users.get(decodedToken.uid);
    if (!user) {
      user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email,
        flowAccount: null,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      users.set(decodedToken.uid, user);
    } else {
      user.lastLogin = new Date();
    }

    // Generate JWT for session management
    const sessionToken = jwt.sign(
      { uid: user.uid, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      user,
      sessionToken,
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/tasks/daily', authenticateToken, (req, res) => {
  try {
    const today = new Date().toDateString();
    const userCompletions = taskCompletions.get(req.user.uid) || {};
    const todayCompletions = userCompletions[today] || {};

    const tasksWithStatus = DAILY_TASKS.map(task => ({
      ...task,
      completed: !!todayCompletions[task.id],
      completedAt: todayCompletions[task.id]?.completedAt || null
    }));

    res.json({
      tasks: tasksWithStatus,
      date: today
    });
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/tasks/complete', authenticateToken, async (req, res) => {
  try {
    const { taskId, proof } = req.body;
    
    if (!taskId || !proof) {
      return res.status(400).json({ error: 'Task ID and proof required' });
    }

    const task = DAILY_TASKS.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const today = new Date().toDateString();
    const userCompletions = taskCompletions.get(req.user.uid) || {};
    const todayCompletions = userCompletions[today] || {};

    // Check if already completed today
    if (todayCompletions[taskId]) {
      return res.status(400).json({ error: 'Task already completed today' });
    }

    // Record completion
    todayCompletions[taskId] = {
      completedAt: new Date(),
      proof,
      reward: task.reward
    };
    userCompletions[today] = todayCompletions;
    taskCompletions.set(req.user.uid, userCompletions);

    // Get or create user
    let user = users.get(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // TODO: Implement Flow transaction for token reward
    // For now, just return success
    res.json({
      success: true,
      taskId,
      reward: task.reward,
      message: `Task completed! You earned ${task.reward} TASK tokens.`
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

app.get('/user/balance', authenticateToken, async (req, res) => {
  try {
    const user = users.get(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // TODO: Implement Flow balance checking
    // For now, return mock balance
    res.json({
      balance: 0, // This will be fetched from Flow
      currency: 'TASK'
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

app.get('/tasks/history', authenticateToken, (req, res) => {
  try {
    const userCompletions = taskCompletions.get(req.user.uid) || {};
    const history = Object.entries(userCompletions).map(([date, completions]) => ({
      date,
      completions: Object.values(completions),
      totalReward: Object.values(completions).reduce((sum, comp) => sum + comp.reward, 0)
    }));

    res.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`unWalleted server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 