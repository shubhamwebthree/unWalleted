import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle, 
  Circle, 
  Twitter, 
  Linkedin, 
  Youtube, 
  MessageCircle,
  Phone,
  Coins,
  Calendar,
  TrendingUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  Lock  
} from 'lucide-react';

const CountdownTimer = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = targetTime - now;
      if (diff <= 0) {
        setTimeLeft('Unlocked');
      } else {
        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return <div className="text-lg font-mono">{timeLeft}</div>;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingTask, setCompletingTask] = useState(null);
  const [verifyingTask, setVerifyingTask] = useState(null);
  const [stats, setStats] = useState({ completedToday: 0, totalReward: 0, streak: 0, totalEarned: 0 });
  const [allTasksHistory, setAllTasksHistory] = useState([]);
  const [userStats, setUserStats] = useState({
    totalEarned: 0,
    currentStreak: 0,
    lastCompletedDate: null
  });
 
  // Platform configuration
  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    telegram: MessageCircle,
    whatsapp: Phone
  };

  const platformColors = {
    twitter: 'bg-blue-500',
    linkedin: 'bg-blue-600',
    youtube: 'bg-red-500',
    telegram: 'bg-blue-400',
    whatsapp: 'bg-green-500'
  };

  const platformNames = {
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp'
  };

  // Storage keys
  const STORAGE_KEYS = {
    TASKS: 'daily_tasks_persistent',
    USER_STATS: 'user_stats_persistent',
    TASK_HISTORY: 'task_history_persistent'
  };

  // Utility functions
  const getCurrentDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getUserFirstName = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

  // Enhanced storage functions that use React state as fallback
  const saveToStorage = (key, data) => {
    try {
      // Create a global storage object that persists across component re-renders
      if (typeof window !== 'undefined') {
        if (!window.persistentTaskStorage) {
          window.persistentTaskStorage = {};
        }
        window.persistentTaskStorage[key] = JSON.stringify(data);
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  };

  const loadFromStorage = (key) => {
    try {
      if (typeof window !== 'undefined') {
        // Fallback to our global storage
        if (window.persistentTaskStorage && window.persistentTaskStorage[key]) {
          return JSON.parse(window.persistentTaskStorage[key]);
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  };

  // Initialize storage system
  const initializeStorage = () => {
    if (typeof window !== 'undefined' && !window.persistentTaskStorage) {
      window.persistentTaskStorage = {};
    }
  };

  // Initialize fresh daily tasks template
  const createFreshTasksTemplate = () => {
    const currentDate = getCurrentDateString();
    const baseTasksTemplate = [
      {
        id: 1,
        title: 'Share Web3 Tweet',
        description: 'Tweet about Web3 technology and tag @web3community',
        platform: 'twitter',
        reward: 10,
        verificationUrl: '',
        verificationRequired: true,
        completed: false,
        completedAt: null,
        taskType: 'share'
      },
      {
        id: 2,
        title: 'LinkedIn Professional Post',
        description: 'Write a professional post about blockchain technology',
        platform: 'linkedin',
        reward: 15,
        verificationUrl: '',
        verificationRequired: true,
        completed: false,
        completedAt: null,
        taskType: 'post'
      },
      {
        id: 3,
        title: 'YouTube Short Video',
        description: 'Create a 60-second video about cryptocurrency basics',
        platform: 'youtube',
        reward: 20,
        verificationUrl: '',
        verificationRequired: true,
        completed: false,
        completedAt: null,
        taskType: 'video'
      },
      {
        id: 4,
        title: 'Telegram Group Engagement',
        description: 'Share educational content in our Telegram community',
        platform: 'telegram',
        reward: 8,
        verificationUrl: '',
        verificationRequired: true,
        completed: false,
        completedAt: null,
        taskType: 'engagement'
      },
      {
        id: 5,
        title: 'WhatsApp Group Share',
        description: 'Share our latest update in WhatsApp groups',
        platform: 'whatsapp',
        reward: 8,
        verificationUrl: '',
        verificationRequired: true,
        completed: false,
        completedAt: null,
        taskType: 'share'
      }
    ];

    return baseTasksTemplate.map(task => ({
      ...task,
      id: `${currentDate}-${task.id}`,
      date: currentDate,
      refreshId: Date.now() + Math.random()
    }));
  };

  // Calculate and update stats
  const calculateStats = (taskList) => {
    const completedTasks = taskList.filter(task => task.completed);
    const completedToday = completedTasks.length;
    const totalReward = completedTasks.reduce((sum, task) => sum + task.reward, 0);

    let newTotalEarned = userStats.totalEarned;
    if (completedToday > 0) {
      newTotalEarned = userStats.totalEarned + totalReward;
    }

    const currentDate = getCurrentDateString();
    let currentStreak = userStats.currentStreak;
    
    if (completedToday > 0 && userStats.lastCompletedDate !== currentDate) {
      if (userStats.lastCompletedDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (userStats.lastCompletedDate === yesterdayStr) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      
      const newUserStats = {
        ...userStats,
        currentStreak,
        lastCompletedDate: currentDate,
        totalEarned: newTotalEarned
      };
      
      setUserStats(newUserStats);
      saveToStorage(STORAGE_KEYS.USER_STATS, newUserStats);
    }

    setStats({
      completedToday,
      totalReward,
      streak: currentStreak,
      totalEarned: newTotalEarned
    });
  };

  // Task verification
  const verifyTask = async (taskId, verificationUrl) => {
    setVerifyingTask(taskId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isVerified = Math.random() > 0.2;
    
    if (isVerified) {
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              completed: true, 
              completedAt: new Date().toISOString(),
              verificationUrl,
              lockedUntil: getNextMidnight()
            }
          : task
      );
      
      setTasks(updatedTasks);
      saveToStorage(STORAGE_KEYS.TASKS, updatedTasks);
      calculateStats(updatedTasks);
      
      const completedTask = tasks.find(task => task.id === taskId);
      showToast(`Task verified! +${completedTask.reward} TASK tokens earned`, 'success');
    } else {
      showToast('Verification failed. Please ensure you completed the task correctly.', 'error');
    }
    
    setVerifyingTask(null);
  };

  // Handle task completion
  const completeTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    
    if (task.verificationRequired) {
      const verificationUrl = prompt(`Please provide the URL/link for verification of your ${platformNames[task.platform]} ${task.taskType}:`);
      
      if (!verificationUrl || verificationUrl.trim() === '') {
        showToast('Verification URL is required to complete this task.', 'error');
        return;
      }
      
      await verifyTask(taskId, verificationUrl.trim());
    } else {
      setCompletingTask(taskId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              completed: true, 
              completedAt: new Date().toISOString(),
              lockedUntil: getNextMidnight()
            }
          : task
      );
      
      setTasks(updatedTasks);
      saveToStorage(STORAGE_KEYS.TASKS, updatedTasks);
      calculateStats(updatedTasks);
      
      const completedTask = tasks.find(task => task.id === taskId);
      showToast(`Task completed! +${completedTask.reward} TASK tokens earned`, 'success');
      setCompletingTask(null);
    }
  };

  // Get next midnight (12 AM) timestamp
  const getNextMidnight = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  };

  // Check if we need to create new tasks for a new day
  const shouldCreateNewTasks = (savedTasks) => {
    const currentDate = getCurrentDateString();
    
    if (!savedTasks || savedTasks.length === 0) {
      return true;
    }
    
    const savedTaskDate = savedTasks[0]?.date;
    if (savedTaskDate !== currentDate) {
      return true;
    }
    
    const now = new Date();
    const hasLockedTasks = savedTasks.some(task => 
      task.completed && task.lockedUntil && new Date(task.lockedUntil) > now
    );
    
    return !hasLockedTasks && savedTasks.some(task => task.completed);
  };

  // Check if refresh is allowed
  const canRefreshTasks = () => {
    const now = new Date();
    const hasCompletedTasks = tasks.some(task => task.completed);
    
    if (!hasCompletedTasks) {
      return { allowed: true, reason: '' };
    }
    
    const hasLockedTasks = tasks.some(task => 
      task.completed && task.lockedUntil && new Date(task.lockedUntil) > now
    );
    
    if (hasLockedTasks) {
      const earliestUnlock = Math.min(...tasks
        .filter(task => task.completed && task.lockedUntil)
        .map(task => new Date(task.lockedUntil).getTime())
      );
      
      return { 
        allowed: false, 
        reason: 'Tasks refresh after 12:00 AM tomorrow',
        unlockTime: new Date(earliestUnlock)
      };
    }
    
    return { allowed: true, reason: '' };
  };

  // Refresh tasks function
  const refreshTasks = async () => {
    const refreshCheck = canRefreshTasks();
    
    if (!refreshCheck.allowed) {
      showToast(refreshCheck.reason, 'error');
      return;
    }
    
    setRefreshing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const completedTasks = tasks.filter(task => task.completed);
      if (completedTasks.length > 0) {
        const newHistory = [...allTasksHistory, ...completedTasks];
        setAllTasksHistory(newHistory);
        saveToStorage(STORAGE_KEYS.TASK_HISTORY, newHistory);
      }
      
      const freshTasks = createFreshTasksTemplate();
      
      setTasks(freshTasks);
      saveToStorage(STORAGE_KEYS.TASKS, freshTasks);
      calculateStats(freshTasks);
      
      showToast('New daily tasks are now available!', 'success');
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      showToast('Failed to refresh tasks. Please try again.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Simple toast notification
  const showToast = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  // Initialize tasks on component mount
  const initializeTasks = async () => {
    try {
      setLoading(true);
      
      // Initialize storage system first
      initializeStorage();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load saved data
      const savedTasks = loadFromStorage(STORAGE_KEYS.TASKS);
      const savedUserStats = loadFromStorage(STORAGE_KEYS.USER_STATS);
      const savedHistory = loadFromStorage(STORAGE_KEYS.TASK_HISTORY);
      
      // Initialize user stats
      if (savedUserStats) {
        setUserStats(savedUserStats);
      }
      
      // Initialize history
      if (savedHistory) {
        setAllTasksHistory(savedHistory);
      }
      
      let tasksToUse;
      
      if (shouldCreateNewTasks(savedTasks)) {
        tasksToUse = createFreshTasksTemplate();
        saveToStorage(STORAGE_KEYS.TASKS, tasksToUse);
      } else {
        tasksToUse = savedTasks;
      }
      
      setTasks(tasksToUse);
      calculateStats(tasksToUse);
      
    } catch (error) {
      console.error('Error initializing tasks:', error);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    initializeTasks();
  }, []);

  // Auto-unlock tasks after midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentDate = getCurrentDateString();
      
      if (shouldCreateNewTasks(tasks)) {
        const completedTasks = tasks.filter(task => task.completed);
        if (completedTasks.length > 0) {
          const newHistory = [...allTasksHistory, ...completedTasks];
          setAllTasksHistory(newHistory);
          saveToStorage(STORAGE_KEYS.TASK_HISTORY, newHistory);
        }
        
        const freshTasks = createFreshTasksTemplate();
        setTasks(freshTasks);
        saveToStorage(STORAGE_KEYS.TASKS, freshTasks);
        calculateStats(freshTasks);
        
        showToast('New daily tasks are now available!', 'success');
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [tasks, allTasksHistory]);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your daily tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with User Info */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {getUserFirstName()}!
            </h1>
            <p className="text-gray-600">
              Complete your daily tasks to earn TASK tokens on Flow blockchain.
            </p>
          </div>
          <button
            onClick={refreshTasks}
            disabled={refreshing || !canRefreshTasks().allowed}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              canRefreshTasks().allowed 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } disabled:opacity-50`}
            title={canRefreshTasks().allowed ? "Get new daily tasks" : canRefreshTasks().reason}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : canRefreshTasks().allowed ? 'New Daily Tasks' : 'Tasks Refresh at 12 AM'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Completed Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completedToday}/5</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Coins className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Today's Reward</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReward} TASK</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Current Streak</p>
            <p className="text-2xl font-bold text-gray-900">{stats.streak} days</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Coins className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Earned</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalEarned} TASK</p>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map(task => {
          const PlatformIcon = platformIcons[task.platform];
          const isCompleting = completingTask === task.id;
          const isVerifying = verifyingTask === task.id;
          const isProcessing = isCompleting || isVerifying;
          const isLocked = task.lockedUntil && new Date(task.lockedUntil) > new Date();

          return (
            <div
              key={task.id}
              className={`bg-white rounded-lg p-6 shadow-sm border ${
                task.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:shadow-md'
              } transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${platformColors[task.platform]}`}>
                    <PlatformIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-500">{task.description}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {platformNames[task.platform]}
                    </span>
                  </div>
                </div>
                {task.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-300" />
                )}
              </div>
              
              <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Coins className="h-4 w-4 mr-1" />
                  {task.reward} TASK
                </div>
                {task.completed && (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    Verified ✓
                  </span>
                )}
              </div>
              
              {task.completed && task.verificationUrl && (
                <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
                  <span className="text-gray-600">Verification: </span>
                  <a 
                    href={task.verificationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    View Link <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
              
              {!task.completed && !isLocked && (
                <button
                  onClick={() => completeTask(task.id)}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : isCompleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    'Complete Task'
                  )}
                </button>
              )}

              {isLocked && (
                <div className="flex flex-col items-center justify-center text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
                  <Lock className="h-8 w-8 mb-2 text-gray-400" />
                  <div className="text-center">
                    <p className="font-medium mb-1">Task Completed!</p>
                    <p className="text-xs mb-2">Available again in:</p>
                    <CountdownTimer targetTime={new Date(task.lockedUntil)} />
                    <p className="text-xs mt-1">Available after 12:00 AM</p>
                  </div>
                </div>
              )}

              {task.completed && task.completedAt && (
                <div className="mt-3 text-xs text-gray-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Completed at {new Date(task.completedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Info Section */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-800">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs mr-3 mt-0.5">1</div>
            <p>Complete daily social media tasks</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs mr-3 mt-0.5">2</div>
            <p>Provide verification link/URL</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs mr-3 mt-0.5">3</div>
            <p>System verifies completion</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs mr-3 mt-0.5">4</div>
            <p>TASK tokens sent to Flow wallet</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📅 Daily Cycle:</strong> Complete today's tasks and earn rewards. New tasks become available at 12:00 AM tomorrow!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
