import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle, 
  Circle, 
  Twitter, 
  Linkedin, 
  Youtube, 
  MessageCircle,
  Coins,
  Calendar,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [stats, setStats] = useState({
    completedToday: 0,
    totalReward: 0,
    streak: 0
  });

  // Platform icons mapping
  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    telegram: MessageCircle,
    whatsapp: MessageCircle
  };

  // Platform colors mapping
  const platformColors = {
    twitter: 'bg-blue-500',
    linkedin: 'bg-blue-600',
    youtube: 'bg-red-500',
    telegram: 'bg-blue-400',
    whatsapp: 'bg-green-500'
  };

  // Fetch daily tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/tasks/daily');
      setTasks(response.data.tasks);
      
      // Calculate stats
      const completedToday = response.data.tasks.filter(task => task.completed).length;
      const totalReward = response.data.tasks
        .filter(task => task.completed)
        .reduce((sum, task) => sum + task.reward, 0);
      
      setStats({
        completedToday,
        totalReward,
        streak: 0 // TODO: Implement streak calculation
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Complete a task
  const completeTask = async (taskId) => {
    try {
      setCompletingTask(taskId);
      
      // For demo purposes, we'll use a simple proof
      const proof = {
        type: 'manual_verification',
        timestamp: new Date().toISOString(),
        description: 'Task completed by user'
      };

      const response = await axios.post('/tasks/complete', {
        taskId,
        proof
      });

      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh tasks
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error completing task:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to complete task');
      }
    } finally {
      setCompletingTask(null);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Good morning, {user?.displayName?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-gray-600">
          Complete your daily tasks to earn TASK tokens on Flow blockchain
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedToday}/5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Coins className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Reward</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReward} TASK</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.streak} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => {
          const PlatformIcon = platformIcons[task.platform];
          const isCompleting = completingTask === task.id;
          
          return (
            <div
              key={task.id}
              className={`bg-white rounded-lg p-6 shadow-sm border transition-all duration-200 ${
                task.completed
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:shadow-md'
              }`}
            >
              {/* Task Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${platformColors[task.platform]}`}>
                    <PlatformIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-500">{task.description}</p>
                  </div>
                </div>
                
                {/* Completion Status */}
                <div className="flex items-center">
                  {task.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300" />
                  )}
                </div>
              </div>

              {/* Reward */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Coins className="h-4 w-4 mr-1" />
                  Reward: {task.reward} TASK
                </div>
                {task.completed && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Completed
                  </span>
                )}
              </div>

              {/* Action Button */}
              {!task.completed && (
                <button
                  onClick={() => completeTask(task.id)}
                  disabled={isCompleting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isCompleting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </div>
                  ) : (
                    'Mark as Complete'
                  )}
                </button>
              )}

              {/* Completion Time */}
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
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          How it works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs mr-3 mt-0.5">
              1
            </div>
            <p>Complete daily social media tasks</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs mr-3 mt-0.5">
              2
            </div>
            <p>Backend automatically mints TASK tokens</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs mr-3 mt-0.5">
              3
            </div>
            <p>Tokens are sent to your Flow account</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 