import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BlockedSite {
  id: string;
  url: string;
  category: string;
  blockedAt: number;
  timeSaved: number; // in minutes
  blockCount: number;
}

export interface FocusSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // in minutes
  completed: boolean;
  emergencyOverrideUsed: boolean;
}

export interface Stats {
  currentStreak: number;
  longestStreak: number;
  weeklyStreak: number;
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // in minutes
  todayFocusTime: number;
  todaySessions: number;
  averageSessionDuration: number;
  emergencyOverridesUsed: number;
  emergencyOverridesRemaining: number;
  mostProductiveHour: number;
  weeklyProgress: number[];
  monthlyProgress: number[];
}

export interface TimerState {
  isActive: boolean;
  duration: number; // in seconds
  remainingTime: number; // in seconds
  startTime: number;
}

interface ZenModeContextType {
  blockedSites: BlockedSite[];
  stats: Stats;
  timerState: TimerState;
  sessions: FocusSession[];
  addBlockedSite: (site: Omit<BlockedSite, 'id' | 'blockedAt' | 'timeSaved' | 'blockCount'>) => void;
  removeBlockedSite: (id: string) => void;
  updateBlockedSite: (id: string, updates: Partial<BlockedSite>) => void;
  startTimer: (duration: number) => void;
  stopTimer: (completed: boolean, emergencyOverride?: boolean) => void;
  updateTimerState: () => void;
  exportData: (type: 'sites' | 'stats') => void;
  importSites: (sites: Omit<BlockedSite, 'id' | 'blockedAt' | 'timeSaved' | 'blockCount'>[]) => void;
}

const ZenModeContext = createContext<ZenModeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BLOCKED_SITES: 'zenmode_blocked_sites',
  STATS: 'zenmode_stats',
  TIMER_STATE: 'zenmode_timer_state',
  SESSIONS: 'zenmode_sessions'
};

const defaultStats: Stats = {
  currentStreak: 0,
  longestStreak: 0,
  weeklyStreak: 0,
  totalSessions: 0,
  completedSessions: 0,
  totalFocusTime: 0,
  todayFocusTime: 0,
  todaySessions: 0,
  averageSessionDuration: 0,
  emergencyOverridesUsed: 0,
  emergencyOverridesRemaining: 5,
  mostProductiveHour: 9,
  weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
  monthlyProgress: Array(30).fill(0)
};

const defaultTimerState: TimerState = {
  isActive: false,
  duration: 0,
  remainingTime: 0,
  startTime: 0
};

