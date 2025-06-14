class ZenModeBlocked {
  constructor() {
    this.quotes = [
      { text: "The successful warrior is the average person with laser-like focus.", author: "Bruce Lee" },
      { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
      { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
      { text: "The shorter way to do many things is to only do one thing at a time.", author: "Mozart" },
      { text: "Most people have no idea of the giant capacity we can immediately command when we focus all of our resources on mastering a single area of our lives.", author: "Tony Robbins" },
      { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
      { text: "The art of being wise is knowing what to overlook.", author: "William James" },
      { text: "Lack of direction, not lack of time, is the problem. We all have twenty-four hour days.", author: "Zig Ziglar" },
      { text: "Successful people maintain a positive focus in life no matter what is going on around them.", author: "Jack Canfield" },
      { text: "The key to success is to focus our conscious mind on things we desire not things we fear.", author: "Brian Tracy" }
    ];
    this.reloadScheduled = false;
    this.initialized = false; // Prevent double init
    this.init();
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.displayBlockedSite();
    this.displayRandomQuote();
    this.setupEventListeners();
    this.updateTimer();
    this.updateOverrideCount();
    this.preventBypass();
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  displayBlockedSite() {
    const params = new URLSearchParams(window.location.search);
    const blockedSite = params.get('site') || window.location.hostname || 'Unknown Site';
    document.getElementById('blockedSite').textContent = blockedSite;
  }

  displayRandomQuote() {
    const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    document.getElementById('motivationalQuote').textContent = `"${randomQuote.text}"`;
    document.getElementById('quoteAuthor').textContent = `— ${randomQuote.author}`;
  }

  setupEventListeners() {
    const emergencyBtn = document.getElementById('emergencyBtn');
    if (emergencyBtn) {
      emergencyBtn.addEventListener('click', () => this.handleEmergencyOverride());
    }
    const goBackBtn = document.getElementById('goBackBtn');
    if (goBackBtn) {
      goBackBtn.addEventListener('click', () => window.history.back());
    }
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'redirectToOriginal' && message.url) {
        window.location.href = message.url;
      }
    });
  }

  async updateTimer() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      const timerDisplay = document.getElementById('timerDisplay');
      if (!timerDisplay) return;
      if (response && response.isActive) {
        const elapsed = Math.floor((Date.now() - response.startTime) / 1000);
        const remaining = Math.max(0, response.totalSeconds - elapsed);
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} remaining`;
        if (remaining <= 0 && !this.reloadScheduled) {
          this.reloadScheduled = true;
          setTimeout(() => window.location.reload(), 2000);
        }
      } else {
        timerDisplay.textContent = 'Session ended';
        if (!this.reloadScheduled) {
          this.reloadScheduled = true;
          setTimeout(() => window.location.reload(), 2000);
        }
      }
    } catch {
      const timerDisplay = document.getElementById('timerDisplay');
      if (timerDisplay) timerDisplay.textContent = 'Timer unavailable';
    }
  }

  async updateOverrideCount() {
    try {
      const result = await chrome.storage.sync.get(['zenmode_emergency_overrides']);
      const count = result.zenmode_emergency_overrides !== undefined ? result.zenmode_emergency_overrides : 5;
      const overrideCount = document.getElementById('overrideCount');
      if (overrideCount) overrideCount.textContent = count;
      const emergencyBtn = document.getElementById('emergencyBtn');
      if (emergencyBtn && count <= 0) {
        emergencyBtn.disabled = true;
        emergencyBtn.style.opacity = '0.5';
        emergencyBtn.style.cursor = 'not-allowed';
        emergencyBtn.textContent = '⚡ No Overrides Left';
      }
    } catch {
      // Silently fail
    }
  }

  async handleEmergencyOverride() {
    const result = await chrome.storage.sync.get(['zenmode_emergency_overrides']);
    const count = result.zenmode_emergency_overrides !== undefined ? result.zenmode_emergency_overrides : 5;
    if (count <= 0) {
      alert('No emergency overrides remaining today. Focus session will continue.');
      return;
    }
    const confirmMessage = `Are you sure you want to use an emergency override?\n\n` +
      `This will:\n` +
      `• End your current focus session\n` +
      `• Use 1 of your ${count} remaining daily overrides\n` +
      `• Require you to provide a detailed reason\n\n` +
      `Click OK to proceed to the override form.`;
    if (confirm(confirmMessage)) {
      try {
        await chrome.runtime.sendMessage({ action: 'openEmergencyOverride' });
        window.open(chrome.runtime.getURL('popup.html'), '_blank', 'width=400,height=600');
      } catch {
        alert('Unable to open emergency override form. Please click the ZenMode extension icon in your browser toolbar.');
      }
    }
  }

  preventBypass() {
    // Block common developer tools shortcuts
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });
    // Block right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    // Prevent text selection
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    });
    // Block drag and drop
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });

    // Improved devtools detection
    let devtoolsOpen = false;
    const threshold = 160;
    setInterval(() => {
      const heightDiff = window.outerHeight - window.innerHeight;
      const widthDiff = window.outerWidth - window.innerWidth;
      const detected = heightDiff > threshold || widthDiff > threshold;
      if (detected && !devtoolsOpen) {
        devtoolsOpen = true;
        console.clear();
        console.log('%cZenMode: Developer tools detected. Please close them to maintain focus.',
          'color: #dc2626; font-size: 16px; font-weight: bold;');
      } else if (!detected && devtoolsOpen) {
        devtoolsOpen = false;
      }
    }, 500);

    // Clear console periodically
    setInterval(() => {
      console.clear();
    }, 3000);

    // Override console methods (safer: only if not already overridden)
    [
      'log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml',
      'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'
    ].forEach(method => {
      if (typeof console[method] === 'function') {
        console[method] = () => {};
      }
    });
  }
}

// Debounced initialization to avoid double init
function zenModeInitOnce() {
  if (!window.__zenModeBlockedInit) {
    window.__zenModeBlockedInit = true;
    new ZenModeBlocked();
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', zenModeInitOnce);
} else {
  zenModeInitOnce();
}