# OpenClaw Trading Scout 🦞

> Let AI Monitor the Market for You - 24/7 Automated Binance Trading Opportunity Detection

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Powered-blue.svg)](https://openclaw.ai)
[![Version](https://img.shields.io/badge/version-2.3.0-brightgreen.svg)](https://github.com/pjl914335852-ux/openclaw-trading-scout/releases)

[中文文档](./README.zh-CN.md) | [AI Enhanced Version](./README-AI.md) | [Pro Version](./README-PRO.md) | [Changelog](./CHANGELOG.md)

---

## 🎯 What is Trading Scout?

An AI-powered trading assistant built with OpenClaw that:
- 📊 **Real-time Monitoring** - Tracks multiple Binance trading pairs (BTC/ETH/BNB/SOL)
- 🎯 **Smart Detection** - Identifies arbitrage opportunities (spread > 0.5%)
- 📱 **Instant Alerts** - Sends trading signals via Telegram Bot
- 📈 **Historical Analysis** - Statistics and performance tracking
- 💓 **Heartbeat Reports** - Status updates every 2 hours
- 💰 **NOFX Integration** - Professional market data and signal quality scoring

**The Problem**: Crypto markets run 24/7, but humans need sleep.

**The Solution**: Let AI be your eyes on the market.

---

## 🦞 What is Trading Scout?

**OpenClaw Trading Scout** is a free, open-source cryptocurrency arbitrage monitoring tool built on the OpenClaw framework. It runs as a standalone Node.js application that monitors Binance trading pairs 24/7 and sends instant alerts via Telegram when arbitrage opportunities are detected.

**Powered by NOFX Community's precise data support** - leveraging professional-grade market analysis and real-time data feeds to identify profitable opportunities that others miss.

### 💰 Completely Free - No Token Consumption

**Important: This tool does NOT consume any tokens or incur any costs!**

- ✅ **No AI API calls** - Pure data monitoring, no Claude/OpenAI/GPT usage
- ✅ **No Binance fees** - Uses free public API endpoints
- ✅ **No Telegram fees** - Bot API is completely free
- ✅ **No hidden costs** - 100% free to run 24/7

### 📊 About Binance API Costs

**Q: Does using Binance data consume tokens or cost money?**

**A: No! Completely FREE!**

**Public Data (No API Key Required):**
- Price data (`/api/v3/ticker/price`) - ✅ FREE
- 24h ticker (`/api/v3/ticker/24hr`) - ✅ FREE
- Kline/candlestick data - ✅ FREE
- Order book depth - ✅ FREE

**Private Data (Read-Only API Key Required):**
- Account balance (`/api/v3/account`) - ✅ FREE
- Order history - ✅ FREE
- Trade history - ✅ FREE

**What are the limits?**
- Not "token consumption" but "rate limiting" (anti-abuse)
- Binance allows up to 1,200 requests/minute
- Our tool uses only ~20 requests/minute (very conservative)
- This is a speed limit, not a cost - like a free highway with a speed limit

**Cost Breakdown:**

| Service | Cost | Notes |
|---------|------|-------|
| Binance Price Data | ✅ FREE | Public API, no key needed |
| Binance Volume Data | ✅ FREE | Public API, no key needed |
| Binance Account Balance | ✅ FREE | Requires read-only API key |
| Telegram Notifications | ✅ FREE | Bot API is free |
| Server Hosting | ✅ FREE | Your own server |

**Total Cost: $0/day = $0/month = $0/year**

### 🎯 Key Features

### 1. Multi-Pair Monitoring
- Simultaneous tracking of multiple trading pairs
- **Configurable update interval** (minimum 10s, recommended 30s)
- Real-time price updates with intelligent caching
- Volume and volatility analysis

### 2. 🔧 Custom Token Monitoring
- **Add up to 4 custom trading pairs** of your choice
- Monitor specific tokens you're interested in
- Flexible configuration for different strategies
- Perfect for tracking niche or emerging tokens

### 3. 🤖 AI Agent Recommendations
- **AI-powered token selection** across different categories:
  - `trending` - Top market cap coins (BTC, ETH, BNB, SOL)
  - `defi` - DeFi ecosystem (UNI, AAVE, LINK, MKR)
  - `layer2` - Layer 2 solutions (MATIC, ARB, OP)
  - `meme` - Meme coins (DOGE, SHIB, PEPE)
- Automatically includes recommended pairs in monitoring
- Easy category switching via configuration

### 4. Arbitrage Detection
- Cross-pair spread analysis
- Configurable threshold (default 0.5%)
- Risk-adjusted opportunity scoring
- Smart filtering by volume and liquidity

### 5. 🛡️ API Rate Limiting Protection
- **Intelligent request throttling** (default 20 req/min)
- **Separate update intervals** for price and volume data
- **Smart caching** to minimize API calls
- **Prevents IP bans** from exchange
- Configurable limits for different use cases

### 6. Position Management 🆕
- **Smart Position Sizing** - Auto-calculate position size based on balance and risk
- **Max Positions Control** - Limit concurrent positions (default: 3)
- **Position Tracking** - Real-time monitoring of all open positions
- **Historical Records** - Complete trade history with P&L

### 7. Risk Control 🆕
- **Stop Loss** - Automatic stop loss at 2% (configurable)
- **Take Profit** - Automatic take profit at 5% (configurable)
- **Trailing Stop** - Dynamic stop loss that follows price (1.5%)
- **Risk Assessment** - Evaluate opportunity risk level (low/medium/high)

### 8. Order Tracking 🆕
- **Real-time Monitoring** - Check positions every 5 seconds
- **Auto Execution** - Trigger stop loss/take profit automatically
- **P&L Calculation** - Real-time unrealized and realized P&L
- **Trade Duration** - Track how long each position is held

### 9. Telegram Integration
- Instant push notifications
- Trading signal details with risk levels
- Position updates and alerts
- **NOFX trading recommendation** included in alerts
- Historical performance stats

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Telegram Bot Token
- Binance API Key (read-only permission)

### Installation

```bash
# Clone repository
git clone https://github.com/pjl914335852-ux/openclaw-trading-scout
cd openclaw-trading-scout

# Install dependencies
npm install

# Configure (edit config.json)
cp config.example.json config.json

# Run demo
npm test

# Start monitoring
npm start
```

### API Key Setup (Optional)

**When do you need it?**
- ✅ To view your account balance
- ✅ For future auto-trading features (Phase 2)
- ❌ NOT needed for price monitoring and alerts

**💰 Cost: Completely FREE**
- **Price data (public API)**: No API key needed, no quota consumed
- **Account balance (private API)**: Requires API key, but FREE (no quota consumed)
- **All monitoring features**: 100% FREE, no charges

**How to get Binance API Key:**

1. Log in to [Binance](https://www.binance.com)
2. Go to Profile → API Management
3. Create a new API Key
4. **🔒 CRITICAL Security Settings:**
   - ✅ **Enable "Enable Reading" ONLY** (this is all you need)
   - ❌ **Disable "Enable Spot & Margin Trading"** (keep it OFF for safety)
   - ❌ **Disable "Enable Futures"** (keep it OFF)
   - ❌ **Disable "Enable Withdrawals"** (NEVER enable this)
   - ✅ **Restrict access to trusted IPs** (highly recommended)

5. Copy API Key and Secret Key
6. Add to `config.json`:

```json
{
  "cryptoex": {
    "apiKey": "your_api_key_here",
    "apiSecret": "your_secret_key_here",
    "testnet": false
  }
}
```

**🛡️ Security Best Practices:**
- 🔒 **Only enable "Enable Reading" permission** - this prevents any trading or withdrawals
- 🔒 Never share your API Secret with anyone
- 🔒 Use IP whitelist to restrict access to your server only
- 🔒 Start with testnet first (`"testnet": true`) to test safely
- 🔒 Regularly rotate your API keys (every 3-6 months)

**Why "Enable Reading" is enough:**
- ✅ Can check account balance
- ✅ Can view order history
- ✅ Can monitor positions
- ❌ Cannot place trades (safe!)
- ❌ Cannot withdraw funds (safe!)
- ❌ Cannot transfer assets (safe!)

---

## 📊 How It Works

### Architecture

```
CryptoExchange API → Trading Scout (OpenClaw) → Telegram Bot
    ↓                    ↓                         ↓
Price Data         Arbitrage Analysis        Push Notifications
```

### Detection Algorithm

```javascript
// Simplified arbitrage detection
function findArbitrageOpportunities(prices, volumes) {
  const opportunities = [];
  
  // Compare all trading pair combinations
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      // Calculate price change rates
      const change1 = (prices[pair1] - priceCache[pair1]) / priceCache[pair1] * 100;
      const change2 = (prices[pair2] - priceCache[pair2]) / priceCache[pair2] * 100;
      const spread = Math.abs(change1 - change2);
      
      // Alert if spread exceeds threshold
      if (spread > threshold) {
        opportunities.push({
          pair1, pair2, spread,
          suggestion: change1 > change2 
            ? `Buy ${pair2}, Sell ${pair1}` 
            : `Buy ${pair1}, Sell ${pair2}`
        });
      }
    }
  }
  
  return opportunities;
}
```

---

## 📱 Example Output

### Basic Monitoring
```
🦞 Trading Scout Checking...

📊 Current Prices:
  BTCUSDT: $96,513.89
  ETHUSDT: $2,857.98
  BNBUSDT: $623.23

💰 Account Balance:
  USDT: 1000.00 (Available: 900.00)
  BTC: 0.0103 (Available: 0.0103)

📈 Active Positions:
  BTCUSDT: 0.01 @ $96,000 (+0.53%)
    Stop Loss: $94,080 | Take Profit: $100,800

🎯 Arbitrage Opportunity Found:
  BNBUSDT / ETHUSDT
  Spread: 0.62% | Risk: medium
  Suggestion: Buy ETHUSDT, Sell BNBUSDT

✅ Telegram notification sent
```

### Position Closed
```
🔔 Position Closed

Pair: BTCUSDT
Entry: $96,000
Exit: $100,800
P&L: +5.00% ($48.00)
Reason: Take Profit
Duration: 2h 35m
```

---

## ⚙️ Configuration

Edit `config.json`:

```json
{
  "cryptoex": {
    "apiKey": "YOUR_API_KEY",        // Optional: for balance check
    "apiSecret": "YOUR_API_SECRET",  // Optional: for balance check
    "testnet": true                  // Use testnet for safety
  },
  "telegram": {
    "botToken": "YOUR_BOT_TOKEN",
    "chatId": "YOUR_CHAT_ID"
  },
  "trading": {
    "pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"],
    "threshold": 0.5,
    "checkInterval": 30000,
    "minVolume": 1000000,
    
    // Risk Control
    "stopLoss": 2.0,        // 2% stop loss
    "takeProfit": 5.0,      // 5% take profit
    "trailingStop": 1.5,    // 1.5% trailing stop
    
    // Position Management
    "maxPositions": 3,      // Max 3 concurrent positions
    "maxPositionSize": 0.1, // Max 10% of balance per position
    "minPositionSize": 0.02 // Min 2% of balance per position
  }
}
```

### Configuration Guide

**Binance API (Optional):**
- Leave empty (`""`) if you only want price monitoring
- Required for:
  - Account balance display
  - Future auto-trading features
- Get from: Binance → Profile → API Management

**Telegram (Required):**
- `botToken`: Get from @BotFather on Telegram
- `chatId`: Get from @userinfobot on Telegram

**Risk Control:**
- `stopLoss`: Percentage loss to trigger automatic exit
- `takeProfit`: Percentage gain to trigger automatic exit
- `trailingStop`: Dynamic stop loss that follows price

**Position Management:**
- `maxPositions`: Maximum number of concurrent positions
- `maxPositionSize`: Maximum percentage of balance per position
- `minPositionSize`: Minimum percentage of balance per position

**Safety First:**
- Always start with `testnet: true`
- Test thoroughly before using real funds
- Start with small position sizes

---

## 🎓 Use Cases

### For Beginners
- Learn market dynamics
- Understand arbitrage opportunities
- Practice risk management

### For Traders
- 24/7 market monitoring
- Never miss opportunities
- Reduce emotional trading

### For Developers
- OpenClaw integration example
- Trading bot architecture reference
- Extensible strategy framework

---

## 🛠️ Tech Stack

- **Framework**: OpenClaw AI Agent
- **Runtime**: Node.js 18+
- **APIs**: Binance/CryptoExchange, Telegram
- **Data**: Real-time price feeds
- **Deployment**: Local/Cloud/Docker

---

## 📈 Roadmap

**Phase 1** ✅ (Completed)
- ✅ Multi-pair monitoring
- ✅ Arbitrage detection
- ✅ Telegram alerts
- ✅ Position management
- ✅ Risk control (stop loss/take profit/trailing stop)
- ✅ Order tracking

**Phase 2** 🔄 (In Progress)
- 🔄 Auto-execution (testnet)
- 🔄 Web dashboard
- 🔄 More strategies (grid, trend following)
- 🔄 Backtesting system

**Phase 3** 📋 (Planned)
- 📋 Live trading (mainnet)
- 📋 Strategy marketplace
- 📋 Mobile app
- 📋 Advanced analytics

---

## 📄 License

MIT License - Free to use and modify

---

## 🔗 Links

- [OpenClaw Official](https://openclaw.ai)
- [OpenClaw Docs](https://docs.openclaw.ai)
- [OpenClaw Discord](https://discord.com/invite/clawd)
- [Binance API Docs](https://cryptoex-docs.github.io/apidocs/)

---

## 👤 Author

**Brart**
- Telegram: [@Ee_7t](https://t.me/Ee_7t)

---

## 🙏 Acknowledgments

- OpenClaw team for the powerful AI Agent framework
- Binance for excellent trading APIs
- NOFX for robust data infrastructure
- Community for inspiration and feedback

---

⭐ If this project helps you, please give it a Star!

**Built with ❤️ using OpenClaw**
