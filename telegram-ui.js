// Telegram Bot Commands Handler
// 交易侦察员 Telegram 命令处理

const { t } = require('./i18n');

class TelegramUI {
  constructor(bot, config, state) {
    this.bot = bot;
    this.config = config;
    this.state = state;
    this.lang = config.language || 'en';
    this.pollingErrorCount = 0;
    this.lastPollingError = 0;
    
    this.setupErrorHandlers();
    this.setupCommands();
  }
  
  setupErrorHandlers() {
    // Handle polling errors without spamming logs
    this.bot.on('polling_error', (error) => {
      // Skip logging if suppressPollingErrors is enabled
      if (this.config.logging?.suppressPollingErrors) {
        return;
      }
      
      const now = Date.now();
      
      // Only log once per minute to avoid log spam
      if (now - this.lastPollingError > 60000) {
        console.error(`⚠️ Telegram polling error: ${error.code || error.message}`);
        
        if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
          console.error('💡 Tip: Make sure only one bot instance is running');
          console.error('💡 Waiting for Telegram to release the connection...');
        }
        
        this.lastPollingError = now;
        this.pollingErrorCount++;
        
        // If too many errors, suggest restart
        if (this.pollingErrorCount > 10) {
          console.error('❌ Too many polling errors. Consider restarting the bot.');
          this.pollingErrorCount = 0; // Reset counter
        }
      }
    });
    
    // Handle webhook errors
    this.bot.on('webhook_error', (error) => {
      console.error('⚠️ Telegram webhook error:', error.message);
    });
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
    
