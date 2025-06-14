# ZenMode - Chrome Productivity Extension

ZenMode is a strict focus and productivity extension for Chrome that implements uninterruptible timers and comprehensive website blocking to help you maintain deep focus sessions.

## 🎯 Key Features

### Strict Timer System
- **Uninterruptible Focus Sessions**: Once started, timers cannot be paused or stopped
- **Visual Progress Tracking**: Animated SVG progress ring showing remaining time
- **Flexible Duration**: Set custom times or use Pomodoro presets (25/5, 50/10 minutes)
- **Persistent State**: Timer continues running even if browser is closed and reopened
- **Keyboard Shortcuts**: Press Space to start timer quickly

### Advanced Website Blocking
- **Pattern-Based Blocking**: Support for domain.com/*, *.domain.com, and exact URLs
- **Category Management**: Organize blocked sites into Social, Entertainment, News, Shopping, etc.
- **CSV Import/Export**: Bulk manage your blocklist with CSV files
- **Real-time Blocking**: Sites are blocked immediately when timer is active

### Emergency Override System
- **Limited Daily Overrides**: Only 5 emergency overrides per day
- **Mandatory Reasoning**: Must provide detailed reason (minimum 50 characters)
- **Countdown Protection**: 30-second countdown before override is activated
- **Usage Tracking**: Monitor and track override usage patterns

### Achievement & Progress Tracking
- **Focus Statistics**: Track daily focus time, session counts, and streaks
- **Achievement System**: Unlock badges for completing focus milestones
- **Progress Visualization**: Visual progress bars and statistics
- **Long-term Analytics**: Week and month-level focus tracking

## 🚀 Installation

### Manual Installation (Developer Mode)

1. **Download the Extension**
   - Clone or download this repository
   - Extract files to a local folder

2. **Enable Developer Mode**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The ZenMode icon should appear in your extensions toolbar

4. **Pin the Extension**
   - Click the extensions puzzle icon in Chrome toolbar
   - Pin ZenMode for easy access

## 📋 Usage Guide

### Starting a Focus Session

1. **Set Your Timer**
   - Click the ZenMode extension icon
   - Set hours, minutes, and seconds using input fields
   - Or click a preset button (25 min, 5 min, 50 min, 10 min)

2. **Review the Warning**
   - Read the "Point of No Return" warning carefully
   - Understand that the timer cannot be paused once started

3. **Start Session**
   - Click "Start Focus Session" or press Space
   - Timer begins immediately and cannot be stopped

### Managing Blocked Sites

1. **Add Individual Sites**
   - Go to the "Blocklist" tab in the extension popup
   - Enter the domain (e.g., `facebook.com`, `*.reddit.com`, `youtube.com/watch*`)
   - Select a category
   - Click "Add"

2. **Import from CSV**
   - Click "Import CSV" in the Blocklist tab
   - Upload a CSV file with format: `URL,Category`
   - Example:
     ```
     facebook.com,social
     twitter.com,social
     youtube.com,entertainment
     ```

3. **Export Your List**
   - Click "Export CSV" to download your current blocklist
   - Use this for backups or sharing between devices

### Using Emergency Overrides

⚠️ **Use Sparingly** - You only get 5 per day!

1. **During Active Session**
   - If you encounter a truly urgent need to access a blocked site
   - Click "Emergency Override" on the blocked page or in the popup

2. **Provide Detailed Reason**
   - Enter at least 50 characters explaining why this is urgent
   - Be honest - this helps you reflect on your browsing habits

3. **Wait for Countdown**
   - 30-second countdown ensures you're making a deliberate choice
   - Use this time to reconsider if it's truly necessary

4. **Override Activated**
   - Your focus session ends immediately
   - One override is deducted from your daily allowance
   - Blocked sites become accessible until you start a new session

## 🔧 Technical Implementation

### Architecture Overview

- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background script handles timer logic and blocking rules
- **Content Scripts**: Inject blocking functionality into web pages
- **Chrome Storage**: Sync data across devices with Chrome account
- **Declarative Net Request**: Efficient website blocking without performance impact

### Security Features

- **Timer Integrity**: Protected against tampering and bypass attempts
- **Block Page Security**: Prevents common developer tools bypass methods
- **Data Encryption**: Local storage is encrypted for privacy
- **Audit Logging**: All override usage is logged for analysis

### Performance Optimizations

- **Efficient Blocking**: Uses Chrome's native blocking APIs
- **Minimal Resource Usage**: Lightweight background processing
- **Smart Sync**: Only syncs data when necessary
- **Offline Support**: Core functionality works without internet

## 🛡️ Privacy & Security

### Data Collection
- **No Analytics**: ZenMode doesn't send usage data to external servers
- **Local Storage**: All data stored locally and synced via Chrome
- **No Tracking**: Extension doesn't track your browsing habits
- **Minimal Permissions**: Only requests necessary Chrome permissions

### Data Protection
- **Encrypted Storage**: Sensitive data is encrypted locally
- **Secure Sync**: Uses Chrome's secure sync infrastructure
- **Data Deletion**: Complete data removal available in settings
- **Backup System**: Automated local backups of your settings

## 🎨 Customization

### Theme Options
- **Dark Mode**: Default black and white theme for minimal distraction
- **Custom Colors**: Modify CSS variables for personalized appearance
- **Font Preferences**: Change to your preferred monospace font for timer

### Behavioral Settings
- **Custom Presets**: Add your own timer duration presets
- **Block Categories**: Create custom categories for site organization
- **Notification Preferences**: Configure completion and override notifications

## 🔧 Troubleshooting

### Timer Not Working
1. Check if Chrome has permission to run in background
2. Ensure extension is not disabled in Chrome settings
3. Try restarting Chrome and reloading the extension

### Sites Not Blocking
1. Verify the site URL pattern is correct
2. Check if emergency override was recently used
3. Ensure timer is actually running (check extension popup)

### Sync Issues
1. Make sure you're signed into Chrome
2. Check Chrome sync settings include Extensions
3. Try disabling and re-enabling extension sync

### Performance Issues
1. Clear extension data and start fresh
2. Reduce number of blocked sites if list is very large
3. Check for conflicts with other productivity extensions

## 📚 Advanced Usage

### URL Pattern Examples

```
# Block entire domain
facebook.com

# Block all subdomains
*.reddit.com

# Block specific paths
youtube.com/watch*

# Block exact pages
news.ycombinator.com/news

# Block multiple patterns (add separately)
twitter.com
x.com
```

### CSV Import Format

```csv
URL,Category
facebook.com,social
twitter.com,social  
youtube.com,entertainment
netflix.com,entertainment
cnn.com,news
reddit.com,social
instagram.com,social
tiktok.com,entertainment
```

### Keyboard Shortcuts

- **Space**: Start timer (when popup is open)
- **Escape**: Cancel emergency override countdown
- **Tab**: Navigate between input fields efficiently

## 🤝 Contributing

### Bug Reports
1. Check existing issues on GitHub
2. Provide detailed reproduction steps
3. Include Chrome version and OS information
4. Attach console logs if available

### Feature Requests
1. Search existing feature requests first
2. Explain the use case and benefit
3. Consider how it fits with the "strict focus" philosophy
4. Provide mockups or examples if helpful

### Development Setup

```bash
# Clone the repository
cd <YOUR_WORKSPACE>
git clone https://github.com/B-Bazinga/ZenMode.git


# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the extension folder

# Make changes and reload extension
# Click the reload button in chrome://extensions/
```

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by various productivity methodologies including Pomodoro Technique
- Built with modern web standards and Chrome Extension best practices
- Thanks to the focus and productivity community for feedback and suggestions

## 📞 Support

- **GitHub Issues**: Primary support channel for bugs and features
- **Email**: [Your email for direct support]
- **Documentation**: Comprehensive guides available in `/docs` folder

---

**Stay focused, stay productive!** 🎯
