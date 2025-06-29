import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Coins, 
  TrendingUp, 
  CheckCircle,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TaskHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalReward: 0,
    averagePerDay: 0
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

  // Fetch task history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/tasks/history');
      setHistory(response.data.history);
      
      // Calculate stats
      const totalTasks = response.data.history.reduce((sum, day) => 
        sum + day.completions.length, 0
      );
      const totalReward = response.data.history.reduce((sum, day) => 
        sum + day.totalReward, 0
      );
      const averagePerDay = history.length > 0 ? totalReward / history.length : 0;
      
      setStats({
        totalTasks,
        totalReward,
        averagePerDay
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load task history');
    } finally {
      setLoading(false);
    }
  }, [history.length]);

  useEffect(() => {
    fetchHistory();
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-sm font-medium text-gray-600">Avg. per Day</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averagePerDay.toFixed(1)} TASK</p>
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
            <div key={day.date} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Day Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Coins className="h-4 w-4 mr-1" />
                    <span className="font-medium">{day.totalReward} TASK earned</span>
                  </div>
                </div>
              </div>

              {/* Tasks for the day */}
              <div className="p-6">
                {day.completions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tasks completed on this day</p>
                ) : (
                  <div className="space-y-4">
                    {day.completions.map((completion, index) => {
                      const PlatformIcon = platformIcons[completion.platform] || MessageCircle;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg ${platformColors[completion.platform] || 'bg-gray-500'}`}>
                              <PlatformIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">
                                {completion.taskTitle || 'Task completed'}
                              </p>
                              <p className="text-sm text-gray-500">
                                Completed at {new Date(completion.completedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Coins className="h-4 w-4 mr-1" />
                            <span className="font-medium">+{completion.reward} TASK</span>
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
    </div>
  );
};

export default TaskHistory; 