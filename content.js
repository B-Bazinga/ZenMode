class ZenModeContent {
  constructor() {
    this.isBlocked = false;
    this.checkUrl();
  }
  
  async checkUrl() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'checkBlocked',
        url: window.location.href
      });
      
      if (response && response.blocked) {
        this.blockPage();
      }
    } catch (error) {
      console.error('Error checking if URL is blocked:', error);
    }
  }
  
  blockPage() {
    if (this.isBlocked) return;
    
    this.isBlocked = true;
    
    // Stop page loading
    window.stop();
    
    // Replace page content
    document.documentElement.innerHTML = this.createBlockedPageHTML();
    
    // Setup blocked page functionality
    this.setupBlockedPage();
  }
  
  createBlockedPageHTML() {
    const params = new URLSearchParams(window.location.search);
    const blockedSite = params.get('site') || window.location.hostname;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Site Blocked - ZenMode</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #171717 100%);
            color: #fafafa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            padding: 40px;
            text-align: center;
          }
          
          .icon {
            width: 80px;
            height: 80px;
            background: #262626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 32px;
            font-size: 32px;
          }
          
          h1 {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #fafafa;
          }
          
          .blocked-site {
            font-size: 18px;
            color: #dc2626;
            font-weight: 500;
            margin-bottom: 24px;
            padding: 12px 24px;
            background: rgba(220, 38, 38, 0.1);
            border: 1px solid rgba(220, 38, 38, 0.2);
            border-radius: 8px;
            display: inline-block;
          }
          
          .message {
            font-size: 16px;
            color: #a3a3a3;
            margin-bottom: 32px;
            line-height: 1.7;
          }
          
          .timer-info {
            background: #171717;
            border: 1px solid #262626;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          
          .timer-status {
            font-size: 14px;
            color: #a3a3a3;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          
          .timer-display {
            font-size: 24px;
            font-weight: 600;
            color: #fafafa;
            margin-bottom: 16px;
            font-family: 'Inter Tight', monospace;
          }
          
          .overrides-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            font-size: 14px;
            color: #a3a3a3;
          }
          
          .override-count {
            background: #dc2626;
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 12px;
            font-weight: 500;
          }
          
          .quote-section {
            background: #1a1a1a;
            border: 1px solid #404040;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          
          .quote {
            font-size: 18px;
            font-style: italic;
            color: #fafafa;
            margin-bottom: 12px;
            line-height: 1.6;
          }
          
          .quote-author {
            font-size: 14px;
            color: #a3a3a3;
          }
          
          .actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .btn {
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          
          .btn-secondary {
            background: #171717;
            color: #a3a3a3;
            border: 1px solid #262626;
          }
          
          .btn-secondary:hover {
            background: #262626;
            color: #fafafa;
          }
          
          .btn-danger {
            background: transparent;
            color: #dc2626;
            border: 1px solid #dc2626;
          }
          
          .btn-danger:hover {
            background: #dc2626;
            color: #ffffff;
          }
          
          .footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 1px solid #262626;
            font-size: 12px;
            color: #525252;
          }
          
          @media (max-width: 640px) {
            .container {
              padding: 24px;
            }
            
            h1 {
              font-size: 24px;
            }
            
            .blocked-site {
              font-size: 16px;
            }
            
            .actions {
              flex-direction: column;
            }
            
            .btn {
              width: 100%;
              justify-content: center;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔒</div>
          
          <h1>Site Blocked</h1>
          
          <div class="blocked-site">${blockedSite}</div>
          
          <div class="message">
            This website is blocked during your focus session. Stay concentrated on your goals and resist the urge to browse distracting content.
          </div>
          
          <div class="timer-info">
            <div class="timer-status">Focus Session</div>
            <div class="timer-display" id="timerDisplay">Loading...</div>
            <div class="overrides-info">
              <span>Emergency overrides remaining:</span>
              <span class="override-count" id="overrideCount">5</span>
            </div>
          </div>
          
          <div class="quote-section">
            <div class="quote" id="motivationalQuote">
              "The successful warrior is the average person with laser-like focus."
            </div>
            <div class="quote-author" id="quoteAuthor">— Bruce Lee</div>
          </div>
          
          <div class="actions">
            <button class="btn btn-secondary" onclick="window.history.back()">
              ← Go Back
            </button>
            <button class="btn btn-danger" id="emergencyBtn">
              ⚡ Emergency Override
            </button>
          </div>
          
          <div class="footer">
            ZenMode • Stay focused, stay productive
          </div>
        </div>
        
        <script>
          // Motivational quotes
          const quotes = [
            { text: "The successful warrior is the average person with laser-like focus.", author: "Bruce Lee" },
            { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
            { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
            { text: "The shorter way to do many things is to only do one thing at a time.", author: "Mozart" },
            { text: "Most people have no idea of the giant capacity we can immediately command when we focus all of our resources on mastering a single area of our lives.", author: "Tony Robbins" },
            { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
            { text: "The art of being wise is knowing what to overlook.", author: "William James" },
            { text: "Lack of direction, not lack of time, is the problem. We all have twenty-four hour days.", author: "Zig Ziglar" }
          ];
          
          // Display random quote
          const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
          document.getElementById('motivationalQuote').textContent = randomQuote.text;
          document.getElementById('quoteAuthor').textContent = '— ' + randomQuote.author;
          
          // Update timer display
          async function updateTimer() {
            try {
              const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
              if (response && response.isActive) {
                const elapsed = Math.floor((Date.now() - response.startTime) / 1000);
                const remaining = Math.max(0, response.totalSeconds - elapsed);
                
                const hours = Math.floor(remaining / 3600);
                const minutes = Math.floor((remaining % 3600) / 60);
                const seconds = remaining % 60;
                
                const timeString = hours.toString().padStart(2, '0') + ':' + 
                         minutes.toString().padStart(2, '0') + ':' + 
                         seconds.toString().padStart(2, '0');
                
                document.getElementById('timerDisplay').textContent = timeString + ' remaining';
              } else {
                document.getElementById('timerDisplay').textContent = 'Session ended';
                // Refresh page after a delay
                setTimeout(() => window.location.reload(), 2000);
              }
            } catch (error) {
              console.error('Error updating timer:', error);
              document.getElementById('timerDisplay').textContent = 'Timer unavailable';
            }
          }
          
          // Update emergency override count
          async function updateOverrideCount() {
            try {
              const result = await chrome.storage.sync.get(['zenmode_emergency_overrides']);
              const count = result.zenmode_emergency_overrides || 5;
              document.getElementById('overrideCount').textContent = count;
              
              if (count <= 0) {
                document.getElementById('emergencyBtn').disabled = true;
                document.getElementById('emergencyBtn').style.opacity = '0.5';
                document.getElementById('emergencyBtn').style.cursor = 'not-allowed';
              }
            } catch (error) {
              console.error('Error updating override count:', error);
            }
          }
          
          // Emergency override handler
          document.getElementById('emergencyBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to use an emergency override? This will end your focus session and count against your daily limit.')) {
              window.location.href = 'chrome-extension://' + chrome.runtime.id + '/popup.html';
            }
          });
          
          // Update timer every second
          updateTimer();
          updateOverrideCount();
          setInterval(updateTimer, 1000);
          
          // Prevent navigation attempts
          window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = 'Your focus session is still active. Are you sure you want to leave?';
          });
          
          // Block common bypass attempts
          document.addEventListener('keydown', (e) => {
            // Block F12, Ctrl+Shift+I, Ctrl+U, etc.
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'u')) {
              e.preventDefault();
              return false;
            }
          });
          
          // Block right-click context menu
          document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
          });
        </script>
      </body>
      </html>
    `;
  }
  
  setupBlockedPage() {
    // Additional security measures can be added here
    // Already included in the HTML above
  }
}

// Only initialize if not already blocked
if (!window.zenModeBlocked) {
  window.zenModeBlocked = true;
  new ZenModeContent();
}