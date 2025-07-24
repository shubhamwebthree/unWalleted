const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { Magic } = require('@magic-sdk/admin');
const path = require('path');
const Tesseract = require('tesseract.js');
const flowService = require('./services/flowService');

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Magic Admin SDK
let magic;
try {
  const magicSecretKey = process.env.MAGIC_SECRET_KEY;
  if (magicSecretKey) {
    magic = new Magic(magicSecretKey);
    console.log('Magic Admin SDK initialized successfully');
  } else {
    throw new Error('Missing Magic secret key');
  }
} catch (error) {
  console.warn('Magic Admin SDK initialization failed:', error.message);
  console.warn('Authentication features will be disabled');
  magic = null;
}

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

// Validation utilities for task proof/links
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const platformPatterns = {
  instagram: /instagram\.com\/(stories|p|reel)\//,
  linkedin: /linkedin\.com\/(posts|activity|feed)\//,
  twitter: /(twitter\.com|x\.com)\/(status|i\/status)\//,
  youtube: /youtube\.com\/(watch\?v=|shorts\/)/,
  medium: /medium\.com\//,
  producthunt: /producthunt\.com\/posts\//,
  github: /github\.com\//
};

const PROJECT_KEYWORDS = [
  // Hashtag variations only
  '#unWalleted',
  '#unwallet',
  '#taskrewards',
  '#flowblockchain',
  '#magiclink',
  '#web3',
  '#blockchain',
  '#crypto',
  '#tokens',
  '#dapps',
  '#onflow'
];

// Enhanced image analysis for hashtag and keyword detection
// ✅ NOW USING REAL TESSERACT.JS OCR - Extracts actual text from images
async function analyzeImageForHashtags(imageData) {
  try {
    // Extract text from image using OCR
    const extractedText = await extractTextFromImage(imageData);
    
    if (!extractedText) {
      return {
        hasRelevantHashtags: false,
        isRecent: false,
        confidence: 0.0,
        message: 'No text could be extracted from the image. Please ensure the image contains clear, readable text with relevant hashtags.',
        extractedText: null
      };
    }

    // Analyze for hashtags and keywords
    const analysis = analyzeTextForKeywords(extractedText);
    
    return {
      hasRelevantHashtags: analysis.hasRelevantHashtags,
      isRecent: analysis.isRecent,
      confidence: analysis.confidence,
      message: analysis.message,
      extractedText: extractedText,
      foundKeywords: analysis.foundKeywords,
      foundHashtags: analysis.foundHashtags
    };
  } catch (error) {
    console.error('Image analysis error:', error);
    return {
      hasRelevantHashtags: false,
      isRecent: false,
      confidence: 0.0,
      message: 'Error analyzing image. Please try again or contact support.',
      extractedText: null
    };
  }
}

// Extract text from image using OCR
async function extractTextFromImage(imageData) {
  try {
    console.log('Starting OCR text extraction with Tesseract.js...');
    
    // Remove data:image/... prefix if present
    const base64Data = imageData.includes('data:image/') 
      ? imageData.split(',')[1] 
      : imageData;
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Use Tesseract.js to extract text
    const result = await Tesseract.recognize(
      imageBuffer,
      'eng', // English language
      {
        logger: m => console.log('OCR Progress:', m.status, m.progress)
      }
    );
    
    const extractedText = result.data.text.trim();
    console.log('OCR Extraction completed. Text found:', extractedText.substring(0, 100) + '...');
    
    return extractedText || null;
  } catch (error) {
    console.error('OCR extraction error:', error);
    return null;
  }
}

