# 🤖 Telegram Interactive UI / Telegram 交互界面

Trading Scout now has a full interactive Telegram interface, just like Service Cat!

交易侦察员现在有完整的 Telegram 交互界面了，就像服务猫一样！

---

## ✨ Features / 功能

### 📋 Commands / 命令

| Command | Description | 描述 |
|---------|-------------|------|
| `/start` | Welcome message with quick access buttons | 欢迎消息和快捷按钮 |
| `/status` | View running status and statistics | 查看运行状态和统计 |
| `/pairs` | View all monitored trading pairs | 查看所有监控的交易对 |
| `/history` | View historical arbitrage opportunities | 查看历史套利机会 |
| `/lang en` | Switch to English | 切换到英文 |
| `/lang zh` | Switch to Chinese | 切换到中文 |
| `/help` | Show help information | 显示帮助信息 |

### 🎯 Inline Keyboards / 内联键盘

Quick access buttons for:

快捷按钮：

- 📊 Status / 运行状态
- 📈 Pairs / 交易对
- 📝 History / 历史记录
- ❓ Help / 帮助
- 🇬🇧 English / 🇨🇳 中文

---

## 🚀 How to Use / 如何使用

### 1. Start the Bot / 启动 Bot

Search for your bot in Telegram and click **START**

在 Telegram 搜索你的 Bot 并点击 **START**

### 2. Welcome Screen / 欢迎界面

You'll see a welcome message with:

你会看到欢迎消息，包含：

- Bot introduction / Bot 介绍
- Feature list / 功能列表
- Quick access buttons / 快捷按钮
- Language selection / 语言选择

### 3. Check Status / 查看状态

Click **📊 Status** or send `/status` to see:

点击 **📊 运行状态** 或发送 `/status` 查看：

- Uptime / 运行时间
- Monitoring statistics / 监控统计
- Detection stats / 检测统计
- Configuration / 配置信息
- API status / API 状态

### 4. View Pairs / 查看交易对

Click **📈 Pairs** or send `/pairs` to see:

点击 **📈 交易对** 或发送 `/pairs` 查看：

- Base pairs / 基础交易对
- Custom pairs / 自定义交易对
- AI recommendations / AI 推荐

### 5. Check History / 查看历史

Click **📝 History** or send `/history` to see:

点击 **📝 历史记录** 或发送 `/history` 查看：

- Total opportunities found / 总机会数
- Recent 5 opportunities / 最近 5 个机会
- Spread and risk level / 价差和风险等级
- Timestamp / 时间戳

### 6. Switch Language / 切换语言

Click **🇬🇧 English** or **🇨🇳 中文** to switch language

点击 **🇬🇧 English** 或 **🇨🇳 中文** 切换语言

Or use commands:

或使用命令：

```
/lang en  # English
/lang zh  # Chinese
```

---

## 📱 Screenshots / 截图示例

### Welcome Screen / 欢迎界面

```
🦞 Welcome to OpenClaw Trading Scout!

💰 Powered by NOFX Community Data

I'm your 24/7 cryptocurrency arbitrage monitoring assistant...

📋 Available Commands:
/status - View running status
/pairs - View monitored pairs
...

[📊 Status] [📈 Pairs]
[📝 History] [❓ Help]
[🇬🇧 English] [🇨🇳 中文]
```

### Status Screen / 状态界面

```
📊 Trading Scout Status

⏱️ Uptime: 2h 15m

📈 Monitoring Stats:
• Total pairs: 6
• Base pairs: 2
• Custom pairs: 2
• AI recommendations: 4

🎯 Detection Stats:
• Historical opportunities: 3
• Price update: 15s ago
...

[🔄 Refresh] [📈 View Pairs]
```

### Pairs Screen / 交易对界面

```
📈 Monitored Pairs

🔹 Base Pairs (2):
• BTCUSDT
• ETHUSDT

🔧 Custom Pairs (2):
• LINKUSDT
• UNIUSDT

🤖 AI Recommendations (4):
• UNIUSDT
• AAVEUSDT
...

[📊 Status] [📝 History]
```

### History Screen / 历史界面

```
📝 Historical Opportunities

Total: 3 opportunities

Recent 5:

1. BTCUSDT / ETHUSDT
   Spread: 0.8% | Risk: medium
   Time: 2026-03-06 03:30:00

2. BNBUSDT / SOLUSDT
   Spread: 0.6% | Risk: low
   Time: 2026-03-06 02:15:00

[🔄 Refresh] [📊 Status]
```

