// Telegram Bot Commands Handler
// 交易侦察员 Telegram 命令处理

const { t } = require('./i18n');

class TelegramUI {
  constructor(bot, config, state) {
    this.bot = bot;
    this.config = config;
    this.state = state;
    this.lang = config.language || 'en';
    
    this.setupCommands();
  }
  
  setupCommands() {
    // Enable polling for commands
    this.bot.startPolling();
    
    // /start command
    this.bot.onText(/\/start/, (msg) => {
      this.handleStart(msg);
    });
    
    // /status command
    this.bot.onText(/\/status/, (msg) => {
      this.handleStatus(msg);
    });
    
    // /pairs command
    this.bot.onText(/\/pairs/, (msg) => {
      this.handlePairs(msg);
    });
    
    // /history command
    this.bot.onText(/\/history/, (msg) => {
      this.handleHistory(msg);
    });
    
    // /lang command
    this.bot.onText(/\/lang (.+)/, (msg, match) => {
      this.handleLanguage(msg, match[1]);
    });
    
    // /help command
    this.bot.onText(/\/help/, (msg) => {
      this.handleHelp(msg);
    });
    
    // Inline keyboard callbacks
    this.bot.on('callback_query', (query) => {
      this.handleCallback(query);
    });
  }
  
  // /start - Welcome message
  handleStart(msg) {
    const chatId = msg.chat.id;
    
    const welcomeText = this.lang === 'zh' ? `
🦞 *欢迎使用 OpenClaw 交易侦察员！*

💰 *由 NOFX 社区精准数据支持*

我是你的 24/7 加密货币套利监控助手。我会实时监控币安交易对，当发现套利机会时立即通知你！

*🎯 我能做什么？*

• 📊 实时监控多个交易对
• 🔍 发现价差套利机会
• ⚠️ 评估风险等级
• 📈 追踪历史机会
• 🤖 AI 智能推荐

*📋 可用命令：*

/status - 查看运行状态
/pairs - 查看监控的交易对
/history - 查看历史机会
/lang - 切换语言
/help - 帮助信息

*🚀 开始使用：*

我已经在后台运行了！当发现套利机会时，我会立即通知你。

💡 提示：点击下方按钮快速访问功能
    ` : `
🦞 *Welcome to OpenClaw Trading Scout!*

💰 *Powered by NOFX Community Data*

I'm your 24/7 cryptocurrency arbitrage monitoring assistant. I monitor Binance trading pairs in real-time and notify you immediately when arbitrage opportunities are found!

*🎯 What can I do?*

• 📊 Real-time monitoring of multiple pairs
• 🔍 Discover price spread arbitrage opportunities
• ⚠️ Assess risk levels
• 📈 Track historical opportunities
• 🤖 AI-powered recommendations

*📋 Available Commands:*

/status - View running status
/pairs - View monitored pairs
/history - View historical opportunities
/lang - Switch language
/help - Help information

*🚀 Get Started:*

I'm already running in the background! I'll notify you immediately when arbitrage opportunities are found.

💡 Tip: Click the buttons below for quick access
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '📊 运行状态' : '📊 Status', callback_data: 'status' },
          { text: this.lang === 'zh' ? '📈 交易对' : '📈 Pairs', callback_data: 'pairs' }
        ],
        [
          { text: this.lang === 'zh' ? '📝 历史记录' : '📝 History', callback_data: 'history' },
          { text: this.lang === 'zh' ? '❓ 帮助' : '❓ Help', callback_data: 'help' }
        ],
        [
          { text: '🇬🇧 English', callback_data: 'lang_en' },
          { text: '🇨🇳 中文', callback_data: 'lang_zh' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // /status - Show running status
  handleStatus(msg) {
    const chatId = msg.chat.id;
    
    const uptime = Math.floor((Date.now() - this.state.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    const allPairs = this.getAllPairs();
    const basePairs = this.config.trading.pairs || [];
    const customPairs = this.config.trading.customPairs || [];
    const aiPairs = this.getAIRecommendations();
    
    const statusText = this.lang === 'zh' ? `
📊 *交易侦察员运行状态*

*⏱️ 运行时间:* ${hours}小时 ${minutes}分钟

*📈 监控统计:*
• 总交易对: ${allPairs.length}
• 基础交易对: ${basePairs.length}
• 自定义交易对: ${customPairs.length}
• AI 推荐: ${aiPairs.length}

*🎯 检测统计:*
• 历史机会: ${this.state.opportunityHistory.length}
• 价格更新: ${Math.floor((Date.now() - this.state.lastPriceUpdate) / 1000)}秒前
• 交易量更新: ${Math.floor((Date.now() - this.state.lastVolumeUpdate) / 1000)}秒前

*⚙️ 配置:*
• 检查间隔: ${this.config.trading.checkInterval / 1000}秒
• 价差阈值: ${this.config.trading.threshold}%
• 最小交易量: $${(this.config.trading.minVolume || 1000000).toLocaleString()}

*🔄 API 状态:*
• 请求限制: ${this.config.rateLimit?.maxRequestsPerMinute || 20}/分钟
• 当前请求: ${this.state.requestCount}

✅ *状态: 正常运行*

💰 由 NOFX 社区精准数据支持
    ` : `
📊 *Trading Scout Status*

*⏱️ Uptime:* ${hours}h ${minutes}m

*📈 Monitoring Stats:*
• Total pairs: ${allPairs.length}
• Base pairs: ${basePairs.length}
• Custom pairs: ${customPairs.length}
• AI recommendations: ${aiPairs.length}

*🎯 Detection Stats:*
• Historical opportunities: ${this.state.opportunityHistory.length}
• Price update: ${Math.floor((Date.now() - this.state.lastPriceUpdate) / 1000)}s ago
• Volume update: ${Math.floor((Date.now() - this.state.lastVolumeUpdate) / 1000)}s ago

*⚙️ Configuration:*
• Check interval: ${this.config.trading.checkInterval / 1000}s
• Spread threshold: ${this.config.trading.threshold}%
• Min volume: $${(this.config.trading.minVolume || 1000000).toLocaleString()}

*🔄 API Status:*
• Rate limit: ${this.config.rateLimit?.maxRequestsPerMinute || 20}/min
• Current requests: ${this.state.requestCount}

✅ *Status: Running*

💰 Powered by NOFX Community Data
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: 'status' },
          { text: this.lang === 'zh' ? '📈 查看交易对' : '📈 View Pairs', callback_data: 'pairs' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, statusText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // /pairs - Show monitored pairs
  handlePairs(msg) {
    const chatId = msg.chat.id;
    
    const basePairs = this.config.trading.pairs || [];
    const customPairs = this.config.trading.customPairs || [];
    const aiPairs = this.getAIRecommendations();
    
    let pairsText = this.lang === 'zh' ? `
📈 *监控的交易对*

*🔹 基础交易对 (${basePairs.length}):*
${basePairs.map(p => `• ${p}`).join('\n')}
    ` : `
📈 *Monitored Pairs*

*🔹 Base Pairs (${basePairs.length}):*
${basePairs.map(p => `• ${p}`).join('\n')}
    `;
    
    if (customPairs.length > 0) {
      pairsText += this.lang === 'zh' ? `

*🔧 自定义交易对 (${customPairs.length}):*
${customPairs.map(p => `• ${p}`).join('\n')}
      ` : `

*🔧 Custom Pairs (${customPairs.length}):*
${customPairs.map(p => `• ${p}`).join('\n')}
      `;
    }
    
    if (aiPairs.length > 0) {
      pairsText += this.lang === 'zh' ? `

*🤖 AI 智能推荐 (${aiPairs.length}):*
${aiPairs.map(p => `• ${p}`).join('\n')}
      ` : `

*🤖 AI Recommendations (${aiPairs.length}):*
${aiPairs.map(p => `• ${p}`).join('\n')}
      `;
    }
    
    pairsText += this.lang === 'zh' ? `

💡 *总计: ${basePairs.length + customPairs.length + aiPairs.length} 个交易对*
    ` : `

💡 *Total: ${basePairs.length + customPairs.length + aiPairs.length} pairs*
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '📊 运行状态' : '📊 Status', callback_data: 'status' },
          { text: this.lang === 'zh' ? '📝 历史记录' : '📝 History', callback_data: 'history' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, pairsText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // /history - Show historical opportunities
  handleHistory(msg) {
    const chatId = msg.chat.id;
    
    if (this.state.opportunityHistory.length === 0) {
      const noHistoryText = this.lang === 'zh' ? 
        '😴 *暂无历史记录*\n\n还没有发现套利机会。我会持续监控，一旦发现机会就会通知你！' :
        '😴 *No History Yet*\n\nNo arbitrage opportunities found yet. I\'m continuously monitoring and will notify you as soon as I find one!';
      
      this.bot.sendMessage(chatId, noHistoryText, { parse_mode: 'Markdown' });
      return;
    }
    
    const recent = this.state.opportunityHistory.slice(-5).reverse();
    
    let historyText = this.lang === 'zh' ? `
📝 *历史套利机会*

*总计: ${this.state.opportunityHistory.length} 个机会*

*最近 5 个:*

` : `
📝 *Historical Opportunities*

*Total: ${this.state.opportunityHistory.length} opportunities*

*Recent 5:*

`;
    
    recent.forEach((opp, index) => {
      const time = new Date(opp.timestamp).toLocaleString(this.lang === 'zh' ? 'zh-CN' : 'en-US');
      historyText += this.lang === 'zh' ? `
${index + 1}. *${opp.pair1} / ${opp.pair2}*
   价差: ${opp.spread}% | 风险: ${opp.riskLevel}
   时间: ${time}

` : `
${index + 1}. *${opp.pair1} / ${opp.pair2}*
   Spread: ${opp.spread}% | Risk: ${opp.riskLevel}
   Time: ${time}

`;
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: 'history' },
          { text: this.lang === 'zh' ? '📊 运行状态' : '📊 Status', callback_data: 'status' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, historyText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // /help - Show help
  handleHelp(msg) {
    const chatId = msg.chat.id;
    
    const helpText = this.lang === 'zh' ? `
❓ *帮助信息*

*📋 可用命令:*

/start - 开始使用
/status - 查看运行状态
/pairs - 查看监控的交易对
/history - 查看历史机会
/lang en - 切换到英文
/lang zh - 切换到中文
/help - 显示此帮助

*🎯 功能说明:*

• *实时监控*: 我会 24/7 监控你配置的交易对
• *套利检测*: 当价差超过阈值时立即通知
• *风险评估*: 每个机会都有风险等级（低/中/高）
• *AI 推荐*: 可选的 AI 智能体推荐交易对

*💡 使用提示:*

1. 确保已配置 config.json
2. 我会自动运行，无需手动操作
3. 发现机会时会立即推送通知
4. 使用 /status 查看运行状态

*🔒 安全提示:*

• 只使用只读 API 密钥
• 不要分享你的 Bot Token
• 定期检查 API 密钥权限

*📞 需要帮助？*

Telegram: @Ee_7t
GitHub: github.com/pjl914335852-ux/openclaw-trading-scout

💰 由 NOFX 社区精准数据支持
    ` : `
❓ *Help Information*

*📋 Available Commands:*

/start - Get started
/status - View running status
/pairs - View monitored pairs
/history - View historical opportunities
/lang en - Switch to English
/lang zh - Switch to Chinese
/help - Show this help

*🎯 Features:*

• *Real-time Monitoring*: 24/7 monitoring of your configured pairs
• *Arbitrage Detection*: Instant notification when spread exceeds threshold
• *Risk Assessment*: Each opportunity has a risk level (low/medium/high)
• *AI Recommendations*: Optional AI agent recommended pairs

*💡 Usage Tips:*

1. Make sure config.json is configured
2. I run automatically, no manual operation needed
3. You'll get instant notifications when opportunities are found
4. Use /status to check running status

*🔒 Security Tips:*

• Only use read-only API keys
• Don't share your Bot Token
• Regularly check API key permissions

*📞 Need Help?*

Telegram: @Ee_7t
GitHub: github.com/pjl914335852-ux/openclaw-trading-scout

💰 Powered by NOFX Community Data
    `;
    
    this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }
  
  // Handle language change
  handleLanguage(msg, lang) {
    const chatId = msg.chat.id;
    
    if (lang !== 'en' && lang !== 'zh') {
      this.bot.sendMessage(chatId, 'Usage: /lang en or /lang zh');
      return;
    }
    
    this.lang = lang;
    
    const successText = lang === 'zh' ?
      '✅ 语言已切换到中文\n\n使用 /help 查看帮助信息' :
      '✅ Language switched to English\n\nUse /help for help information';
    
    this.bot.sendMessage(chatId, successText);
  }
  
  // Handle inline keyboard callbacks
  handleCallback(query) {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    // Answer callback to remove loading state
    this.bot.answerCallbackQuery(query.id);
    
    // Handle different callbacks
    if (data === 'status') {
      this.handleStatus({ chat: { id: chatId } });
    } else if (data === 'pairs') {
      this.handlePairs({ chat: { id: chatId } });
    } else if (data === 'history') {
      this.handleHistory({ chat: { id: chatId } });
    } else if (data === 'help') {
      this.handleHelp({ chat: { id: chatId } });
    } else if (data === 'lang_en') {
      this.handleLanguage({ chat: { id: chatId } }, 'en');
    } else if (data === 'lang_zh') {
      this.handleLanguage({ chat: { id: chatId } }, 'zh');
    }
  }
  
  // Helper methods
  getAllPairs() {
    const basePairs = this.config.trading.pairs || [];
    const customPairs = this.config.trading.customPairs || [];
    const aiPairs = this.getAIRecommendations();
    return [...new Set([...basePairs, ...customPairs, ...aiPairs])];
  }
  
  getAIRecommendations() {
    if (!this.config.aiAgent?.enabled) return [];
    const AI_AGENT_RECOMMENDATIONS = {
      trending: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'],
      defi: ['UNIUSDT', 'AAVEUSDT', 'LINKUSDT', 'MKRUSDT'],
      layer2: ['MATICUSDT', 'ARBUSDT', 'OPUSDT'],
      meme: ['DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT']
    };
    const category = this.config.aiAgent.category || 'trending';
    return AI_AGENT_RECOMMENDATIONS[category] || AI_AGENT_RECOMMENDATIONS.trending;
  }
}

module.exports = TelegramUI;
