class ZenModePopup {
  constructor() {
    this.timerState = {
      isActive: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      startTime: null
    };
    
    this.stats = {
      todayFocus: 0,
      weekStreak: 0,
      totalSessions: 0,
      emergencyOverrides: 5
    };
    
    this.blockedSites = [];
    this.categories = [
      { id: 'social', name: 'Social Media', count: 0 },
      { id: 'entertainment', name: 'Entertainment', count: 0 },
      { id: 'news', name: 'News', count: 0 },
      { id: 'shopping', name: 'Shopping', count: 0 }
    ];
    
    this.currentTab = 'timer';
    this.progressCircle = null;
    this.countdownInterval = null;
    this.overrideCountdown = null;
    
    this.init();
  }
  
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.setupProgressRing();
    this.updateUI();
    this.checkTimerState();
    
    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        this.handleStartTimer();
      }
    });
  }
  
  async loadData() {
    try {
      // Load blocked sites from background script
      const sitesResponse = await chrome.runtime.sendMessage({ action: 'getBlockedSites' });
      if (sitesResponse && sitesResponse.sites) {
        this.blockedSites = sitesResponse.sites;
      }
      
      // Load emergency overrides count
      const overridesResponse = await chrome.runtime.sendMessage({ action: 'getEmergencyOverrides' });
      if (overridesResponse && overridesResponse.count !== undefined) {
        this.stats.emergencyOverrides = overridesResponse.count;
      }
      
      // Load other data from storage
      const result = await chrome.storage.sync.get([
        'zenmode_timer_state',
        'zenmode_stats',
        'zenmode_categories'
      ]);
      
      if (result.zenmode_timer_state) {
        this.timerState = result.zenmode_timer_state;
      }
      
      if (result.zenmode_stats) {
        this.stats = { ...this.stats, ...result.zenmode_stats };
      }
      
      if (result.zenmode_categories) {
        this.categories = result.zenmode_categories;
      }
      
      this.updateCategoryCounts();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
  
  async saveData() {
    try {
      await chrome.storage.sync.set({
        zenmode_timer_state: this.timerState,
        zenmode_stats: this.stats,
        zenmode_categories: this.categories
      });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
  
  setupEventListeners() {
    // Timer controls
    document.getElementById('startBtn').addEventListener('click', () => this.handleStartTimer());
    document.getElementById('emergencyBtn').addEventListener('click', () => this.showEmergencyModal());
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setPreset(parseInt(e.target.dataset.time)));
    });
    
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // Blocklist functionality
    document.getElementById('addSiteBtn').addEventListener('click', () => this.addSite());
    document.getElementById('importBtn').addEventListener('click', () => this.importCSV());
    document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());
    
    // Modal controls
    document.getElementById('cancelOverride').addEventListener('click', () => this.hideEmergencyModal());
    document.getElementById('confirmOverride').addEventListener('click', () => this.confirmEmergencyOverride());
    
    // Override reason textarea
    const reasonTextarea = document.getElementById('overrideReason');
    reasonTextarea.addEventListener('input', () => this.updateOverrideButton());
    
    // File input for CSV import
    document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileImport(e));
    
    // Site input enter key
    document.getElementById('siteInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addSite();
    });
  }
  
  setupProgressRing() {
    this.progressCircle = document.getElementById('progressCircle');
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    this.progressCircle.style.strokeDasharray = circumference;
    this.progressCircle.style.strokeDashoffset = circumference;
  }
  
  updateProgressRing(percentage) {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    this.progressCircle.style.strokeDashoffset = offset;
  }
  
  async checkTimerState() {
    // Check if timer is active in background
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      if (response && response.isActive) {
        this.timerState = response;
        this.showActiveTimer();
        this.startCountdown();
      }
    } catch (error) {
      console.error('Error checking timer state:', error);
    }
  }
  
  setPreset(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    document.getElementById('hoursInput').value = hours;
    document.getElementById('minutesInput').value = minutes;
    document.getElementById('secondsInput').value = secs;
    
    // Update preset button active state
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.time) === seconds);
    });
  }
  
  async handleStartTimer() {
    if (this.timerState.isActive) return;
    
    const hours = parseInt(document.getElementById('hoursInput').value) || 0;
    const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
    const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    
    if (totalSeconds === 0) {
      alert('Please set a timer duration');
      return;
    }
    
    // Send start command to background script
    try {
      await chrome.runtime.sendMessage({
        action: 'startTimer',
        duration: totalSeconds
      });
      
      this.timerState = {
        isActive: true,
        totalSeconds: totalSeconds,
        remainingSeconds: totalSeconds,
        startTime: Date.now()
      };
      
      await this.saveData();
      this.showActiveTimer();
      this.startCountdown();
      
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Failed to start timer. Please try again.');
    }
  }
  
  showActiveTimer() {
    document.getElementById('timerControls').classList.add('hidden');
    document.getElementById('timerActive').classList.remove('hidden');
    document.getElementById('sessionStatus').textContent = 'Active';
    document.getElementById('sessionStatus').classList.add('active');
    document.getElementById('overrideCount').textContent = this.stats.emergencyOverrides;
  }
  
  hideActiveTimer() {
    document.getElementById('timerControls').classList.remove('hidden');
    document.getElementById('timerActive').classList.add('hidden');
    document.getElementById('sessionStatus').textContent = 'Ready';
    document.getElementById('sessionStatus').classList.remove('active');
  }
  
  startCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    this.countdownInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
    
    this.updateTimer(); // Initial update
  }
  
  updateTimer() {
    if (!this.timerState.isActive) {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      return;
    }
    
    const elapsed = Math.floor((Date.now() - this.timerState.startTime) / 1000);
    this.timerState.remainingSeconds = Math.max(0, this.timerState.totalSeconds - elapsed);
    
    if (this.timerState.remainingSeconds <= 0) {
      this.completeTimer();
      return;
    }
    
    // Update display
    const timeString = this.formatTime(this.timerState.remainingSeconds);
    document.getElementById('timeDisplay').textContent = timeString;
    document.getElementById('timerLabel').textContent = 'Remaining';
    
    // Update progress ring
    const progress = ((this.timerState.totalSeconds - this.timerState.remainingSeconds) / this.timerState.totalSeconds) * 100;
    this.updateProgressRing(progress);
  }
  
  async completeTimer() {
    this.timerState.isActive = false;
    this.timerState.remainingSeconds = 0;
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    
    // Update stats
    this.stats.totalSessions++;
    this.stats.todayFocus += Math.floor(this.timerState.totalSeconds / 60); // Convert to minutes
    
    // Reset UI
    this.hideActiveTimer();
    document.getElementById('timeDisplay').textContent = '00:00:00';
    document.getElementById('timerLabel').textContent = 'Completed!';
    this.updateProgressRing(100);
    
    // Send completion message to background
    try {
      await chrome.runtime.sendMessage({ action: 'timerComplete' });
    } catch (error) {
      console.error('Error notifying timer completion:', error);
    }
    
    await this.saveData();
    this.updateUI();
    
    // Show completion notification
    setTimeout(() => {
      document.getElementById('timerLabel').textContent = 'Set Timer';
      this.updateProgressRing(0);
    }, 3000);
  }
  
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    if (tabName === 'timer') {
      // Timer tab is always visible, just hide others
    } else {
      document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    }
    
    this.currentTab = tabName;
    
    // Update content based on tab
    if (tabName === 'blocklist') {
      this.updateBlocklistUI();
    } else if (tabName === 'achievements') {
      this.updateAchievementsUI();
    }
  }
  
  updateUI() {
    // Update stats display
    document.getElementById('todayFocus').textContent = this.formatDuration(this.stats.todayFocus);
    document.getElementById('weekStreak').textContent = this.stats.weekStreak;
    document.getElementById('totalSessions').textContent = this.stats.totalSessions;
  }
  
  updateBlocklistUI() {
    this.updateCategoryList();
    this.updateBlockedSitesList();
    this.updateCategorySelect();
  }
  
  updateCategoryList() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    
    this.categories.forEach(category => {
      const categoryTag = document.createElement('div');
      categoryTag.className = 'category-tag';
      categoryTag.innerHTML = `
        ${category.name}
        <span class="category-count">${category.count}</span>
      `;
      categoryList.appendChild(categoryTag);
    });
  }
  
  updateCategorySelect() {
    const select = document.getElementById('categorySelect');
    select.innerHTML = '';
    
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      select.appendChild(option);
    });
    
    // Add custom option
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom';
    select.appendChild(customOption);
  }
  
  updateBlockedSitesList() {
    const container = document.getElementById('blockedSites');
    container.innerHTML = '';
    
    if (this.blockedSites.length === 0) {
      container.innerHTML = '<p style="color: #a3a3a3; text-align: center; padding: 20px;">No blocked sites yet</p>';
      return;
    }
    
    this.blockedSites.forEach((site) => {
      const siteItem = document.createElement('div');
      siteItem.className = 'site-item';
      siteItem.innerHTML = `
        <div class="site-info">
          <div class="site-url">${site.url}</div>
          <div class="site-category">${site.category}</div>
        </div>
        <button class="remove-btn" data-id="${site.id}">Remove</button>
      `;
      
      siteItem.querySelector('.remove-btn').addEventListener('click', () => {
        this.removeSite(site.id);
      });
      
      container.appendChild(siteItem);
    });
  }
  
  updateCategoryCounts() {
    this.categories.forEach(category => {
      category.count = this.blockedSites.filter(site => site.category === category.id).length;
    });
  }
  
  async addSite() {
    const siteInput = document.getElementById('siteInput');
    const categorySelect = document.getElementById('categorySelect');
    
    const url = siteInput.value.trim();
    const category = categorySelect.value;
    
    if (!url) {
      alert('Please enter a website URL');
      return;
    }
    
    // Basic URL validation and formatting
    let formattedUrl = url;
    if (!formattedUrl.includes('.')) {
      alert('Please enter a valid domain (e.g., example.com)');
      return;
    }
    
    // Remove protocol if present
    formattedUrl = formattedUrl.replace(/^https?:\/\//, '');
    
    try {
      // Add site via background script
      await chrome.runtime.sendMessage({
        action: 'addBlockedSite',
        site: {
          url: formattedUrl,
          category: category
        }
      });
      
      // Reload blocked sites
      await this.loadData();
      this.updateBlocklistUI();
      
      // Clear input
      siteInput.value = '';
      
      alert('Site added successfully!');
    } catch (error) {
      console.error('Error adding site:', error);
      alert(error.message || 'Failed to add site');
    }
  }
  
  async removeSite(siteId) {
    try {
      await chrome.runtime.sendMessage({
        action: 'removeBlockedSite',
        siteId: siteId
      });
      
      // Reload blocked sites
      await this.loadData();
      this.updateBlocklistUI();
      
    } catch (error) {
      console.error('Error removing site:', error);
      alert('Failed to remove site');
    }
  }
  
  async importCSV() {
    document.getElementById('fileInput').click();
  }
  
  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      let importData;
      
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        importData = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if present
        let startIndex = 0;
        if (lines[0] && (lines[0].toLowerCase().includes('url') || lines[0].toLowerCase().includes('site'))) {
          startIndex = 1;
        }
        
        const sites = [];
        for (let i = startIndex; i < lines.length; i++) {
          const [url, category] = lines[i].split(',').map(item => item.trim().replace(/"/g, ''));
          if (url) {
            sites.push({
              url: url,
              category: category || 'other'
            });
          }
        }
        
        importData = { sites };
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }
      
      // Import via background script
      const result = await chrome.runtime.sendMessage({
        action: 'importBlockedSites',
        data: importData
      });
      
      // Reload blocked sites
      await this.loadData();
      this.updateBlocklistUI();
      
      alert('Sites imported successfully!');
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Failed to import file: ' + error.message);
    }
    
    // Reset file input
    event.target.value = '';
  }
  
  async exportCSV() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'exportBlockedSites' });
      
      if (!response || !response.data) {
        alert('No data to export');
        return;
      }
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenmode-blocked-sites-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  }
  
  updateAchievementsUI() {
    // Update detailed stats
    document.getElementById('totalFocusTime').textContent = this.formatDuration(this.stats.todayFocus * 7); // Rough estimate
    document.getElementById('avgSession').textContent = this.stats.totalSessions > 0 ? 
      `${Math.round((this.stats.todayFocus * 7) / this.stats.totalSessions)}m` : '0m';
    document.getElementById('longestStreak').textContent = `${this.stats.weekStreak} days`;
    document.getElementById('overridesUsed').textContent = `${5 - this.stats.emergencyOverrides}/5 today`;
    document.getElementById('sitesBlocked').textContent = this.blockedSites.length;
  }
  
  showEmergencyModal() {
    if (this.stats.emergencyOverrides <= 0) {
      alert('No emergency overrides remaining today');
      return;
    }
    
    document.getElementById('emergencyModal').classList.remove('hidden');
    document.getElementById('remainingOverrides').textContent = this.stats.emergencyOverrides;
    
    // Start countdown
    let countdown = 30;
    document.getElementById('overrideCountdown').textContent = countdown;
    
    this.overrideCountdown = setInterval(() => {
      countdown--;
      document.getElementById('overrideCountdown').textContent = countdown;
      
      if (countdown <= 0) {
        clearInterval(this.overrideCountdown);
        this.overrideCountdown = null;
        this.hideEmergencyModal();
      }
    }, 1000);
  }
  
  hideEmergencyModal() {
    document.getElementById('emergencyModal').classList.add('hidden');
    document.getElementById('overrideReason').value = '';
    document.getElementById('charCount').textContent = '0';
    this.updateOverrideButton();
    
    if (this.overrideCountdown) {
      clearInterval(this.overrideCountdown);
      this.overrideCountdown = null;
    }
  }
  
  updateOverrideButton() {
    const reason = document.getElementById('overrideReason').value;
    const charCount = reason.length;
    const confirmBtn = document.getElementById('confirmOverride');
    
    document.getElementById('charCount').textContent = charCount;
    
    if (charCount >= 50) {
      confirmBtn.classList.remove('disabled');
      confirmBtn.disabled = false;
    } else {
      confirmBtn.classList.add('disabled');
      confirmBtn.disabled = true;
    }
  }
  
  async confirmEmergencyOverride() {
    const reason = document.getElementById('overrideReason').value;
    
    if (reason.length < 50) {
      alert('Please provide a detailed reason (minimum 50 characters)');
      return;
    }
    
    try {
      // Send override to background script
      await chrome.runtime.sendMessage({
        action: 'emergencyOverride',
        reason: reason
      });
      
      // Update local state
      this.stats.emergencyOverrides--;
      this.timerState.isActive = false;
      
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      
      // Save and update UI
      await this.saveData();
      this.hideActiveTimer();
      this.hideEmergencyModal();
      this.updateUI();
      
      alert('Emergency override activated. Focus session ended.');
    } catch (error) {
      console.error('Error processing emergency override:', error);
      alert('Failed to process emergency override');
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ZenModePopup();
});