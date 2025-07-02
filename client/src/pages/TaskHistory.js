import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Coins, 
  TrendingUp, 
  CheckCircle,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle,
  Phone,
  ExternalLink
} from 'lucide-react';

const TaskHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalReward: 0,
    averagePerDay: 0,
    totalDays: 0
  });

  // Storage keys - same as Dashboard
  const STORAGE_KEYS = {
    TASKS: 'daily_tasks_persistent',
    USER_STATS: 'user_stats_persistent',
    TASK_HISTORY: 'task_history_persistent'
  };

  // Platform icons mapping
  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    telegram: MessageCircle,
    whatsapp: Phone
  };

  // Platform colors mapping
  const platformColors = {
    twitter: 'bg-blue-500',
    linkedin: 'bg-blue-600',
    youtube: 'bg-red-500',
    telegram: 'bg-blue-400',
    whatsapp: 'bg-green-500'
  };

  // Platform names mapping
  const platformNames = {
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp'
  };

  // Load data from localStorage
  const loadFromStorage = (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
      return null;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  };

  // Group tasks by date
  const groupTasksByDate = (tasks) => {
    const grouped = {};
    
    tasks.forEach(task => {
      const taskDate = task.date || task.completedAt?.split('T')[0] || new Date().toISOString().split('T')[0];
      
      if (!grouped[taskDate]) {
        grouped[taskDate] = {
          date: taskDate,
          completions: [],
          totalReward: 0
        };
      }
      
      grouped[taskDate].completions.push({
        taskTitle: task.title,
        platform: task.platform,
        reward: task.reward,
        completedAt: task.completedAt,
        verificationUrl: task.verificationUrl,
        taskType: task.taskType
      });
      
      grouped[taskDate].totalReward += task.reward;
    });
    
    // Convert to array and sort by date (newest first)
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Fetch task history from localStorage
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load completed tasks from history
      const savedHistory = loadFromStorage(STORAGE_KEYS.TASK_HISTORY) || [];
      
      // Also check current tasks for any completed ones
      const currentTasks = loadFromStorage(STORAGE_KEYS.TASKS) || [];
      const completedCurrentTasks = currentTasks.filter(task => task.completed);
      
      // Combine all completed tasks
      const allCompletedTasks = [...savedHistory, ...completedCurrentTasks];
      
      // Group by date
      const groupedHistory = groupTasksByDate(allCompletedTasks);
      setHistory(groupedHistory);
      
      // Calculate stats
      const totalTasks = allCompletedTasks.length;
      const totalReward = allCompletedTasks.reduce((sum, task) => sum + task.reward, 0);
      const totalDays = groupedHistory.length;
      const averagePerDay = totalDays > 0 ? totalReward / totalDays : 0;
      
      setStats({
        totalTasks,
        totalReward,
        averagePerDay,
        totalDays
      });
      
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Listen for storage changes to update history in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      fetchHistory();
    };

    // Listen for various events that might indicate task updates
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('taskCompleted', handleStorageChange);
    window.addEventListener('tasksUpdated', handleStorageChange);
    
    // Also refresh when the page becomes visible (handles day changes)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchHistory();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('taskCompleted', handleStorageChange);
      window.removeEventListener('tasksUpdated', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchHistory]);
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your task history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Task History
        </h1>
        <p className="text-gray-600">
          Track your progress and rewards over time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Coins className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Rewards</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalReward} TASK</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. per Day</p>
              <p className="text-2xl font-bold text-purple-600">{stats.averagePerDay.toFixed(1)} TASK</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Days</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalDays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-6">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No history yet</h3>
            <p className="text-gray-600">
              Complete your first task to start building your history!
            </p>
          </div>
        ) : (
          history.map((day) => (
            <div key={day.date} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              {/* Day Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {day.completions.length} task{day.completions.length !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 font-semibold">
                      <Coins className="h-5 w-5 mr-1" />
                      <span className="text-lg">{day.totalReward} TASK</span>
                    </div>
                    <p className="text-xs text-gray-500">earned</p>
                  </div>
                </div>
              </div>

              {/* Tasks for the day */}
              <div className="p-6">
                {day.completions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No tasks completed on this day</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {day.completions.map((completion, index) => {
                      const PlatformIcon = platformIcons[completion.platform] || MessageCircle;
                      
                      return (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg ${platformColors[completion.platform] || 'bg-gray-500'}`}>
                                <PlatformIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900 text-sm">
                                  {completion.taskTitle || 'Task completed'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {platformNames[completion.platform] || completion.platform}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-green-600 font-medium text-sm">
                                <Coins className="h-3 w-3 mr-1" />
                                <span>+{completion.reward}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {completion.completedAt ? 
                                new Date(completion.completedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 
                                'Time not recorded'
                              }
                            </span>
                            {completion.verificationUrl && (
                              <a 
                                href={completion.verificationUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                <span>View</span>
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Section */}
      {history.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Journey So Far</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.totalTasks}</div>
              <div className="text-blue-600">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{stats.totalReward}</div>
              <div className="text-green-600">TASK Tokens Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.totalDays}</div>
              <div className="text-purple-600">Active Days</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskHistory;
