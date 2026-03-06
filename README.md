# Binance Guardian AI 🛡️

> Making Crypto Investment Safer - An AI-powered safety assistant built on OpenClaw, designed for beginners and elderly users

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Powered-blue.svg)](https://openclaw.ai)
[![Version](https://img.shields.io/badge/version-2.7.0-brightgreen.svg)](https://github.com/pjl914335852-ux/binance-guardian-ai/releases)
[![Binance](https://img.shields.io/badge/Binance-Ecosystem-F0B90B.svg)](https://www.binance.com)
[![Security](https://img.shields.io/badge/API-Read--Only-green.svg)](https://github.com/pjl914335852-ux/binance-guardian-ai#security)

[English](./README.md) | [中文文档](./README.zh-CN.md) | [Changelog](./CHANGELOG.md)

---

## 🔒 Security Declaration

**Zero-Write Access:** Binance Guardian AI strictly requires **Read-Only API permissions**. We never ask for withdrawal or trading permissions. Your assets remain in your control, 100%.

---

## 🎯 Why Binance Guardian?

### Real-World Scenarios

**Scenario 1: Mom Asks**
> "Son, my friend says Pi coin is listing on Binance soon and I should buy now. Is it true?"

**Scenario 2: Beginner Confusion**
> "What is Binance Launchpool? Will I lose money?"

**Scenario 3: Investment Anxiety**
> "My coin dropped 20%, should I sell?"

### Our Solution

**Binance Guardian AI** is an AI safety assistant designed specifically for crypto beginners and elderly users, built on the OpenClaw framework. It can:

- 🛡️ **Identify Scams** - Cross-reference global scam databases, real-time risk detection
- 🗣️ **Plain Language Translation** - Translate crypto jargon into simple terms (Senior Mode)
- 📚 **Safety Education** - Daily lessons, master crypto basics in 30 days
- 💼 **Asset Protection** - Real-time market structure analysis, intelligent risk alerts
- 🔔 **Anomaly Alerts** - 24/7 monitoring, instant notification of account anomalies

---

## 🌟 Core Value

### Value to Binance Ecosystem

1. **User Protection** - Reduce scam victims, protect user assets
2. **User Education** - Lower entry barriers, expand user base
3. **Ecosystem Health** - Promote compliant projects, filter out scams
4. **Brand Enhancement** - Demonstrate Binance's commitment to user safety

### Social Value

1. **Lower Crypto Barriers** - Enable non-technical people to invest safely
2. **Help Elderly Users** - Bring seniors into the crypto world
3. **Reduce Scam Cases** - Identify common scams (Pi coin, air coins)
4. **Improve Industry Image** - Showcase positive value of cryptocurrency

---

## ✨ Key Features

### 🛡️ Guardian Mode (Default)

**Core Safety Features:**

#### 1. Scam Coin Detection
- Identify known scam coins (Squid, BitConnect, OneCoin, etc.)
- Special handling for controversial coins (Pi Network)
- Auto-sync Binance listing status (hourly updates)
- Risk level assessment (low/medium/high/critical)
- Elderly-friendly warning messages

**Example:**
```
User: "Can I buy Pi coin?"

Guardian: "Mom, Pi coin hasn't listed on Binance yet. Some small exchanges 
have trading, but those are IOUs, not the real coins you mined on your phone.

🚨 Main Risks:
1. Exchange Difficulty - Your mined coins may not be convertible
2. High Scam Rate - Many scammers impersonate officials to steal seed phrases
3. Compliance Gap - Not listed on Binance, Coinbase, or Kraken

💡 Safety Tips:
• Prioritize major platforms like Binance
• Don't trust private messages
• Don't transfer to personal accounts
• Don't click unknown links

Reminder: Coins not on major platforms carry higher risks!"
```

#### 2. Plain Language Translator
Translate 10+ technical terms into simple language:

| Technical Term | Plain Language | Example |
|---------------|----------------|---------|
| Launchpool | Like bank fixed deposit with gift rewards | Deposit 100 USDT, principal stays safe, get new coins daily |
| Launchpad | Like IPO lottery with BNB | Use BNB to draw lots for new coins |
| Staking | Like fixed deposit earning interest | Lock for a period, earn interest |
| Spot | Direct purchase, yours immediately | Buy and own |
| Futures | Borrowing to trade, extremely risky! | ⚠️ Beginners should avoid |
| Market Order | Execute immediately at any price | Fast but price uncertain |
| Limit Order | Set price, execute when reached | Controlled price |
| Stop Loss | Set loss limit, auto-sell when reached | Protect principal |
| Take Profit | Set profit target, auto-sell when reached | Lock in gains |

#### 3. Daily Safety Lessons
10 basic courses (expandable to 30):

**Days 1-7: Basic Safety**
1. How to identify scam coins?
2. How to set secure passwords?
3. What is Two-Factor Authentication (2FA)?
4. How to identify phishing websites?
5. What are private keys? Why are they important?
6. How to safely store cryptocurrency?
7. What are seed phrases?

**Days 8-14: Trading Basics**
8. What is spot trading?
9. What is futures trading? (Warning)
10. How to set stop-loss?

**Advanced Topics (10 themes):**
- DeFi Security
- NFT Safety
- Wallet Security
- Smart Contract Risks
- Phishing Prevention
- Social Engineering
- Exchange Security
- Privacy Protection
- Tax Compliance
- Legal Regulations

#### 4. Smart Message Recognition
Auto-detect user intent:
- Coin inquiry: "Can I buy Pi coin?" → Auto scam detection
- Term inquiry: "What is Launchpool?" → Auto translation
- Safety inquiry: "How to prevent scams?" → Safety tips
- Course inquiry: "What's today's lesson?" → Show daily lesson

---

### ⚙️ Professional Mode

**Advanced Features:**

#### 5. Account Management
- **Deposit History** - View recent 10 deposits with status
- **Withdrawal History** - View recent 10 withdrawals with status
- **Deposit Address** - Generate addresses for any coin (BTC, ETH, USDT, BNB, SOL, XRP)
- **Spot Trade History** - View recent 10 trades with buy/sell indicators
- **Futures Trade History** - Placeholder with risk warning

#### 6. Market Data Visualization
- **K-Line Charts** - 24-hour candlestick charts as PNG images
- **Market Depth** - Order book with top 5 bids/asks, spread calculation
- **Recent Trades** - Last 15 trades with buy/sell direction

#### 7. Price Alert System
- **4 Alert Types:**
  * Price Above - Alert when price exceeds target
  * Price Below - Alert when price falls below target
  * Rise Over - Alert when rise exceeds percentage
  * Fall Over - Alert when fall exceeds percentage
- **Auto Monitoring** - Check every 30 seconds
- **Instant Notifications** - Telegram push when triggered
- **Alert Management** - View active/triggered alerts, delete alerts

#### 8. Spot Holdings & Futures Positions
- View all spot balances with pagination
- View all futures positions with PnL
- Real-time data refresh

#### 9. Market Overview
- Real-time prices for major pairs
- 24h price changes
- Trading volume
- Price change tracking

#### 10. System Monitoring
- CPU usage
- Memory usage
- Disk space
- System load
- Uptime

---

## 🎨 UI Differentiation

### Guardian Mode (Default) 🛡️
**Simplified Menu (4 rows):**
```
[🛡️ Check Coin] [📚 Today's Lesson]
[💼 Binance Account] [📊 Market Overview]
[💻 System Monitor] [❓ Help]
[🇬🇧/🇨🇳]    [🛡️ Guardian Mode: ON]
```

**Features:**
- Only safety functions visible
- Hides advanced trading features
- Password protection to disable
- Suitable for beginners and elderly

### Professional Mode ⚙️
**Full Menu (7 rows):**
```
[🛡️ Check Coin] [📚 Today's Lesson]
[💼 Binance Account] [📊 Market Overview]
[📈 Pairs]   [📝 History]
[🎯 Threshold] [⏱️ Interval]
[🔔 Push Toggle] [💻 System Monitor]
[🇬🇧/🇨🇳]    [❓ Help]
[⚙️ Professional Mode: ON]
```

**Features:**
- All advanced functions visible
- Direct access to threshold/interval settings
- Push notification toggle
- Pair management
- Trade history

---

## 💰 The Story of 1 BNB: From Trading to Guardian

### Initial Intent

> "The initial intent of investing 1 BNB was not to seek 100x returns in volatility, but to build an automated sentinel that remains calm even in extreme market conditions, protecting family."

### Transformation

**Early 2024:** This project originated from a simple idea—helping ordinary people participate in cryptocurrency investment more safely. The founder is not a professional developer, but an ordinary investor concerned about family asset safety. Initially, it was just collecting public scam coin lists and manually querying Binance API to help people around avoid pitfalls.

**Mid 2024:** As more friends and family began asking cryptocurrency questions—"Can I buy Pi coin?" "Is this new coin reliable?"—the founder realized that helping ordinary people avoid traps is more important than pursuing profits. Thus began attempting to automate these queries with Telegram Bot, making safety information accessible to more people.

**2025:** The project positioning gradually became clear: rather than pursuing profit maximization, pursue risk minimization. By integrating Binance API, public scam databases, simple term explanations and other resources, the project evolved from manual queries to a semi-automated "information assistant." Key features include coin safety checks, term explanations, and basic safety tips.

**Early 2026:** The emergence of the OpenClaw platform made everything simple. The founder discovered that OpenClaw's AI framework could quickly integrate previously accumulated features and add more intelligent interactions. Binance Guardian AI officially took shape—this is not a complex trading system, but a cryptocurrency guardian truly designed for ordinary people. It integrates multiple public resources and APIs, allowing people without technical backgrounds to safely participate in cryptocurrency investment.

### Philosophy

This is not a "one-person company" commercial project, but a "one-person guardian" social experiment:

- **Not Pursuing Wealth** - Only pursuing safety
- **No Fees** - Completely open-source and free
- **No Complex Operations** - As simple as chatting
- **Never Leaving Family** - 24/7 companionship and protection

### Technical Note

This project is mainly based on the following technologies and public resources:
- **OpenClaw** (2026) - AI assistant framework that makes integration simple
- **Binance API** - Market data and account queries (read-only permissions)
- **Telegram Bot API** - User interaction interface
- **Chart.js** - Data visualization
- **Public Scam Databases** - Risk identification

The founder's role is more of an "integrator" and "product designer" rather than a traditional "developer." 2024-2025 was mainly about manually collecting information and simple scripts; 2026 with OpenClaw truly enabled intelligence and automation. The core value of the project lies in integrating existing technologies into a safety tool friendly to ordinary people.

### Vision

Hope every family has a "digital guardian," making cryptocurrency investment no longer exclusive to young people, allowing elderly people to safely participate in this era's transformation.

**1 BNB is not much, but it's enough to protect a family's safety.**

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Telegram Bot Token (from @BotFather)
- Binance API Key (Read-Only permissions)

### Installation

```bash
# Clone repository
git clone https://github.com/pjl914335852-ux/Binance-guardian-ai.git
cd Binance-guardian-ai

# Install dependencies
npm install

# Copy configuration template
cp config.example.json config.json

# Edit configuration (add your tokens)
nano config.json
```

### Configuration

Edit `config.json`:

```json
{
  "telegram": {
    "botToken": "YOUR_BOT_TOKEN",
    "chatId": "YOUR_CHAT_ID"
  },
  "cryptoex": {
    "apiKey": "YOUR_BINANCE_API_KEY",
    "apiSecret": "YOUR_BINANCE_API_SECRET"
  },
  "guardian": {
    "enabled": true,
    "password": "",
    "passwordSet": false
  }
}
```

### Run

```bash
# Start bot
node crypto-scout.js

# Or use systemd (recommended)
sudo systemctl start trading-scout
sudo systemctl enable trading-scout
```

---

## 📊 Features Statistics

- **Total Features:** 30+
- **New in v2.7.0:** 11 features
- **Code Lines:** +2,016 lines
- **Memory Usage:** ~32MB
- **Response Time:** <500ms
- **Supported Languages:** Chinese, English

---

## 🔒 Security Features

1. **Read-Only API** - 100% read-only permissions, cannot trade or withdraw
2. **Password Protection** - Guardian mode requires password to disable
3. **Risk Warnings** - Clear warnings for all high-risk operations
4. **Data Privacy** - Sensitive information stored locally, not uploaded
5. **Error Handling** - Comprehensive error handling, won't crash

---

## 🎯 Roadmap

### ✅ v2.7 - All-in-One Guardian (2026-03-07)

**Account Management:**
- [x] Deposit history
- [x] Withdrawal history
- [x] Deposit address generation
- [x] Spot trade history
- [x] Futures trade history

**Market Data Visualization:**
- [x] K-line chart generation (PNG)
- [x] Market depth data
- [x] Recent trades

**Price Alert System:**
- [x] Price alert management (4 types)
- [x] Alert creation wizard
- [x] Auto monitoring (30s)
- [x] Instant notifications

**UI Improvements:**
- [x] Guardian vs Professional mode differentiation
- [x] Password protection
- [x] Complete error handling

**Technical Improvements:**
- [x] Chart generation (chartjs-node-canvas)
- [x] Persistent storage
- [x] Memory optimization
- [x] Code quality improvements

### 🔧 v2.6 - Guardian Mode (2026-03-06)

**Core Features:**
- [x] Scam detection system (Pi coin, etc.)
- [x] Plain language translator (10+ terms)
- [x] Daily safety lessons (10 basic courses)
- [x] Advanced courses (10 topics)
- [x] Smart message recognition

**User Experience:**
- [x] Guardian mode UI
- [x] Password protection system
- [x] Simplified operation flow
- [x] Quick reply buttons

**Security Enhancements:**
- [x] Read-only API protection
- [x] Password verification mechanism
- [x] Risk warning prompts

### 🚀 v3.0 - Smart Upgrade (2026 Q2)

**AI Enhancements:**
- [ ] OpenClaw voice interaction (TTS/STT)
- [ ] AI-generated safety courses
- [ ] Smart risk assessment (behavior-based)
- [ ] Personalized investment advice

**Feature Expansion:**
- [ ] Launchpool monitoring
- [ ] Earn products query
- [ ] New coin listing alerts
- [ ] Multi-platform support (WhatsApp, Discord)
- [ ] Video tutorial library
- [ ] Community Q&A
- [ ] User growth system

**Internationalization:**
- [ ] Japanese, Korean, Spanish support
- [ ] Localized safety courses
- [ ] Multi-timezone support

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 📞 Contact

- **Telegram:** @Ee_7t
- **GitHub:** https://github.com/pjl914335852-ux/Binance-guardian-ai

---

## 🙏 Acknowledgments

- **OpenClaw** - AI assistant framework
- **Binance** - API and ecosystem support
- **NOFX Community** - Market data and insights
- **Open Source Community** - Various tools and libraries

---

**Making crypto investment safer, one family at a time.** 🛡️
