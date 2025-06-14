import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Target, Calendar, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { useZenMode } from '../context/ZenModeContext';

export default function TimerPage() {
  const { timerState, stats, startTimer, stopTimer, updateTimerState } = useZenMode();
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  // Update timer display every second
  useEffect(() => {
    if (timerState.isActive) {
      const interval = setInterval(updateTimerState, 1000);
      return () => clearInterval(interval);
    }
  }, [timerState.isActive, updateTimerState]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (timerState.isActive) return;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds === 0) {
      alert('Please set a timer duration');
      return;
    }

    setShowWarning(true);
  };

  const confirmStart = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    startTimer(totalSeconds);
    setShowWarning(false);
  };

  const handleEmergencyStop = () => {
    if (stats.emergencyOverridesRemaining <= 0) {
      alert('No emergency overrides remaining today');
      return;
    }

    const reason = prompt('Emergency override reason (minimum 50 characters):');
    if (!reason || reason.length < 50) {
      alert('Please provide a detailed reason (minimum 50 characters)');
      return;
    }

    if (confirm('This will end your focus session and use one emergency override. Continue?')) {
      stopTimer(false, true);
    }
  };

  const presets = [
    { label: '5 min', minutes: 5 },
    { label: '25 min', minutes: 25 },
    { label: '45 min', minutes: 45 },
    { label: '90 min', minutes: 90 }
  ];

  const setPreset = (presetMinutes: number) => {
    if (timerState.isActive) return;
    setHours(Math.floor(presetMinutes / 60));
    setMinutes(presetMinutes % 60);
    setSeconds(0);
  };

  const progress = timerState.isActive 
    ? ((timerState.duration - timerState.remainingTime) / timerState.duration) * 100 
    : 0;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Current Streak</p>
              <p className="text-xl font-semibold">{stats.currentStreak} days</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Weekly Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${(stats.weeklyStreak / 7) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{stats.weeklyStreak}/7</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Today's Sessions</p>
              <p className="text-xl font-semibold">{stats.todaySessions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Focus Time Today</p>
              <p className="text-xl font-semibold">
                {Math.floor(stats.todayFocusTime / 60)}h {stats.todayFocusTime % 60}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Timer */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
        <div className="text-center">
          {/* Timer Circle */}
          <div className="relative inline-block mb-8">
            <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-800"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-white transition-all duration-1000 ease-in-out"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold mb-2">
                  {timerState.isActive 
                    ? formatTime(timerState.remainingTime)
                    : formatTime(hours * 3600 + minutes * 60 + seconds)
                  }
                </div>
                <div className="text-sm text-gray-400">
                  {timerState.isActive ? 'Remaining' : 'Set Duration'}
                </div>
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          {!timerState.isActive ? (
            <div className="space-y-6">
              {/* Time Inputs */}
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <label className="block text-sm text-gray-400 mb-2">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, Math.min(24, parseInt(e.target.value) || 0)))}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
                <div className="text-center">
                  <label className="block text-sm text-gray-400 mb-2">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
                <div className="text-center">
                  <label className="block text-sm text-gray-400 mb-2">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex justify-center gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setPreset(preset.minutes)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartTimer}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Focus Session
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-lg text-gray-300">
                Focus session in progress...
              </div>
              
              {/* Emergency Override */}
              <div className="space-y-4">
                <div className="text-sm text-gray-400">
                  Emergency overrides remaining: {stats.emergencyOverridesRemaining}
                </div>
                <button
                  onClick={handleEmergencyStop}
                  disabled={stats.emergencyOverridesRemaining <= 0}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-900 hover:bg-red-800 disabled:bg-gray-800 disabled:text-gray-500 text-red-100 rounded-lg font-medium transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Emergency Override
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Point of No Return</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Once started, this timer cannot be paused or stopped without using an emergency override. 
              Make sure you're ready for an uninterrupted focus session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStart}
                className="flex-1 px-4 py-2 bg-white text-black hover:bg-gray-100 rounded-lg font-semibold transition-colors"
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}