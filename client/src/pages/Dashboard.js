import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle, 
  Coins,
  Calendar,
  TrendingUp,
  Image,
  Link
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [stats, setStats] = useState({
    completedToday: 0,
    totalReward: 0,
    streak: 0
  });

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

  const fetchBalance = async () => {
    try {
      const response = await axios.get('/user/balance');
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // Complete a task
  const completeTask = async (taskId, proof) => {
    try {
      console.log('Sending complete task request with:', { taskId, proof });
      setCompletingTask(taskId);
      const response = await axios.post('/tasks/complete', { taskId, proof });
      
      if (response.data.success) {
        // Show success message
        toast.success(response.data.message);
        
        // Show analysis results if available
        if (response.data.analysis) {
          const analysis = response.data.analysis;
          let analysisMessage = `Analysis Results:\n`;
          analysisMessage += `✅ Confidence: ${Math.round(analysis.confidence * 100)}%\n`;
          
          if (analysis.foundHashtags && analysis.foundHashtags.length > 0) {
            analysisMessage += `📝 Found Hashtags: ${analysis.foundHashtags.join(', ')}\n`;
          }
          
          if (analysis.foundKeywords && analysis.foundKeywords.length > 0) {
            analysisMessage += `🔍 Found Keywords: ${analysis.foundKeywords.join(', ')}\n`;
          }
          
          if (analysis.extractedText) {
            analysisMessage += `📄 Extracted Text: "${analysis.extractedText.substring(0, 100)}..."\n`;
          }
          
          // Show analysis in a more detailed toast or alert
          setTimeout(() => {
            toast.success(analysisMessage, {
              duration: 6000,
              style: {
                whiteSpace: 'pre-line',
                maxWidth: '500px'
              }
            });
          }, 1000);
        }
        
        // Show warning if any
        if (response.data.warning) {
          setTimeout(() => {
            toast(response.data.warning, {
              icon: '⚠️',
              style: {
                background: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeeba',
              },
              duration: 5000
            });
          }, 2000);
        }
        fetchTasks(); // Refresh tasks
        fetchBalance(); // Refresh balance
      }
    } catch (error) {
      console.error('Error completing task:', error);
      
      // Show error message
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to complete task');
      }
      
      // Show analysis results even on failure if available
      if (error.response?.data?.analysis) {
        const analysis = error.response.data.analysis;
        let analysisMessage = `❌ Task Rejected - Analysis Results:\n`;
        analysisMessage += `📊 Confidence: ${Math.round(analysis.confidence * 100)}%\n`;
        
        if (analysis.foundHashtags && analysis.foundHashtags.length > 0) {
          analysisMessage += `📝 Found Hashtags: ${analysis.foundHashtags.join(', ')}\n`;
        } else {
          analysisMessage += `📝 Found Hashtags: None\n`;
        }
        
        if (analysis.foundKeywords && analysis.foundKeywords.length > 0) {
          analysisMessage += `🔍 Found Keywords: ${analysis.foundKeywords.join(', ')}\n`;
        } else {
          analysisMessage += `🔍 Found Keywords: None\n`;
        }
        
        if (analysis.extractedText) {
          analysisMessage += `📄 Extracted Text: "${analysis.extractedText.substring(0, 100)}..."\n`;
        }
        
        analysisMessage += `\n💡 Tip: Include hashtags like #unWalleted, #taskrewards, or keywords like "unwalleted", "web3", "blockchain" in your image.`;
        
        // Show analysis in a detailed toast
        setTimeout(() => {
          toast.error(analysisMessage, {
            duration: 8000,
            style: {
              whiteSpace: 'pre-line',
              maxWidth: '500px'
            }
          });
        }, 1000);
      }
    } finally {
      setCompletingTask(null);
    }
  };

  const handleTaskComplete = (task) => {
    // Prompt the user to enter a link as proof
    const link = window.prompt('Paste the link as proof for completing this task:');
    if (link) {
      completeTask(task.id, link);
    }
  };

  const getProofTypeIcon = (taskId) => {
    // All tasks now require a link as proof
    return { icon: Link, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Link Required' };
  };

  useEffect(() => {
    fetchTasks();
    fetchBalance();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.displayName || 'User'}!
          </h1>
          <p className="text-gray-600">
            Complete daily tasks to earn TASK tokens on Flow blockchain
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedToday}/{tasks.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Coins className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReward} TASK</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">{balance} TASK</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Reset</p>
                <p className="text-2xl font-bold text-gray-900">Tomorrow</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Today's Tasks</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete these tasks to earn TASK tokens
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="font-medium">Proof Type:</span>
              <div className="flex items-center gap-1">
                <div className="p-1 rounded-full bg-purple-100">
                  <Image className="h-3 w-3 text-purple-600" />
                </div>
                <span>Image Upload Required (All Tasks)</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {/* Task Categories */}
            {['social', 'content', 'community', 'platform'].map((category) => {
              const categoryTasks = tasks.filter(task => task.type === category);
              const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
              
              if (categoryTasks.length === 0) return null;
              
              return (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    {categoryTitle} Tasks ({categoryTasks.filter(t => t.completed).length}/{categoryTasks.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-6 transition-all duration-200 ${
                          task.completed
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-white hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {task.title}
                              </h3>
                              {(() => {
                                const proofType = getProofTypeIcon(task.id);
                                const IconComponent = proofType.icon;
                                return (
                                  <div className={`p-1 rounded-full ${proofType.bgColor}`} title={`Requires ${proofType.label}`}>
                                    <IconComponent className={`h-4 w-4 ${proofType.color}`} />
                                  </div>
                                );
                              })()}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {task.description}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Coins className="h-4 w-4 mr-1" />
                              {task.reward} TASK tokens
                            </div>
                          </div>
                          {task.completed && (
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                          )}
                        </div>

                        {!task.completed ? (
                          <button
                            onClick={() => handleTaskComplete(task)}
                            disabled={completingTask === task.id}
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {completingTask === task.id ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Completing...
                              </div>
                            ) : (
                              'Complete Task'
                            )}
                          </button>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-green-600 font-medium">
                              Completed at {new Date(task.completedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 