---

## 🔔 Notifications / 通知

When an arbitrage opportunity is found, you'll receive:

当发现套利机会时，你会收到：

```
🚨 Arbitrage Opportunity Found!
Powered by NOFX Precise Data

Pairs: BTCUSDT / ETHUSDT
Spread: 0.8%
Risk Level: medium

BTCUSDT Change: +0.5%
ETHUSDT Change: -0.3%

💡 Suggestion: Buy ETHUSDT, Sell BTCUSDT

⏰ Time: 2026-03-06 03:30:00

🎯 NOFX Professional Data - Discover More Profit Opportunities
```

---

## ⚙️ Configuration / 配置

The UI automatically adapts to your `config.json` settings:

UI 会自动适应你的 `config.json` 设置：

- Language preference / 语言偏好
- Monitored pairs / 监控的交易对
- AI agent settings / AI 智能体设置
- Check intervals / 检查间隔
- Thresholds / 阈值

---

## 🎨 Customization / 自定义

Want to customize the UI? Edit `telegram-ui.js`:

想自定义 UI？编辑 `telegram-ui.js`：

```javascript
// Change button text
{ text: 'My Custom Button', callback_data: 'custom' }

// Add new commands
this.bot.onText(/\/mycommand/, (msg) => {
  this.handleMyCommand(msg);
});

// Customize messages
const welcomeText = 'My custom welcome message...';
```

---

## 🔧 Technical Details / 技术细节

### Polling vs Webhook / 轮询 vs Webhook

Currently using **polling** mode:

当前使用 **轮询** 模式：

```javascript
this.bot.startPolling();
```

For production, consider **webhook** mode:

生产环境建议使用 **webhook** 模式：

```javascript
this.bot.setWebHook('https://your-domain.com/bot');
```

### State Management / 状态管理

The UI has access to:

UI 可以访问：

- `this.config` - Configuration / 配置
- `this.state` - Runtime state / 运行状态
- `this.bot` - Telegram Bot instance / Bot 实例

### Error Handling / 错误处理

All commands have error handling:

所有命令都有错误处理：

```javascript
try {
  // Command logic
} catch (error) {
  this.bot.sendMessage(chatId, 'Error: ' + error.message);
}
```

---

## 📝 Notes / 注意事项

1. **Polling requires the bot to be running** / 轮询需要 Bot 运行
   - The bot must be running to receive commands
   - Bot 必须运行才能接收命令

2. **Language persists per session** / 语言按会话保持
   - Language setting is per-session, not global
   - 语言设置是按会话的，不是全局的

3. **Inline keyboards are interactive** / 内联键盘是交互式的
   - Click buttons to trigger actions
   - 点击按钮触发操作

4. **Commands work in private chat only** / 命令仅在私聊中有效
   - Bot commands work in private chat with the bot
   - Bot 命令在与 Bot 的私聊中有效

---

## ✅ Comparison with Service Cat / 与服务猫对比

| Feature | Service Cat | Trading Scout |
|---------|-------------|---------------|
| Welcome screen | ✅ | ✅ |
| Status command | ✅ | ✅ |
| Inline keyboards | ✅ | ✅ |
| Language switch | ✅ | ✅ |
| Help command | ✅ | ✅ |
| Custom commands | ✅ | ✅ (pairs, history) |
| Notifications | ✅ | ✅ |

**Trading Scout now has the same level of interactivity as Service Cat!**

**交易侦察员现在和服务猫一样具有交互性了！**

---

## 🚀 Next Steps / 下一步

1. **Test the UI** / 测试 UI
   - Send `/start` to your bot
   - 给你的 Bot 发送 `/start`

2. **Try all commands** / 尝试所有命令
   - Test each command and button
   - 测试每个命令和按钮

3. **Customize if needed** / 根据需要自定义
   - Edit `telegram-ui.js` to add features
   - 编辑 `telegram-ui.js` 添加功能

4. **Deploy** / 部署
   - Restart the service to enable UI
   - 重启服务启用 UI

---

## 📞 Need Help? / 需要帮助？

Telegram: @Ee_7t
GitHub: github.com/pjl914335852-ux/openclaw-trading-scout

💰 Powered by NOFX Community Data