// Analyze extracted text for relevant keywords and hashtags
function analyzeTextForKeywords(text) {
  console.log('=== KEYWORD ANALYSIS DEBUG ===');
  console.log('Input text:', text);
  
  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  const foundHashtags = [];
  
  // Check for hashtags
  const hashtagRegex = /#[\w]+/g;
  const hashtags = text.match(hashtagRegex) || [];
  console.log('All hashtags found:', hashtags);
  
  // Check for relevant keywords (without #)
  const keywordRegex = /\b(unwalleted|unwallet|taskrewards|flowblockchain|magiclink|web3|blockchain|crypto|tokens|dapps|onflow)\b/gi;
  const keywords = text.match(keywordRegex) || [];
  console.log('All keywords found:', keywords);
  
  // Check for project-specific hashtags
  const relevantHashtags = PROJECT_KEYWORDS.filter(hashtag => 
    lowerText.includes(hashtag.toLowerCase())
  );
  console.log('Relevant hashtags found:', relevantHashtags);
  
  // Check for date/time indicators (for recency)
  const dateTimeRegex = /(today|yesterday|now|just|recent|latest|new)/gi;
  const timeIndicators = text.match(dateTimeRegex) || [];
  console.log('Time indicators found:', timeIndicators);
  
  // Calculate confidence score
  let confidence = 0.0;
  let hasRelevantHashtags = false;
  let isRecent = false;
  
  // Hashtag analysis
  if (relevantHashtags.length > 0) {
    hasRelevantHashtags = true;
    confidence += 0.6; // 60% weight for hashtags
    foundHashtags.push(...relevantHashtags);
  }
  
  // Keyword analysis
  if (keywords.length > 0) {
    confidence += 0.2; // 20% weight for keywords
    foundKeywords.push(...keywords);
  }
  
  // Recency analysis
  if (timeIndicators.length > 0) {
    isRecent = true;
    confidence += 0.2; // 20% weight for recency
  }
  
  console.log('Final results:');
  console.log('- Has relevant hashtags:', hasRelevantHashtags);
  console.log('- Found keywords:', foundKeywords);
  console.log('- Is recent:', isRecent);
  console.log('- Confidence:', confidence);
  console.log('=============================');
  
  // Generate appropriate message
  let message = '';
  if (hasRelevantHashtags && isRecent) {
    message = '✅ Great! Found relevant hashtags and recent content. Task verification successful!';
  } else if (hasRelevantHashtags) {
    message = '⚠️ Found relevant hashtags but content may not be recent. Please ensure this is from today.';
  } else if (isRecent) {
    message = '⚠️ Content appears recent but missing relevant hashtags. Please include hashtags like #unWalleted.';
  } else {
    message = '❌ No relevant hashtags or recent content found. Please include hashtags like #unWalleted and ensure content is from today.';
  }
  
  return {
    hasRelevantHashtags,
    isRecent,
    confidence: Math.min(confidence, 1.0),
    message,
    foundKeywords,
    foundHashtags,
    allHashtags: hashtags,
    timeIndicators
  };
}

async function validateTaskProof(task, proof) {
  // Accept any string as proof, no validation
  return {
    valid: true,
    message: 'Proof accepted!'
  };
}