export function ZenModeProvider({ children }: { children: ReactNode }) {
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [timerState, setTimerState] = useState<TimerState>(defaultTimerState);
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedSites = localStorage.getItem(STORAGE_KEYS.BLOCKED_SITES);
        if (savedSites) {
          setBlockedSites(JSON.parse(savedSites));
        }

        const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
        if (savedStats) {
          setStats({ ...defaultStats, ...JSON.parse(savedStats) });
        }

        const savedTimer = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
        if (savedTimer) {
          const timer = JSON.parse(savedTimer);
          if (timer.isActive) {
            // Check if timer should still be active
            const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
            const remaining = Math.max(0, timer.duration - elapsed);
            
            if (remaining > 0) {
              setTimerState({
                ...timer,
                remainingTime: remaining
              });
            } else {
              // Timer should have completed
              setTimerState(defaultTimerState);
              // Auto-complete the session
              setTimeout(() => stopTimer(true), 100);
            }
          }
        }

        const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        if (savedSessions) {
          setSessions(JSON.parse(savedSessions));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_SITES, JSON.stringify(blockedSites));
  }, [blockedSites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(timerState));
  }, [timerState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  const addBlockedSite = (site: Omit<BlockedSite, 'id' | 'blockedAt' | 'timeSaved' | 'blockCount'>) => {
    const newSite: BlockedSite = {
      ...site,
      id: Date.now().toString(),
      blockedAt: Date.now(),
      timeSaved: 0,
      blockCount: 0
    };
    setBlockedSites(prev => [...prev, newSite]);
  };

  const removeBlockedSite = (id: string) => {
    setBlockedSites(prev => prev.filter(site => site.id !== id));
  };

  const updateBlockedSite = (id: string, updates: Partial<BlockedSite>) => {
    setBlockedSites(prev => prev.map(site => 
      site.id === id ? { ...site, ...updates } : site
    ));
  };

  const startTimer = (duration: number) => {
    const startTime = Date.now();
    setTimerState({
      isActive: true,
      duration,
      remainingTime: duration,
      startTime
    });
  };

  const stopTimer = (completed: boolean, emergencyOverride = false) => {
    if (!timerState.isActive) return;

    const endTime = Date.now();
    const actualDuration = Math.floor((endTime - timerState.startTime) / 1000 / 60); // in minutes

    // Create session record
    const session: FocusSession = {
      id: Date.now().toString(),
      startTime: timerState.startTime,
      endTime,
      duration: actualDuration,
      completed,
      emergencyOverrideUsed: emergencyOverride
    };

    setSessions(prev => [...prev, session]);

    // Update stats
    setStats(prev => {
      const today = new Date().toDateString();
      const isToday = new Date(timerState.startTime).toDateString() === today;
      
      const newStats = { ...prev };
      
      newStats.totalSessions += 1;
      if (completed) {
        newStats.completedSessions += 1;
        newStats.totalFocusTime += actualDuration;
        
        if (isToday) {
          newStats.todayFocusTime += actualDuration;
          newStats.todaySessions += 1;
        }
        
        // Update streak
        if (isToday && completed) {
          newStats.currentStreak += 1;
          newStats.longestStreak = Math.max(newStats.longestStreak, newStats.currentStreak);
        }
      } else if (emergencyOverride) {
        newStats.emergencyOverridesUsed += 1;
        newStats.emergencyOverridesRemaining = Math.max(0, newStats.emergencyOverridesRemaining - 1);
        
        // Break streak on emergency override
        newStats.currentStreak = 0;
      }
      
      // Update average session duration
      if (newStats.completedSessions > 0) {
        newStats.averageSessionDuration = Math.round(newStats.totalFocusTime / newStats.completedSessions);
      }
      
      // Update weekly progress (last 7 days)
      const weeklyProgress = [...newStats.weeklyProgress];
      const dayOfWeek = new Date().getDay();
      if (completed && isToday) {
        weeklyProgress[dayOfWeek] += actualDuration;
      }
      newStats.weeklyProgress = weeklyProgress;
      
      return newStats;
    });

    // Reset timer state
    setTimerState(defaultTimerState);
  };

  const updateTimerState = () => {
    if (!timerState.isActive) return;

    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
    const remaining = Math.max(0, timerState.duration - elapsed);

    if (remaining === 0) {
      stopTimer(true);
    } else {
      setTimerState(prev => ({
        ...prev,
        remainingTime: remaining
      }));
    }
  };

  const exportData = (type: 'sites' | 'stats') => {
    let data: any;
    let filename: string;

    if (type === 'sites') {
      data = blockedSites.map(site => ({
        url: site.url,
        category: site.category,
        blockedAt: new Date(site.blockedAt).toISOString(),
        timeSaved: site.timeSaved,
        blockCount: site.blockCount
      }));
      filename = `zenmode-blocked-sites-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      data = {
        stats,
        sessions: sessions.map(session => ({
          ...session,
          startTime: new Date(session.startTime).toISOString(),
          endTime: new Date(session.endTime).toISOString()
        }))
      };
      filename = `zenmode-statistics-${new Date().toISOString().split('T')[0]}.json`;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importSites = (sites: Omit<BlockedSite, 'id' | 'blockedAt' | 'timeSaved' | 'blockCount'>[]) => {
    const newSites = sites.map(site => ({
      ...site,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      blockedAt: Date.now(),
      timeSaved: 0,
      blockCount: 0
    }));
    setBlockedSites(prev => [...prev, ...newSites]);
  };

  return (
    <ZenModeContext.Provider value={{
      blockedSites,
      stats,
      timerState,
      sessions,
      addBlockedSite,
      removeBlockedSite,
      updateBlockedSite,
      startTimer,
      stopTimer,
      updateTimerState,
      exportData,
      importSites
    }}>
      {children}
    </ZenModeContext.Provider>
  );
}

export function useZenMode() {
  const context = useContext(ZenModeContext);
  if (context === undefined) {
    throw new Error('useZenMode must be used within a ZenModeProvider');
  }
  return context;
}