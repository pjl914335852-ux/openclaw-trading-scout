# Changelog

## [2.4.0] - 2026-03-06

### 🔥 AI500 Ranking & Auto-Push

#### Added
- **AI500 Ranking:** View hot coins with high potential
  - Added "🔥 AI500排行" button in pairs page
  - Display TOP 10 high-score coins from NOFX
  - Show AI500 score, price, 24h change percentage
  - Refresh button to update data in real-time
  - Sorted by AI500 score (highest first)
  - Medal indicators: 🥇🥈🥉 for top 3
  - Score emoji: 🔥 (≥80), ⚡ (≥60), 💫 (<60)

- **AI500 Auto-Push:** Get notified of hot coins automatically
  - Check AI500 hot coins every hour
  - Push notification when AI500 score ≥ 80
  - Only push new high-score coins (avoid duplicates)
  - Auto-cleanup coins that drop below threshold
  - Requires autoPush enabled
  - Shows coin symbol, AI500 score, price, 24h change

#### Changed
- **Pairs Page UI:** Reorganized to 5 rows
  - Row 1: Add Pair, Remove Pair
  - Row 2: Set Interval, Set Threshold
  - Row 3: Toggle Push, Market Overview
  - Row 4: AI500 Ranking (NEW!), Test Alert
  - Row 5: History, Back to Menu

#### Technical
- Added `handleAI500Ranking()` function in telegram-ui.js
- Added `checkAI500HotCoins()` function in crypto-scout.js
- Added `state.lastAI500Check` timestamp
- Added `state.ai500HighScoreCoins` Set for tracking
- Uses NOFX API `getAI500List()` endpoint
- Check interval: 1 hour (3600000ms)
- Push threshold: AI500 score ≥ 80
- Callback handler: `ai500_ranking`

#### Fixed
- Fixed nofxApi variable name (should be nofxAPI)
- Fixed API method name (getAI500List instead of getHighPotentialCoins)

#### Benefits
- Discover hot coins with high potential
- Get notified of new opportunities automatically
- Track AI500 rankings anytime
- NOFX professional data integration
- No need to check website manually

---

## [2.3.0] - 2026-03-06

### 🚀 Language Sync & System Monitor

#### Added
- **System Monitor Feature:** View server status from Telegram
  - Added `/system` command
  - Added "💻 系统监控" button in main menu
  - Real-time display of:
    - System uptime
    - CPU usage (total, user, system, load average)
    - Memory usage (total, used, available, free)
    - Disk usage (total, used, available, percentage)
    - Bot process info (PID, memory)
  - Refresh button to update data
  - No SSH needed to check server health

#### Changed
- **Language Synchronization:** UI language now syncs with daily summaries
  - Click 🇬🇧 English → saves `language: "en"` to config
  - Click 🇨🇳 中文 → saves `language: "zh"` to config
  - Dynamic reload without service restart
  - Changed `const lang` to `let lang` for runtime updates
  - Daily summaries now match UI language

- **Daily Summary Times:** Optimized for better user activity patterns
  - Before: 09:00, 14:00, 20:00
  - After: 08:00, 12:00, 20:00
  - 08:00 - Morning wake up time
  - 12:00 - Lunch time
  - 20:00 - Evening after work

#### Technical
- Added `onConfigChange` callback for dynamic language reload
- System monitor uses Linux commands (free, df, uptime, top)
- Multi-language support for system monitor (EN/ZH)
- Main menu reorganized to 4 rows

#### Benefits
- Unified language experience across all features
- Monitor server health without SSH
- Better timing for daily summaries
- Quick troubleshooting from Telegram

---

## [2.2.0] - 2026-03-06

### 🎯 Major Feature Additions

#### Added
- **Adjustable Threshold:** Control arbitrage sensitivity (0.1%-1.0%)
  - Added "🎯 套利阈值" button in pairs page
  - Default: 0.5%
  - Lower threshold = more opportunities
  - Higher threshold = better quality

- **Market Overview:** Real-time price monitoring
  - Added "📊 市场概览" button in pairs page
  - Shows all monitored pairs with:
    - Current price
    - 24h change percentage
    - 24h trading volume
  - Refresh anytime

- **Test Alert:** Verify bot is working
  - Added "🧪 测试通知" button in pairs page
  - Sends simulated arbitrage notification
  - Check notification format and content