// Daily tasks configuration
const DAILY_TASKS = [
  // Social Media Engagement Tasks
  {
    id: 'instagram-story-mention',
    title: 'Share a Story on Instagram with a Mention',
    description: 'Share an Instagram story mentioning the project or community. Upload a screenshot showing your story with relevant hashtags like #unWalleted.',
    reward: 10,
    type: 'social',
    platform: 'instagram'
  },
  {
    id: 'linkedin-comment',
    title: 'Comment on a LinkedIn Post',
    description: 'Engage with a LinkedIn post by leaving a thoughtful comment. Upload a screenshot showing your comment with relevant hashtags like #unWalleted.',
    reward: 10,
    type: 'social',
    platform: 'linkedin'
  },
  {
    id: 'linkedin-share-caption',
    title: 'Share a LinkedIn Post with a Caption',
    description: 'Share a LinkedIn post with your own caption and thoughts. Upload a screenshot showing your post with relevant hashtags like #unWalleted.',
    reward: 20,
    type: 'social',
    platform: 'linkedin'
  },
  {
    id: 'x-quote-retweet',
    title: 'Quote Retweet on X with a Comment',
    description: 'Quote retweet a post on X with your own commentary. Upload a screenshot showing your post with hashtags like #unWalleted.',
    reward: 15,
    type: 'social',
    platform: 'twitter'
  },
  {
    id: 'instagram-story-screenshot',
    title: 'Share a Tweet Screenshot on Instagram Story',
    description: 'Take a screenshot of a tweet and share it on your Instagram story. Upload a screenshot showing your Instagram story with the tweet and hashtags like #unWalleted.',
    reward: 10,
    type: 'social',
    platform: 'instagram'
  },
  {
    id: 'youtube-react-x',
    title: 'React to a YouTube video and share thoughts on X',
    description: 'Watch a YouTube video and share your thoughts about it on X. Upload a screenshot showing your X post with hashtags like #unWalleted.',
    reward: 15,
    type: 'social',
    platform: 'youtube'
  },

  // Content Creation Tasks
  {
    id: 'medium-blog',
    title: 'Write a Medium Blog Post',
    description: 'Create and publish a blog post on Medium. Upload a screenshot showing your blog post with relevant hashtags like #unWalleted.',
    reward: 60,
    type: 'content',
    platform: 'medium'
  },
  {
    id: 'meme-creation',
    title: 'Create a Meme and Post on X or Instagram',
    description: 'Create an original meme and share it on X or Instagram. Upload a screenshot showing your meme post with hashtags like #unWalleted.',
    reward: 25,
    type: 'content',
    platform: 'social'
  },
  {
    id: 'carousel-post',
    title: 'Create a Carousel Post for Instagram or LinkedIn',
    description: 'Design and post a carousel with multiple slides on Instagram or LinkedIn. Upload a screenshot showing your carousel post with hashtags like #unWalleted.',
    reward: 40,
    type: 'content',
    platform: 'social'
  },
  {
    id: 'twitter-thread-voice',
    title: 'Record a Twitter Thread with Voice or Video',
    description: 'Create a Twitter thread with voice or video content. Upload a screenshot showing your thread with hashtags like #unWalleted.',
    reward: 35,
    type: 'content',
    platform: 'twitter'
  },
  {
    id: 'educational-video',
    title: 'Create a 1-Minute Educational Video',
    description: 'Record a short educational video about a topic you know well. Upload a screenshot showing your video post with hashtags like #unWalleted.',
    reward: 50,
    type: 'content',
    platform: 'video'
  },
  {
    id: 'infographic-design',
    title: 'Design an Infographic and Share on Socials',
    description: 'Create an infographic and share it across your social media platforms. Upload a screenshot showing your infographic post with hashtags like #unWalleted.',
    reward: 40,
    type: 'content',
    platform: 'social'
  },

  // Community/Collaboration Tasks
  {
    id: 'onboard-user',
    title: 'Onboard a New User (Proof of Invite)',
    description: 'Successfully invite and onboard a new user to the community. Upload a screenshot showing proof of invitation or onboarding process.',
    reward: 30,
    type: 'community',
    platform: 'community'
  },
  {
    id: 'host-community-call',
    title: 'Host a Community Call (Twitter Space, Telegram, or Zoom)',
    description: 'Organize and host a community call or discussion. Upload a screenshot showing your call announcement or recording with relevant hashtags.',
    reward: 50,
    type: 'community',
    platform: 'community'
  },
  {
    id: 'event-recap',
    title: 'Share Event Recap on Socials (Text + Media)',
    description: 'Create and share a recap of an event with text and media. Upload a screenshot showing your event recap post with hashtags like #unWalleted.',
    reward: 40,
    type: 'community',
    platform: 'social'
  },
  {
    id: 'twitter-space-question',
    title: 'Ask a Question During a Twitter Space',
    description: 'Participate in a Twitter Space by asking a relevant question. Upload a screenshot showing your question in the Twitter Space with hashtags like #unWalleted.',
    reward: 15,
    type: 'community',
    platform: 'twitter'
  },
  {
    id: 'public-feedback',
    title: 'Give Feedback on the Project in a Public Post',
    description: 'Share constructive feedback about the project in a public post. Upload a screenshot showing your feedback post with hashtags like #unWalleted.',
    reward: 20,
    type: 'community',
    platform: 'social'
  },

  // Platform/Engagement Tasks
  {
    id: 'bug-feedback',
    title: 'Submit a Bug or UX Feedback',
    description: 'Report a bug or provide UX feedback to help improve the platform. Upload a screenshot showing your bug report or feedback with relevant details.',
    reward: 25,
    type: 'platform',
    platform: 'platform'
  },
  {
    id: 'poll-survey',
    title: 'Participate in a Poll or Survey',
    description: 'Take part in a community poll or survey. Upload a screenshot showing your participation in the poll or survey.',
    reward: 10,
    type: 'platform',
    platform: 'platform'
  },
  {
    id: 'product-review',
    title: 'Write a Review on ProductHunt or G2',
    description: 'Write a detailed review on ProductHunt or G2. Upload a screenshot showing your review with relevant hashtags like #unWalleted.',
    reward: 50,
    type: 'platform',
    platform: 'review'
  },
  {
    id: 'bookmark-share',
    title: 'Bookmark and Share the Website on Socials',
    description: 'Bookmark the project website and share it on your social media. Upload a screenshot showing your social media post with hashtags like #unWalleted.',
    reward: 10,
    type: 'platform',
    platform: 'social'
  },
  {
    id: 'github-star-share',
    title: 'Star the GitHub Repo and Share It',
    description: 'Star the project GitHub repository and share it with your network. Upload a screenshot showing your social media post with hashtags like #unWalleted.',
    reward: 20,
    type: 'platform',
    platform: 'github'
  }
];

