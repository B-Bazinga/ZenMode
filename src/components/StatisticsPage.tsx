import React, { useState } from 'react';
import { Calendar, Clock, Target, TrendingUp, Zap, Award, Download, Filter } from 'lucide-react';
import { useZenMode } from '../context/ZenModeContext';

export default function StatisticsPage() {
  const { stats, sessions, exportData } = useZenMode();
  const [dateRange, setDateRange] = useState('week');
  const [viewType, setViewType] = useState('overview');

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getCompletionRate = () => {
    return stats.totalSessions > 0 
      ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
      : 0;
  };

  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, index) => ({
      day,
      minutes: stats.weeklyProgress[index] || 0
    }));
  };

  const getRecentSessions = () => {
    return sessions
      .slice(-10)
      .reverse()
      .map(session => ({
        ...session,
        date: new Date(session.startTime).toLocaleDateString(),
        time: new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationFormatted: formatDuration(session.duration)
      }));
  };

  const achievements = [
    {
      id: 'first-session',
      title: 'First Steps',
      description: 'Complete your first focus session',
      icon: '🎯',
      completed: stats.completedSessions >= 1,
      progress: Math.min(stats.completedSessions, 1),
      target: 1
    },
    {
      id: 'streak-3',
      title: 'Getting Started',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
      completed: stats.longestStreak >= 3,
      progress: Math.min(stats.longestStreak, 3),
      target: 3
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '⚡',
      completed: stats.longestStreak >= 7,
      progress: Math.min(stats.longestStreak, 7),
      target: 7
    },
    {
      id: 'sessions-25',
      title: 'Focus Master',
      description: 'Complete 25 focus sessions',
      icon: '🏆',
      completed: stats.completedSessions >= 25,
      progress: Math.min(stats.completedSessions, 25),
      target: 25
    },
    {
      id: 'time-1000',
      title: 'Time Lord',
      description: 'Accumulate 1000 minutes of focus time',
      icon: '⏰',
      completed: stats.totalFocusTime >= 1000,
      progress: Math.min(stats.totalFocusTime, 1000),
      target: 1000
    },
    {
      id: 'no-overrides',
      title: 'Iron Will',
      description: 'Complete 10 sessions without emergency overrides',
      icon: '💪',
      completed: stats.completedSessions >= 10 && stats.emergencyOverridesUsed === 0,
      progress: stats.emergencyOverridesUsed === 0 ? Math.min(stats.completedSessions, 10) : 0,
      target: 10
    }
  ];

  const maxWeeklyMinutes = Math.max(...stats.weeklyProgress, 1);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="flex gap-4">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          >
            <option value="overview">Overview</option>
            <option value="detailed">Detailed Stats</option>
            <option value="achievements">Achievements</option>
            <option value="sessions">Session History</option>
          </select>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <button
          onClick={() => exportData('stats')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Overview */}
      {viewType === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                <h3 className="font-medium">Current Streak</h3>
              </div>
              <p className="text-3xl font-bold">{stats.currentStreak}</p>
              <p className="text-sm text-gray-400">days</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-green-400" />
                <h3 className="font-medium">Total Focus Time</h3>
              </div>
              <p className="text-3xl font-bold">{formatDuration(stats.totalFocusTime)}</p>
              <p className="text-sm text-gray-400">all time</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-purple-400" />
                <h3 className="font-medium">Completion Rate</h3>
              </div>
              <p className="text-3xl font-bold">{getCompletionRate()}%</p>
              <p className="text-sm text-gray-400">{stats.completedSessions}/{stats.totalSessions} sessions</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
                <h3 className="font-medium">Average Session</h3>
              </div>
              <p className="text-3xl font-bold">{formatDuration(stats.averageSessionDuration)}</p>
              <p className="text-sm text-gray-400">duration</p>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6">Weekly Focus Time</h3>
            <div className="space-y-4">
              {getWeeklyData().map((day, index) => (
                <div key={day.day} className="flex items-center gap-4">
                  <div className="w-12 text-sm text-gray-400">{day.day}</div>
                  <div className="flex-1 bg-gray-800 rounded-full h-6 relative">
                    <div
                      className="bg-white rounded-full h-6 transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${(day.minutes / maxWeeklyMinutes) * 100}%` }}
                    >
                      {day.minutes > 0 && (
                        <span className="text-xs font-medium text-black">
                          {formatDuration(day.minutes)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-400 text-right">
                    {formatDuration(day.minutes)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Stats */}
      {viewType === 'detailed' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Focus Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Sessions</span>
                  <span className="font-medium">{stats.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completed Sessions</span>
                  <span className="font-medium">{stats.completedSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="font-medium">{getCompletionRate()}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Focus Time</span>
                  <span className="font-medium">{formatDuration(stats.totalFocusTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Session</span>
                  <span className="font-medium">{formatDuration(stats.averageSessionDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Today's Focus Time</span>
                  <span className="font-medium">{formatDuration(stats.todayFocusTime)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Streak Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Streak</span>
                  <span className="font-medium">{stats.currentStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Longest Streak</span>
                  <span className="font-medium">{stats.longestStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Weekly Streak</span>
                  <span className="font-medium">{stats.weeklyStreak}/7 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Emergency Overrides Used</span>
                  <span className="font-medium">{stats.emergencyOverridesUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Overrides Remaining</span>
                  <span className="font-medium">{stats.emergencyOverridesRemaining}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Most Productive Hour</span>
                  <span className="font-medium">{stats.mostProductiveHour}:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements */}
      {viewType === 'achievements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-gray-900 border rounded-lg p-6 transition-all ${
                  achievement.completed 
                    ? 'border-green-500 bg-green-900/10' 
                    : 'border-gray-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      {achievement.completed && (
                        <Award className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            achievement.completed ? 'bg-green-400' : 'bg-white'
                          }`}
                          style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">
                        {achievement.progress}/{achievement.target}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session History */}
      {viewType === 'sessions' && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold">Recent Sessions</h3>
          </div>
          {getRecentSessions().length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No sessions yet</h3>
              <p className="text-gray-500">Start your first focus session to see history here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {getRecentSessions().map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        session.completed 
                          ? 'bg-green-400' 
                          : session.emergencyOverrideUsed 
                            ? 'bg-red-400' 
                            : 'bg-yellow-400'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {session.completed 
                            ? 'Completed Session' 
                            : session.emergencyOverrideUsed 
                              ? 'Emergency Override' 
                              : 'Incomplete Session'
                          }
                        </p>
                        <p className="text-sm text-gray-400">
                          {session.date} at {session.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{session.durationFormatted}</p>
                      <p className="text-sm text-gray-400">duration</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}