    // Handle text messages for pair/interval input
    this.bot.on('message', (msg) => {
      // Skip if it's a command
      if (msg.text && msg.text.startsWith('/')) return;
      
      this.handleTextInput(msg);
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

*💓 心跳功能：*

每 2 小时自动发送运行状态报告，让你知道我一直在工作！

*📋 可用命令：*

/status - 查看运行状态
/pairs - 管理交易对
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

*💓 Heartbeat Feature:*

Sends status report every 2 hours to let you know I'm working!

*📋 Available Commands:*

/status - View running status
/pairs - Manage trading pairs
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
          { text: this.lang === 'zh' ? '📈 交易对修改' : '📈 Modify Pairs', callback_data: 'pairs' }
        ],
        [
          { text: this.lang === 'zh' ? '📝 历史记录' : '📝 History', callback_data: 'history' },
          { text: this.lang === 'zh' ? '📅 上次摘要' : '📅 Last Summary', callback_data: 'last_summary' }
        ],
        [
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
    
    // Get current refresh interval (in seconds)
    const currentInterval = (this.config.trading.checkInterval || 60000) / 1000;
    const autoPushEnabled = this.config.trading.autoPush !== false; // default true
    const currentThreshold = this.config.trading.threshold || 0.5;
    
    let pairsText = this.lang === 'zh' ? `
📈 *交易对修改*

*🔹 基础交易对 (${basePairs.length}):*
${basePairs.map(p => `• ${p}`).join('\n')}
    ` : `
📈 *Modify Trading Pairs*

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

⚙️ *当前设置:*
• 刷新间隔: ${currentInterval}秒
• 套利阈值: ${currentThreshold}%
• 自动推送: ${autoPushEnabled ? '✅ 已启用' : '❌ 已禁用'}
    ` : `

💡 *Total: ${basePairs.length + customPairs.length + aiPairs.length} pairs*

⚙️ *Current Settings:*
• Refresh interval: ${currentInterval}s
• Threshold: ${currentThreshold}%
• Auto push: ${autoPushEnabled ? '✅ Enabled' : '❌ Disabled'}
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '➕ 添加币种' : '➕ Add Pair', callback_data: 'add_pair' },
          { text: this.lang === 'zh' ? '➖ 删除币种' : '➖ Remove Pair', callback_data: 'remove_pair' }
        ],
        [
          { text: this.lang === 'zh' ? '⏱️ 刷新间隔' : '⏱️ Refresh Interval', callback_data: 'set_interval' },
          { text: this.lang === 'zh' ? '🎯 套利阈值' : '🎯 Threshold', callback_data: 'set_threshold' }
        ],
        [
          { text: this.lang === 'zh' ? (autoPushEnabled ? '🔕 关闭推送' : '🔔 开启推送') : (autoPushEnabled ? '🔕 Disable Push' : '🔔 Enable Push'), callback_data: 'toggle_push' },
          { text: this.lang === 'zh' ? '📊 市场概览' : '📊 Market Overview', callback_data: 'market_overview' }
        ],
        [
          { text: this.lang === 'zh' ? '🧪 测试通知' : '🧪 Test Alert', callback_data: 'test_alert' },
          { text: this.lang === 'zh' ? '📝 历史记录' : '📝 History', callback_data: 'history' }
        ],
        [
          { text: this.lang === 'zh' ? '🏠 返回主菜单' : '🏠 Back to Menu', callback_data: 'start' }
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
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🏠 返回主菜单' : '🏠 Back to Menu', callback_data: 'start' },
            { text: this.lang === 'zh' ? '📊 运行状态' : '📊 Status', callback_data: 'status' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, noHistoryText, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
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
    
    const helpText1 = this.lang === 'zh' ? `
❓ *帮助 & 关于我们*

*🦞 关于 OpenClaw 交易侦察员*

我们是一个专注于加密货币套利监控的智能助手，由 NOFX 社区精准数据支持。

*🔧 工作原理:*

1. *实时监控*: 每 30 秒获取币安价格数据
2. *价差计算*: 对比不同交易对的价格变化
3. *套利检测*: 当价差超过 0.5% 时触发通知
4. *NOFX 增强*: 使用 NOFX 数据评估信号质量
5. *风险评估*: 根据交易量和波动性评估风险
6. *即时推送*: 发现机会立即发送 Telegram 通知

*💓 心跳功能:*

• 每 2 小时自动发送运行状态报告
• 显示运行时间、检查次数、发现机会数
• 让你知道机器人一直在工作
    ` : `
❓ *Help & About Us*

*🦞 About OpenClaw Trading Scout*

We are an intelligent assistant focused on cryptocurrency arbitrage monitoring, powered by NOFX community precision data.

*🔧 How It Works:*

1. *Real-time Monitoring*: Fetches Binance prices every 30s
2. *Spread Calculation*: Compares price changes across pairs
3. *Arbitrage Detection*: Triggers when spread exceeds 0.5%
4. *NOFX Enhancement*: Uses NOFX data to assess signal quality
5. *Risk Assessment*: Evaluates risk based on volume & volatility
6. *Instant Push*: Sends Telegram notification immediately

*💓 Heartbeat Feature:*

• Sends status report every 2 hours automatically
• Shows uptime, checks count, opportunities found
• Lets you know the bot is always working
    `;
    
    const helpText2 = this.lang === 'zh' ? `
*📋 可用命令:*

/start - 开始使用
/status - 查看运行状态
/pairs - 管理交易对
/history - 查看历史机会
/help - 显示此帮助

*🎯 核心功能:*

• 实时监控多个交易对
• 发现价差套利机会
• 评估风险等级
• 智能管理设置

*💡 使用提示:*

1. 点击"交易对修改"管理币种
2. 设置刷新间隔（推荐 30-60 秒）
3. 开启自动推送接收通知
4. 定期查看历史记录

*🔒 安全提示:*

• 只使用只读 API 密钥
• 不要分享 Bot Token
• 本机器人不会要求私钥

*📞 联系:* @Ee_7t
💰 由 NOFX 社区精准数据支持
    ` : `
*📋 Available Commands:*

/start - Get started
/status - View status
/pairs - Manage pairs
/history - View history
/help - Show help

*🎯 Core Features:*

• Real-time monitoring
• Arbitrage detection
• Risk assessment
• Smart management

*💡 Usage Tips:*

1. Click "Modify Pairs" to manage coins
2. Set refresh interval (30-60s recommended)
3. Enable auto push for notifications
4. Check history regularly

*🔒 Security:*

• Only use read-only API keys
• Don't share Bot Token
• Bot never asks for private keys

*📞 Contact:* @Ee_7t
💰 Powered by NOFX Community Data
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '🏠 返回主菜单' : '🏠 Back to Menu', callback_data: 'start' }
        ]
      ]
    };
    
    // Send first part with back button
    this.bot.sendMessage(chatId, helpText1, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    
    // Send second part with keyboard after a short delay
    setTimeout(() => {
      this.bot.sendMessage(chatId, helpText2, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    }, 500);
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
    const messageId = query.message.message_id;
    const data = query.data;
    
    // Answer callback to remove loading state
    this.bot.answerCallbackQuery(query.id);
    
    // Handle different callbacks
    if (data === 'start') {
      // Delete old message and send new start message
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handleStart({ chat: { id: chatId } });
    } else if (data === 'status') {
      // Delete old message and send new status
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handleStatus({ chat: { id: chatId } });
    } else if (data === 'pairs') {
      // Delete old message and send new pairs
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handlePairs({ chat: { id: chatId } });
    } else if (data === 'history') {
      // Delete old message and send new history
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handleHistory({ chat: { id: chatId } });
    } else if (data === 'help') {
      // Delete old message and send help
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handleHelp({ chat: { id: chatId } });
    } else if (data === 'lang_en') {
      // Switch language and update config
      this.lang = 'en';
      this.config.language = 'en';
      
      // Save config
      if (this.onConfigChange) {
        this.onConfigChange(this.config);
      }
      
      this.bot.answerCallbackQuery(query.id, { 
        text: '✅ Language switched to English',
        show_alert: false
      });
      // Delete old message and send new start message in English
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handleStart({ chat: { id: chatId } });
    } else if (data === 'lang_zh') {
      // Switch language and update config
      this.lang = 'zh';
      this.config.language = 'zh';
      
      // Save config
      if (this.onConfigChange) {
        this.onConfigChange(this.config);
      }
      
      this.bot.answerCallbackQuery(query.id, { 
        text: '✅ 语言已切换到中文',
        show_alert: false
      });
      // Delete old message and send new start message in Chinese
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handleStart({ chat: { id: chatId } });
    } else if (data === 'add_pair') {
      // Add custom pair
      this.handleAddPair(chatId, messageId, query.id);
    } else if (data === 'remove_pair') {
      // Remove custom pair
      this.handleRemovePair(chatId, messageId, query.id);
    } else if (data === 'set_interval') {
      // Set refresh interval
      this.handleSetInterval(chatId, messageId, query.id);
    } else if (data === 'toggle_push') {
      // Toggle auto push
      this.handleTogglePush(chatId, messageId, query.id);
    } else if (data === 'set_threshold') {
      // Set threshold
      this.handleSetThreshold(chatId, messageId, query.id);
    } else if (data === 'market_overview') {
      // Market overview
      this.handleMarketOverview(chatId, messageId, query.id);
    } else if (data === 'test_alert') {
      // Test alert
      this.handleTestAlert(chatId, messageId, query.id);
    } else if (data === 'last_summary') {
      // Last summary
      this.handleLastSummary(chatId, messageId, query.id);
    }
  }
  
  // Handle add pair
  handleAddPair(chatId, messageId, queryId) {
    const text = this.lang === 'zh' ? `
➕ *添加交易对*

请发送交易对名称，格式：BTCUSDT

⚠️ 注意：
• 必须是币安支持的交易对
• 格式必须正确（大写）
• 例如：ETHUSDT, BNBUSDT

发送 /cancel 取消操作
    ` : `
➕ *Add Trading Pair*

Please send the pair name, format: BTCUSDT

⚠️ Note:
• Must be a Binance supported pair
• Format must be correct (uppercase)
• Example: ETHUSDT, BNBUSDT

Send /cancel to cancel
    `;
    
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    
    // Set waiting state for next message
    this.state.waitingForPair = { chatId, action: 'add' };
  }
  
  // Handle remove pair
  handleRemovePair(chatId, messageId, queryId) {
    const customPairs = this.config.trading.customPairs || [];
    
    if (customPairs.length === 0) {
      const text = this.lang === 'zh' ? 
        '❌ 没有自定义交易对可以删除' :
        '❌ No custom pairs to remove';
      
      // Answer callback and delete old message
      this.bot.answerCallbackQuery(queryId, { text, show_alert: false });
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      
      // Send a proper message with back button
      const noCustomText = this.lang === 'zh' ? `
➖ *删除交易对*

❌ 暂无自定义交易对

你还没有添加任何自定义交易对。点击下方按钮添加或返回。
      ` : `
➖ *Remove Trading Pair*

❌ No Custom Pairs

You haven't added any custom pairs yet. Click below to add or go back.
      `;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '➕ 添加币种' : '➕ Add Pair', callback_data: 'add_pair' },
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, noCustomText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      return;
    }
    
    const text = this.lang === 'zh' ? `
➖ *删除交易对*

当前自定义交易对：
${customPairs.map((p, i) => `${i + 1}. ${p}`).join('\n')}

请发送要删除的交易对编号

发送 /cancel 取消操作
    ` : `
➖ *Remove Trading Pair*

Current custom pairs:
${customPairs.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Please send the number to remove

Send /cancel to cancel
    `;
    
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    
    // Set waiting state for next message
    this.state.waitingForPair = { chatId, action: 'remove' };
  }
  
  // Handle set interval
  handleSetInterval(chatId, messageId, queryId) {
    const MIN_INTERVAL = 10; // 10 seconds minimum
    const MAX_INTERVAL = 300; // 5 minutes maximum
    
    const text = this.lang === 'zh' ? `
⏱️ *设置刷新间隔*

当前间隔：${(this.config.trading.checkInterval || 60000) / 1000}秒

请发送新的刷新间隔（秒）

⚠️ 限制：
• 最小：${MIN_INTERVAL}秒
• 最大：${MAX_INTERVAL}秒
• 推荐：30-60秒

发送 /cancel 取消操作
    ` : `
⏱️ *Set Refresh Interval*

Current interval: ${(this.config.trading.checkInterval || 60000) / 1000}s

Please send the new refresh interval (seconds)

⚠️ Limits:
• Minimum: ${MIN_INTERVAL}s
• Maximum: ${MAX_INTERVAL}s
• Recommended: 30-60s

Send /cancel to cancel
    `;
    
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    
    // Set waiting state for next message
    this.state.waitingForInterval = { chatId };
  }
  
  // Handle toggle push
  handleTogglePush(chatId, messageId, queryId) {
    const currentState = this.config.trading.autoPush !== false;
    this.config.trading.autoPush = !currentState;
    
    // Save config
    if (this.onConfigChange) {
      this.onConfigChange(this.config);
    }
    
    const text = this.lang === 'zh' ? 
      (this.config.trading.autoPush ? '✅ 自动推送已启用' : '❌ 自动推送已禁用') :
      (this.config.trading.autoPush ? '✅ Auto push enabled' : '❌ Auto push disabled');
    
    // Answer callback with alert
    this.bot.answerCallbackQuery(queryId, { text, show_alert: false });
    
    // Just refresh the current message, don't create new one
    setTimeout(() => {
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handlePairs({ chat: { id: chatId } });
    }, 500);
  }
  
  // Handle set threshold
  handleSetThreshold(chatId, messageId, queryId) {
    const currentThreshold = this.config.trading.threshold || 0.5;
    const minThreshold = this.config.trading.minThreshold || 0.1;
    const maxThreshold = this.config.trading.maxThreshold || 1.0;
    
    const text = this.lang === 'zh' ? `
🎯 *设置套利阈值*

当前阈值: ${currentThreshold}%
范围: ${minThreshold}% - ${maxThreshold}%

请发送新的阈值（例如：0.3）

💡 提示：
• 阈值越低，触发机会越多
• 阈值越高，机会质量越好
• 推荐范围：0.3% - 0.5%

发送 /cancel 取消操作
    ` : `
🎯 *Set Arbitrage Threshold*

Current: ${currentThreshold}%
Range: ${minThreshold}% - ${maxThreshold}%

Please send new threshold (e.g., 0.3)

💡 Tips:
• Lower = more opportunities
• Higher = better quality
• Recommended: 0.3% - 0.5%

Send /cancel to cancel
    `;
    
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    
    // Set waiting state
    this.state.waitingForThreshold = { chatId };
  }
  
  // Handle market overview
  async handleMarketOverview(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? '📊 获取市场数据...' : '📊 Fetching market data...', show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const allPairs = this.getAllPairs();
      const prices = this.state.priceCache || {};
      const volumes = this.state.volumeCache || {};
      
      let overviewText = this.lang === 'zh' ? `
📊 *市场概览*

⏰ 更新时间: ${new Date().toLocaleString('zh-CN')}

` : `
📊 *Market Overview*

⏰ Updated: ${new Date().toLocaleString('en-US')}

`;
      
      for (const pair of allPairs) {
        const price = prices[pair];
        const volume = volumes[pair];
        const prevPrice = this.state.prevPriceCache?.[pair];
        
        if (price && volume) {
          const change = prevPrice ? ((price - prevPrice) / prevPrice * 100).toFixed(2) : '0.00';
          const changeEmoji = parseFloat(change) > 0 ? '📈' : parseFloat(change) < 0 ? '📉' : '➡️';
          const volumeM = (volume / 1000000).toFixed(1);
          
          overviewText += `${changeEmoji} *${pair}*\n`;
          overviewText += `   $${price.toLocaleString()} (${change}%)\n`;
          overviewText += `   ${this.lang === 'zh' ? '交易量' : 'Volume'}: $${volumeM}M\n\n`;
        }
      }
      
      overviewText += this.lang === 'zh' ? 
        `\n💡 数据每 30 秒更新一次` :
        `\n💡 Data updates every 30 seconds`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: 'market_overview' },
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, overviewText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      this.bot.sendMessage(chatId, this.lang === 'zh' ? 
        '❌ 获取市场数据失败' :
        '❌ Failed to fetch market data'
      );
    }
  }
  
  // Handle test alert
  handleTestAlert(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? '🧪 发送测试通知...' : '🧪 Sending test alert...', show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const testOpportunity = {
      pair1: 'BTCUSDT',
      pair2: 'ETHUSDT',
      spread: '0.75',
      change1: '1.2',
      change2: '0.45',
      suggestion: this.lang === 'zh' ? 'Buy ETHUSDT, Sell BTCUSDT' : 'Buy ETHUSDT, Sell BTCUSDT',
      riskLevel: this.lang === 'zh' ? '低' : 'low',
      nofx: {
        quality1: 85,
        quality2: 78,
        avgQuality: 81.5,
        flow1: 1234567,
        flow2: 987654,
        ai500Score1: 92,
        ai500Score2: 88
      },
      timestamp: new Date().toISOString()
    };
    
    const message = this.lang === 'zh' ? `
🧪 *测试通知 - 这是一个模拟套利机会*

🚨 *套利机会发现！*
_由 NOFX 精准数据驱动_

*交易对:* ${testOpportunity.pair1} / ${testOpportunity.pair2}
*价差:* ${testOpportunity.spread}%
*风险等级:* ${testOpportunity.riskLevel}

*价格变化:*
${testOpportunity.pair1}: ${testOpportunity.change1}%
${testOpportunity.pair2}: ${testOpportunity.change2}%

*💡 建议:* ${testOpportunity.suggestion}

*📊 NOFX 信号质量:*
• ${testOpportunity.pair1}: ${testOpportunity.nofx.quality1}/100 (AI: ${testOpportunity.nofx.ai500Score1})
• ${testOpportunity.pair2}: ${testOpportunity.nofx.quality2}/100 (AI: ${testOpportunity.nofx.ai500Score2})
• 平均质量: ${testOpportunity.nofx.avgQuality.toFixed(1)}/100

*💰 资金流 (1h):*
• ${testOpportunity.pair1}: $${testOpportunity.nofx.flow1.toLocaleString()}
• ${testOpportunity.pair2}: $${testOpportunity.nofx.flow2.toLocaleString()}

⏰ *时间:* ${new Date(testOpportunity.timestamp).toLocaleString('zh-CN')}

✅ *机器人工作正常！*
    `.trim() : `
🧪 *Test Alert - This is a simulated opportunity*

🚨 *Arbitrage Opportunity Found!*
_Powered by NOFX Precise Data_

*Pairs:* ${testOpportunity.pair1} / ${testOpportunity.pair2}
*Spread:* ${testOpportunity.spread}%
*Risk Level:* ${testOpportunity.riskLevel}

*Price Changes:*
${testOpportunity.pair1}: ${testOpportunity.change1}%
${testOpportunity.pair2}: ${testOpportunity.change2}%

*💡 Suggestion:* ${testOpportunity.suggestion}

*📊 NOFX Signal Quality:*
• ${testOpportunity.pair1}: ${testOpportunity.nofx.quality1}/100 (AI: ${testOpportunity.nofx.ai500Score1})
• ${testOpportunity.pair2}: ${testOpportunity.nofx.quality2}/100 (AI: ${testOpportunity.nofx.ai500Score2})
• Average Quality: ${testOpportunity.nofx.avgQuality.toFixed(1)}/100

*💰 Fund Flow (1h):*
• ${testOpportunity.pair1}: $${testOpportunity.nofx.flow1.toLocaleString()}
• ${testOpportunity.pair2}: $${testOpportunity.nofx.flow2.toLocaleString()}

⏰ *Time:* ${new Date(testOpportunity.timestamp).toLocaleString('en-US')}

✅ *Bot is working properly!*
    `.trim();
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle last summary
  handleLastSummary(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    if (!this.state.lastSummaryText) {
      const noSummaryText = this.lang === 'zh' ? `
📅 *上次摘要*

❌ 暂无摘要数据

机器人刚启动或还未生成第一次摘要。

💡 每日摘要时间：
• 早上 08:00
• 中午 12:00
• 晚上 20:00

请等待下一次自动推送，或查看市场概览。
      ` : `
📅 *Last Summary*

❌ No summary data yet

Bot just started or first summary not generated yet.

💡 Daily summary times:
• Morning 08:00
• Noon 12:00
• Evening 20:00

Wait for next auto-push or check market overview.
      `;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '📊 市场概览' : '📊 Market Overview', callback_data: 'market_overview' },
            { text: this.lang === 'zh' ? '🏠 返回' : '🏠 Back', callback_data: 'start' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, noSummaryText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      return;
    }
    
    // Send last summary with back button
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '📊 市场概览' : '📊 Market Overview', callback_data: 'market_overview' },
          { text: this.lang === 'zh' ? '🏠 返回' : '🏠 Back', callback_data: 'start' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, this.state.lastSummaryText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle text input for pair/interval
  handleTextInput(msg) {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();
    
    if (!text) return;
    
    // Handle add pair
    if (this.state.waitingForPair?.action === 'add' && this.state.waitingForPair.chatId === chatId) {
      if (text === '/cancel') {
        delete this.state.waitingForPair;
        this.bot.sendMessage(chatId, this.lang === 'zh' ? '❌ 已取消' : '❌ Cancelled');
        return;
      }
      
      const pair = text.toUpperCase();
      
      // Validate format
      if (!/^[A-Z]{3,10}USDT$/.test(pair)) {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          '❌ 格式错误！请使用正确格式，例如：BTCUSDT' :
          '❌ Invalid format! Please use correct format, e.g.: BTCUSDT'
        );
        return;
      }
      
      // Add to custom pairs
      if (!this.config.trading.customPairs) {
        this.config.trading.customPairs = [];
      }
      
      if (this.config.trading.customPairs.includes(pair)) {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          '⚠️ 该交易对已存在' :
          '⚠️ This pair already exists'
        );
        return;
      }
      
      this.config.trading.customPairs.push(pair);
      
      // Save config
      if (this.onConfigChange) {
        this.onConfigChange(this.config);
      }
      
      delete this.state.waitingForPair;
      
      this.bot.sendMessage(chatId, this.lang === 'zh' ? 
        `✅ 已添加交易对：${pair}` :
        `✅ Added pair: ${pair}`
      );
      
      // Show updated pairs
      setTimeout(() => {
        this.handlePairs({ chat: { id: chatId } });
      }, 1000);
      
      return;
    }
    
    // Handle remove pair
    if (this.state.waitingForPair?.action === 'remove' && this.state.waitingForPair.chatId === chatId) {
      if (text === '/cancel') {
        delete this.state.waitingForPair;
        this.bot.sendMessage(chatId, this.lang === 'zh' ? '❌ 已取消' : '❌ Cancelled');
        return;
      }
      
      const customPairs = this.config.trading.customPairs || [];
      let pairToRemove = null;
      
      // Only accept number (index)
      const index = parseInt(text);
      if (!isNaN(index) && index > 0 && index <= customPairs.length) {
        pairToRemove = customPairs[index - 1];
      } else {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          '❌ 请输入有效的编号（1-' + customPairs.length + '）' :
          '❌ Please enter a valid number (1-' + customPairs.length + ')'
        );
        return;
      }
      
      // Remove from custom pairs
      this.config.trading.customPairs = customPairs.filter(p => p !== pairToRemove);
      
      // Save config
      if (this.onConfigChange) {
        this.onConfigChange(this.config);
      }
      
      delete this.state.waitingForPair;
      
      this.bot.sendMessage(chatId, this.lang === 'zh' ? 
        `✅ 已删除交易对：${pairToRemove}` :
        `✅ Removed pair: ${pairToRemove}`
      );
      
      // Show updated pairs
      setTimeout(() => {
        this.handlePairs({ chat: { id: chatId } });
      }, 1000);
      
      return;
    }
    
    // Handle set interval
    if (this.state.waitingForInterval?.chatId === chatId) {
      if (text === '/cancel') {
        delete this.state.waitingForInterval;
        this.bot.sendMessage(chatId, this.lang === 'zh' ? '❌ 已取消' : '❌ Cancelled');
        return;
      }
      
      const MIN_INTERVAL = 10;
      const MAX_INTERVAL = 300;
      
      const interval = parseInt(text);
      
      if (isNaN(interval)) {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          '❌ 请输入有效的数字' :
          '❌ Please enter a valid number'
        );
        return;
      }
      
      if (interval < MIN_INTERVAL || interval > MAX_INTERVAL) {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          `❌ 间隔必须在 ${MIN_INTERVAL}-${MAX_INTERVAL} 秒之间` :
          `❌ Interval must be between ${MIN_INTERVAL}-${MAX_INTERVAL} seconds`
        );
        return;
      }
      
      // Update config
      this.config.trading.checkInterval = interval * 1000; // Convert to ms
      
      // Save config
      if (this.onConfigChange) {
        this.onConfigChange(this.config);
      }
      
      delete this.state.waitingForInterval;
      
      this.bot.sendMessage(chatId, this.lang === 'zh' ? 
        `✅ 刷新间隔已设置为 ${interval} 秒` :
        `✅ Refresh interval set to ${interval} seconds`
      );
      
      // Show updated pairs
      setTimeout(() => {
        this.handlePairs({ chat: { id: chatId } });
      }, 1000);
      
      return;
    }
    
    // Handle set threshold
    if (this.state.waitingForThreshold?.chatId === chatId) {
      if (text === '/cancel') {
        delete this.state.waitingForThreshold;
        this.bot.sendMessage(chatId, this.lang === 'zh' ? '❌ 已取消' : '❌ Cancelled');
        return;
      }
      
      const minThreshold = this.config.trading.minThreshold || 0.1;
      const maxThreshold = this.config.trading.maxThreshold || 1.0;
      
      const threshold = parseFloat(text);
      
      if (isNaN(threshold)) {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          '❌ 请输入有效的数字（例如：0.3）' :
          '❌ Please enter a valid number (e.g., 0.3)'
        );
        return;
      }
      
      if (threshold < minThreshold || threshold > maxThreshold) {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          `❌ 阈值必须在 ${minThreshold}%-${maxThreshold}% 之间` :
          `❌ Threshold must be between ${minThreshold}%-${maxThreshold}%`
        );
        return;
      }
      
      // Update config
      this.config.trading.threshold = threshold;
      
      // Save config
      if (this.onConfigChange) {
        this.onConfigChange(this.config);
      }
      
      delete this.state.waitingForThreshold;
      
      this.bot.sendMessage(chatId, this.lang === 'zh' ? 
        `✅ 套利阈值已设置为 ${threshold}%\n\n💡 阈值越低，触发机会越多` :
        `✅ Threshold set to ${threshold}%\n\n💡 Lower threshold = more opportunities`
      );
      
      // Show updated pairs
      setTimeout(() => {
        this.handlePairs({ chat: { id: chatId } });
      }, 1000);
      
      return;
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