// Simple JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Magic authentication endpoint
app.post('/auth/magic', async (req, res) => {
  try {
    const { didToken } = req.body;
    
    if (!didToken) {
      return res.status(400).json({ error: 'Magic DID token required' });
    }

    if (!magic) {
      return res.status(500).json({ error: 'Magic Admin SDK not initialized' });
    }

    // Validate the DID token
    magic.token.validate(didToken);
    
    // Get user metadata from Magic
    const metadata = await magic.users.getMetadataByToken(didToken);
    
    // Get or create user
    let userRecord = users.get(metadata.issuer);
    if (!userRecord) {
      userRecord = {
        uid: metadata.issuer,
        email: metadata.email,
        displayName: metadata.email.split('@')[0], // Use email prefix as display name
        photoURL: null,
        flowAccount: null,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      users.set(metadata.issuer, userRecord);
    } else {
      // Update last login
      userRecord.lastLogin = new Date();
      users.set(metadata.issuer, userRecord);
    }

    // Create session token
    const sessionToken = jwt.sign(
      { uid: userRecord.uid, email: userRecord.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.json({
      user: userRecord,
      sessionToken,
      message: 'Magic authentication successful'
    });
  } catch (error) {
    console.error('Magic authentication error:', error);
    res.status(401).json({ error: 'Invalid Magic token' });
  }
});

// Routes
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
    const userId = req.user.uid;
    const today = new Date().toDateString();

    // 1. Validate input
    if (!taskId || !proof) {
      return res.status(400).json({ error: 'taskId and proof are required.' });
    }

    // 2. Find the task
    const task = DAILY_TASKS.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // 3. Check if already completed today
    let userCompletions = taskCompletions.get(userId) || {};
    let todayCompletions = userCompletions[today] || {};
    if (todayCompletions[taskId]) {
      return res.status(409).json({ error: 'Task already completed today.' });
    }

    // 4. Validate proof (placeholder, can be improved)
    const validation = await validateTaskProof(task, proof);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Proof validation failed.', details: validation.message });
    }

    // 5. Mint tokens to user (rewardUser handles account/vault setup)
    let rewardResult;
    try {
      rewardResult = await flowService.rewardUser(userId, taskId, task.reward);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to mint tokens.', details: err.message });
    }

    // 6. Update completion record
    todayCompletions[taskId] = {
      taskId,
      completedAt: new Date(),
      reward: task.reward,
      proof,
      validation: validation.message,
      txId: rewardResult.transactionId || null
    };
    userCompletions[today] = todayCompletions;
    taskCompletions.set(userId, userCompletions);

    // 7. Fetch updated balance
    let userAccount = await flowService.getUserAccount(userId);
    let balance = 0;
    try {
      balance = await flowService.getBalance(userAccount.address);
    } catch (err) {
      // ignore, just return 0
    }

    // 8. Respond with success, updated balance, and task status
    res.json({
      success: true,
      message: 'Task completed and tokens rewarded!',
      taskId,
      reward: task.reward,
      txId: rewardResult.transactionId || null,
      balance,
      currency: 'TASK',
      flowAddress: userAccount.address,
      completedAt: todayCompletions[taskId].completedAt,
      validation: validation.message
    });
  } catch (error) {
    console.error('Error in /tasks/complete:', error);
    res.status(500).json({ error: error.message || 'Failed to complete task' });
  }
});

app.get('/user/balance', authenticateToken, async (req, res) => {
  try {
    console.log('Incoming /user/balance request for user:', req.user.uid);
    let user = users.get(req.user.uid);
    if (!user) {
      // Auto-create user if not found
      user = {
        uid: req.user.uid,
        email: req.user.email || '',
        displayName: req.user.email ? req.user.email.split('@')[0] : req.user.uid,
        photoURL: null,
        flowAccount: null,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      users.set(req.user.uid, user);
      console.log('Auto-created user:', req.user.uid);
    }

    // Get or create user's Flow account and vault
    let userAccount;
    try {
      userAccount = await flowService.getUserAccount(user.uid);
      if (!userAccount || !userAccount.address) {
        userAccount = await flowService.createUserAccount(user.uid);
        await flowService.setupUserVault(userAccount.address);
      } else {
        await flowService.setupUserVault(userAccount.address);
      }
    } catch (err) {
      console.error('Flow getUserAccount error:', err);
      return res.status(500).json({ error: 'Failed to get or create Flow account.', details: err.message });
    }

    // Get real balance from Flow
    let balance = 0;
    try {
      balance = await flowService.getBalance(userAccount.address);
    } catch (err) {
      console.error('Flow getBalance error:', err);
      return res.status(500).json({ error: 'Failed to fetch balance from Flow.', details: err.message });
    }
    res.json({
      balance,
      currency: 'TASK',
      flowAddress: userAccount.address
    });
  } catch (error) {
    console.error('Error in /user/balance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch balance' });
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

// Test endpoint for validation (remove in production)
app.post('/test/validate', async (req, res) => {
  try {
    const { proof } = req.body;
    
    if (!proof) {
      return res.status(400).json({ error: 'Proof required' });
    }

    // Create a mock task for testing
    const mockTask = {
      id: 'test-task',
      title: 'Test Task',
      description: 'Test task for validation'
    };

    // Test validation
    const validation = await validateTaskProof(mockTask, proof);
    
    res.json({
      success: validation.valid,
      validation: validation
    });
  } catch (error) {
    console.error('Test validation error:', error);
    res.status(500).json({ error: 'Test validation failed' });
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