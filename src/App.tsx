import React, { useState, useEffect } from 'react';
import { Clock, BarChart3, Shield, Home, Calendar, TrendingUp, Target, Zap } from 'lucide-react';
import TimerPage from './components/TimerPage';
import BlockedSitesPage from './components/BlockedSitesPage';
import StatisticsPage from './components/StatisticsPage';
import { ZenModeProvider, useZenMode } from './context/ZenModeContext';

type Page = 'timer' | 'blocked-sites' | 'statistics';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('timer');
  const { stats } = useZenMode();

  const navigation = [
    { id: 'timer', label: 'Timer', icon: Clock },
    { id: 'blocked-sites', label: 'Blocked Sites', icon: Shield },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 }
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'timer':
        return <TimerPage />;
      case 'blocked-sites':
        return <BlockedSitesPage />;
      case 'statistics':
        return <StatisticsPage />;
      default:
        return <TimerPage />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">ZenMode</h1>
                <p className="text-sm text-gray-400">Focus & Productivity</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Streak:</span>
                <span className="font-semibold text-white">{stats.currentStreak} days</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Today:</span>
                <span className="font-semibold text-white">{stats.todaySessions} sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Focus:</span>
                <span className="font-semibold text-white">{Math.floor(stats.todayFocusTime / 60)}h {stats.todayFocusTime % 60}m</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as Page)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    currentPage === item.id
                      ? 'border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <ZenModeProvider>
      <AppContent />
    </ZenModeProvider>
  );
}

export default App;