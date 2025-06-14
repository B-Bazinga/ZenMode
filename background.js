class ZenModeBackground {
  constructor() {
    this.timerState = {
      isActive: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      startTime: null
    };
    
    this.blockedSites = [];
    this.emergencyOverrides = 5;
    this.dailyReset = null;
    this.blockedTabs = new Map(); // Track blocked tabs
    
    this.init();
  }
  
  init() {
    this.setupMessageHandlers();
    this.setupAlarms();
    this.setupTabHandlers();
    this.loadStoredData();
    this.checkDailyReset();
    
    // Setup daily reset alarm
    chrome.alarms.create('dailyReset', {
      when: this.getNextMidnight(),
      periodInMinutes: 24 * 60 // 24 hours
    });
  }
  
  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }
  
  setupAlarms() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'timerTick') {
        this.handleTimerTick();
      } else if (alarm.name === 'dailyReset') {
        this.handleDailyReset();
      }
    });
  }
  
  setupTabHandlers() {
    // Track when tabs are created or updated
    chrome.tabs.onCreated.addListener((tab) => {
      this.checkAndTrackTab(tab);
    });
    
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url) {
        this.checkAndTrackTab(tab);
      }
    });
    
    // Clean up when tabs are closed
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.blockedTabs.delete(tabId);
    });
  }
  
  checkAndTrackTab(tab) {
    if (tab.url && this.isUrlBlocked(tab.url)) {
      this.blockedTabs.set(tab.id, {
        url: tab.url,
        originalUrl: tab.url,
        blockedAt: Date.now()
      });
    }
  }
  
  async loadStoredData() {
    try {
      const result = await chrome.storage.sync.get([
        'zenmode_timer_state',
        'zenmode_blocked_sites',
        'zenmode_emergency_overrides',
        'zenmode_daily_reset',
        'zenmode_blocked_sites_backup'
      ]);
      
      if (result.zenmode_timer_state) {
        this.timerState = result.zenmode_timer_state;
        
        // Check if timer should still be active
        if (this.timerState.isActive) {
          const elapsed = Math.floor((Date.now() - this.timerState.startTime) / 1000);
          this.timerState.remainingSeconds = Math.max(0, this.timerState.totalSeconds - elapsed);
          
          if (this.timerState.remainingSeconds <= 0) {
            this.completeTimer();
          } else {
            this.startTimer();
          }
        }
      }
      
      // Load blocked sites with fallback to backup
      if (result.zenmode_blocked_sites) {
        this.blockedSites = result.zenmode_blocked_sites;
      } else if (result.zenmode_blocked_sites_backup) {
        this.blockedSites = result.zenmode_blocked_sites_backup;
        console.log('Restored blocked sites from backup');
      }
      
      // Ensure blocked sites is always an array
      if (!Array.isArray(this.blockedSites)) {
        this.blockedSites = [];
      }
      
      this.updateBlockingRules();
      
      if (result.zenmode_emergency_overrides !== undefined) {
        this.emergencyOverrides = result.zenmode_emergency_overrides;
      }
      
      if (result.zenmode_daily_reset) {
        this.dailyReset = result.zenmode_daily_reset;
      }
      
      console.log(`Loaded ${this.blockedSites.length} blocked sites from storage`);
    } catch (error) {
      console.error('Error loading stored data:', error);
      // Initialize with empty array on error
      this.blockedSites = [];
    }
  }
  
  async saveData() {
    try {
      const dataToSave = {
        zenmode_timer_state: this.timerState,
        zenmode_blocked_sites: this.blockedSites,
        zenmode_emergency_overrides: this.emergencyOverrides,
        zenmode_daily_reset: this.dailyReset,
        zenmode_blocked_sites_backup: this.blockedSites, // Keep backup
        zenmode_last_save: Date.now()
      };
      
      await chrome.storage.sync.set(dataToSave);
      console.log(`Saved ${this.blockedSites.length} blocked sites to storage`);
    } catch (error) {
      console.error('Error saving data:', error);
      // Try local storage as fallback
      try {
        await chrome.storage.local.set({
          zenmode_blocked_sites_local: this.blockedSites,
          zenmode_last_local_save: Date.now()
        });
        console.log('Saved to local storage as fallback');
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
      }
    }
  }
  
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'startTimer':
          await this.handleStartTimer(message.duration);
          sendResponse({ success: true });
          break;
          
        case 'getTimerState':
          sendResponse(this.timerState);
          break;
          
        case 'timerComplete':
          await this.completeTimer();
          sendResponse({ success: true });
          break;
          
        case 'updateBlocklist':
          await this.updateBlocklist(message.sites);
          sendResponse({ success: true });
          break;
          
        case 'getBlockedSites':
          sendResponse({ sites: this.blockedSites });
          break;
          
        case 'addBlockedSite':
          await this.addBlockedSite(message.site);
          sendResponse({ success: true });
          break;
          
        case 'removeBlockedSite':
          await this.removeBlockedSite(message.siteId);
          sendResponse({ success: true });
          break;
          
        case 'exportBlockedSites':
          const exportData = await this.exportBlockedSites();
          sendResponse({ data: exportData });
          break;
          
        case 'importBlockedSites':
          await this.importBlockedSites(message.data);
          sendResponse({ success: true });
          break;
          
        case 'emergencyOverride':
          await this.handleEmergencyOverride(message.reason);
          sendResponse({ success: true });
          break;
          
        case 'checkBlocked':
          const isBlocked = this.isUrlBlocked(message.url);
          sendResponse({ blocked: isBlocked });
          break;
          
        case 'getEmergencyOverrides':
          sendResponse({ count: this.emergencyOverrides });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }
  
  async handleStartTimer(duration) {
    this.timerState = {
      isActive: true,
      totalSeconds: duration,
      remainingSeconds: duration,
      startTime: Date.now()
    };
    
    await this.saveData();
    this.startTimer();
    this.updateBlockingRules();
  }
  
  startTimer() {
    // Create alarm for timer ticks
    chrome.alarms.create('timerTick', {
      delayInMinutes: 0,
      periodInMinutes: 1/60 // Every second
    });
    
    // Update badge to show timer is active
    chrome.action.setBadgeText({ text: '🔒' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
  }
  
  handleTimerTick() {
    if (!this.timerState.isActive) {
      chrome.alarms.clear('timerTick');
      return;
    }
    
    const elapsed = Math.floor((Date.now() - this.timerState.startTime) / 1000);
    this.timerState.remainingSeconds = Math.max(0, this.timerState.totalSeconds - elapsed);
    
    if (this.timerState.remainingSeconds <= 0) {
      this.completeTimer();
    }
  }
  
  async completeTimer() {
    this.timerState.isActive = false;
    this.timerState.remainingSeconds = 0;
    
    // Clear timer alarm
    chrome.alarms.clear('timerTick');
    
    // Update badge
    chrome.action.setBadgeText({ text: '' });
    
    // Handle blocked tabs - close and reopen them
    await this.handleBlockedTabsOnCompletion();
    
    // Remove blocking rules
    await this.removeBlockingRules();
    
    // Save state
    await this.saveData();
    
    // Show completion notification (with fallback)
    try {
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'ZenMode - Session Complete!',
          message: 'Congratulations! You completed your focus session. Blocked tabs are now accessible.'
        });
      } else {
        console.log('ZenMode - Session Complete! Congratulations! You completed your focus session.');
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
  
  async handleBlockedTabsOnCompletion() {
    try {
      const tabsToReopen = [];
      
      // Collect information about blocked tabs
      for (const [tabId, tabInfo] of this.blockedTabs.entries()) {
        try {
          const tab = await chrome.tabs.get(tabId);
          if (tab && tab.url) {
            tabsToReopen.push({
              url: tabInfo.originalUrl,
              index: tab.index,
              windowId: tab.windowId,
              pinned: tab.pinned
            });
          }
        } catch (error) {
          // Tab might have been closed already
          console.log(`Tab ${tabId} no longer exists`);
        }
      }
      
      // Close blocked tabs and reopen them
      for (const [tabId] of this.blockedTabs.entries()) {
        try {
          await chrome.tabs.remove(tabId);
        } catch (error) {
          console.log(`Could not close tab ${tabId}:`, error);
        }
      }
      
      // Wait a moment before reopening
      setTimeout(async () => {
        for (const tabInfo of tabsToReopen) {
          try {
            await chrome.tabs.create({
              url: tabInfo.url,
              index: tabInfo.index,
              windowId: tabInfo.windowId,
              pinned: tabInfo.pinned
            });
          } catch (error) {
            console.error('Error reopening tab:', error);
          }
        }
      }, 500);
      
      // Clear blocked tabs tracking
      this.blockedTabs.clear();
      
      console.log(`Handled ${tabsToReopen.length} blocked tabs on timer completion`);
    } catch (error) {
      console.error('Error handling blocked tabs on completion:', error);
    }
  }
  
  async addBlockedSite(site) {
    if (!site || !site.url) {
      throw new Error('Invalid site data');
    }
    
    // Check if site already exists
    const exists = this.blockedSites.some(existing => existing.url === site.url);
    if (exists) {
      throw new Error('Site already blocked');
    }
    
    const newSite = {
      id: Date.now().toString(),
      url: site.url,
      category: site.category || 'other',
      addedAt: Date.now(),
      timesBlocked: 0
    };
    
    this.blockedSites.push(newSite);
    await this.saveData();
    
    if (this.timerState.isActive) {
      await this.updateBlockingRules();
    }
    
    console.log(`Added blocked site: ${newSite.url}`);
  }
  
  async removeBlockedSite(siteId) {
    const initialLength = this.blockedSites.length;
    this.blockedSites = this.blockedSites.filter(site => site.id !== siteId);
    
    if (this.blockedSites.length < initialLength) {
      await this.saveData();
      
      if (this.timerState.isActive) {
        await this.updateBlockingRules();
      }
      
      console.log(`Removed blocked site with ID: ${siteId}`);
    } else {
      throw new Error('Site not found');
    }
  }
  
  async updateBlocklist(sites) {
    if (!Array.isArray(sites)) {
      throw new Error('Sites must be an array');
    }
    
    this.blockedSites = sites;
    await this.saveData();
    
    if (this.timerState.isActive) {
      await this.updateBlockingRules();
    }
    
    console.log(`Updated blocklist with ${sites.length} sites`);
  }
  
  async exportBlockedSites() {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      sites: this.blockedSites.map(site => ({
        url: site.url,
        category: site.category,
        addedAt: site.addedAt,
        timesBlocked: site.timesBlocked
      }))
    };
    
    return exportData;
  }
  
  async importBlockedSites(importData) {
    try {
      if (!importData || !importData.sites || !Array.isArray(importData.sites)) {
        throw new Error('Invalid import data format');
      }
      
      const importedSites = importData.sites.map(site => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url: site.url,
        category: site.category || 'other',
        addedAt: site.addedAt || Date.now(),
        timesBlocked: site.timesBlocked || 0
      }));
      
      // Merge with existing sites, avoiding duplicates
      const existingUrls = new Set(this.blockedSites.map(site => site.url));
      const newSites = importedSites.filter(site => !existingUrls.has(site.url));
      
      this.blockedSites = [...this.blockedSites, ...newSites];
      await this.saveData();
      
      if (this.timerState.isActive) {
        await this.updateBlockingRules();
      }
      
      console.log(`Imported ${newSites.length} new sites (${importedSites.length - newSites.length} duplicates skipped)`);
      return { imported: newSites.length, skipped: importedSites.length - newSites.length };
    } catch (error) {
      console.error('Error importing sites:', error);
      throw error;
    }
  }
  
  async updateBlockingRules() {
    if (!this.timerState.isActive || this.blockedSites.length === 0) {
      return;
    }
    
    // Clear existing rules
    await this.removeBlockingRules();
    
    // Create new rules
    const rules = this.blockedSites.map((site, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site.url)
        }
      },
      condition: {
        urlFilter: this.createUrlFilter(site.url),
        resourceTypes: ['main_frame']
      }
    }));
    
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules
      });
      console.log(`Updated blocking rules for ${rules.length} sites`);
    } catch (error) {
      console.error('Error updating blocking rules:', error);
    }
  }
  
  async removeBlockingRules() {
    try {
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIds = existingRules.map(rule => rule.id);
      
      if (ruleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIds
        });
        console.log(`Removed ${ruleIds.length} blocking rules`);
      }
    } catch (error) {
      console.error('Error removing blocking rules:', error);
    }
  }
  
  createUrlFilter(url) {
    // Handle different URL patterns
    if (url.includes('*')) {
      return url;
    } else if (url.startsWith('*.')) {
      return url;
    } else if (url.includes('/')) {
      return `*://${url}*`;
    } else {
      return `*://*.${url}/*`;
    }
  }
  
  isUrlBlocked(url) {
    if (!this.timerState.isActive) {
      return false;
    }
    
    const domain = this.extractDomain(url);
    
    return this.blockedSites.some(site => {
      if (site.url.includes('*')) {
        const pattern = site.url.replace(/\*/g, '.*');
        const regex = new RegExp(pattern, 'i');
        return regex.test(url) || regex.test(domain);
      } else if (site.url.startsWith('*.')) {
        const baseDomain = site.url.substring(2);
        return domain.endsWith(baseDomain);
      } else if (site.url.includes('/')) {
        return url.includes(site.url) || domain.includes(site.url);
      } else {
        return domain.includes(site.url);
      }
    });
  }
  
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
  
  async handleEmergencyOverride(reason) {
    if (this.emergencyOverrides <= 0) {
      throw new Error('No emergency overrides remaining');
    }
    
    this.emergencyOverrides--;
    
    // Log the override
    const overrideLog = {
      timestamp: Date.now(),
      reason: reason,
      remainingTime: this.timerState.remainingSeconds
    };
    
    // End timer
    this.timerState.isActive = false;
    chrome.alarms.clear('timerTick');
    
    // Handle blocked tabs
    await this.handleBlockedTabsOnCompletion();
    
    // Remove blocking rules
    await this.removeBlockingRules();
    
    // Update badge
    chrome.action.setBadgeText({ text: '' });
    
    // Save state
    await this.saveData();
    
    // Show notification (with fallback)
    try {
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'ZenMode - Emergency Override Used',
          message: `Override reason: ${reason.substring(0, 50)}...`
        });
      } else {
        console.log(`ZenMode - Emergency Override Used: ${reason.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
  
  checkDailyReset() {
    const today = new Date().toDateString();
    
    if (this.dailyReset !== today) {
      this.handleDailyReset();
    }
  }
  
  async handleDailyReset() {
    this.emergencyOverrides = 5;
    this.dailyReset = new Date().toDateString();
    
    await this.saveData();
    
    console.log('Daily reset completed - emergency overrides restored');
  }
  
  getNextMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
  }
}

// Initialize background script
const zenModeBackground = new ZenModeBackground();

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ZenMode extension installed');
  } else if (details.reason === 'update') {
    console.log('ZenMode extension updated');
  }
});