- **Daily Market Summary:** Automated market reports (3x/day)
  - Sends at 09:00, 14:00, 20:00
  - Content includes:
    - 📈 Top 3 gainers
    - 📉 Top 3 losers
    - 📊 Statistics (pairs, volume, opportunities)
    - 🎯 Recent opportunities
  - Keeps users informed even without arbitrage

- **View Last Summary:** Check previous summary anytime
  - Added "📅 上次摘要" button in main menu
  - Cached summary text
  - Shows next summary time if none exists

#### Changed
- **Pairs Page UI:** Reorganized to 5 rows
  - Row 1: Add Pair, Remove Pair
  - Row 2: Set Interval, Set Threshold (NEW!)
  - Row 3: Toggle Push, Market Overview (NEW!)
  - Row 4: Test Alert (NEW!), History
  - Row 5: Back to Menu

- **Main Menu UI:** Added Last Summary button
  - Row 1: Status, Modify Pairs
  - Row 2: History, Last Summary (NEW!)
  - Row 3: Help
  - Row 4: Language switch

#### Technical
- Added `prevPriceCache` for price change tracking
- Added `lastDailySummary` timestamp
- Added `lastSummaryText` for caching
- Added `scheduleDailySummary()` function
- Added `sendDailySummary()` function
- 14 callback handlers registered

#### Benefits
- More control over opportunity frequency
- Better market visibility
- Verify bot is working anytime
- Regular market updates
- Feel like app is actively working

---

## [2.1.0] - 2026-03-06

### 🎉 Major UI/UX Improvements & Bug Fixes

#### Fixed
- **Critical:** Fixed duplicate messages issue caused by multiple bot instances
  - Root cause: manual start + systemd auto-restart = 2 instances
  - Solution: Use systemd exclusively for service management
  - Added `restart.sh` script for safe restarts
  - Added `SERVICE.md` documentation

- **UI Bugs:**
  - Fixed toggle push creating duplicate interfaces (added 500ms delay)
  - Fixed help button not responding (removed duplicate callback handling)
  - Fixed remove pair showing nothing when empty (now shows friendly message with buttons)
  - Fixed help message being too long (split into 2 messages)

#### Added
- **Heartbeat Feature:** Bot sends status report every 2 hours
  - Shows uptime, checks count, opportunities found
  - Lets users know the bot is actively working
  - Added to state: `lastHeartbeat`, `checksCount`

- **UI Enhancements:**
  - Added "Back to Menu" button in pairs page
  - Added "Back to Menu" buttons in both help messages
  - Added "How It Works" section in help (6-step explanation)
  - Added heartbeat feature description in main menu
  - Improved remove pair empty state with Add/Back buttons

- **Documentation:**
  - Added `SERVICE.md` - Service management guide
  - Added `restart.sh` - Safe restart script
  - Updated help text with work principle explanation

#### Changed
- **Remove Pair:** Now only accepts number input (1-N), not pair names
  - Simplified user experience
  - Better validation with range display
  - UI text: "请发送要删除的交易对编号"

- **Help Page:** Split into 2 messages for better readability
  - Message 1: About + How It Works + Heartbeat
  - Message 2: Commands + Features + Tips + Back button
  - Prevents Telegram parsing issues with long messages

#### Technical
- Improved callback query handling consistency
- Better error messages for edge cases
- Log monitoring: ~1KB/minute growth (healthy)
- Service management via systemd only

### Commits
- c875c4c: Add back button to both help messages
- cf91054: Prevent duplicate instances with systemd management
- ee3f15b: Split help message into two parts
- 3cf40cc: Fix help button and remove pair UI issues
- f217bfe: UI improvements and documentation enhancements
- 8af08ed: Fix toggle push UI bug and add heartbeat feature

---

## [2.0.0] - 2026-03-06

### 🚀 NOFX API Integration

#### Added
- NOFX API integration for professional market data
- Signal quality scoring (0-100)
- Fund flow tracking
- Interactive Telegram UI with inline keyboards
- Multi-language support (EN/ZH)
- AI500 score integration
- Enhanced risk assessment

#### Features
- Real-time monitoring (30s interval)
- NOFX data updates (5min interval)
- Interactive commands: /start, /status, /pairs, /history, /help
- Custom pair management
- Refresh interval settings (10-300s)
- Auto-push toggle

---

## [1.0.0] - 2026-03-05

### Initial Release
- Basic price monitoring
- Simple spread detection
- Telegram notifications
- Multi-exchange support
