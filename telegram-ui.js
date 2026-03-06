// Telegram Bot Commands Handler
// 币安守护者 AI Telegram 命令处理

const { t } = require('./i18n');
const ScamDetector = require('./scam-detector');
const PlainTranslator = require('./plain-translator');
const SafetyLessons = require('./safety-lessons');

class TelegramUI {
  constructor(bot, config, state) {
    this.bot = bot;
    this.config = config;
    this.state = state;
    this.lang = config.language || 'en';
    this.pollingErrorCount = 0;
    this.lastPollingError = 0;
    
    // 初始化守护者功能模块
    this.scamDetector = new ScamDetector();
    this.plainTranslator = new PlainTranslator();
    this.safetyLessons = new SafetyLessons();
    
    // 初始化价格提醒管理器
    const PriceAlertsManager = require('./price-alerts');
    this.priceAlerts = new PriceAlertsManager(config);
    this.priceAlerts.onConfigChange = (cfg) => {
      if (this.onConfigChange) {
        this.onConfigChange(cfg);
      }
    };
    
    // 守护者模式（长辈模式）
    this.guardianMode = config.guardian?.enabled !== false; // 默认开启
    
    // 密码输入状态
    this.waitingForPassword = null;
    
    // 价格提醒输入状态
    this.waitingForAlert = null;
    
    this.setupErrorHandlers();
    this.setupCommands();
    this.startPriceAlertsMonitoring();
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
    
    // /guardian command - 切换守护者模式
    this.bot.onText(/\/guardian/, (msg) => {
      this.handleGuardianMode(msg);
    });
    
    // /check command - 检查币种安全性
    this.bot.onText(/\/check (.+)/, (msg, match) => {
      this.handleCheckCoin(msg, match[1]);
    });
    
    // /translate command - 翻译术语
    this.bot.onText(/\/translate (.+)/, (msg, match) => {
      this.handleTranslate(msg, match[1]);
    });
    
    // /lesson command - 查看今日课程
    this.bot.onText(/\/lesson/, (msg) => {
      this.handleLesson(msg);
    });
    
    // 监听所有文本消息（智能识别）
    this.bot.on('message', (msg) => {
      // 跳过命令消息
      if (msg.text && msg.text.startsWith('/')) {
        return;
      }
      
      // 智能识别用户意图
      this.handleSmartMessage(msg);
    });
    
    // /system command
    this.bot.onText(/\/system/, (msg) => {
      this.handleSystem(msg);
    });
    
    // Inline keyboard callbacks
    this.bot.on('callback_query', async (query) => {
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
🛡️ *欢迎使用 Binance Guardian AI！*

我是你的加密货币安全助手，专为新手和长辈设计。

*🎯 我能帮你：*

• 🛡️ 检查币种安全性
• 🗣️ 翻译专业术语
• 📚 学习安全知识
• 💼 监控账户异常
• 🔔 风险预警提醒

*💡 快速开始：*

💬 你可以这样问我：
• "XX币安全吗？"
• "XX是什么？"
• "怎么防骗？"
• "今天学什么？"

*🛡️ 守护者模式：*

当前状态: ${this.guardianMode ? '✅ 已开启（安全保护中）' : '❌ 已关闭'}

${this.guardianMode ? `💡 *守护者正在保护你：*
• 自动识别诈骗币
• 拦截可疑操作
• 翻译专业术语
• 每日安全课程
• 简化界面` : '⚠️ 关闭守护模式需要密码验证'}

点击下方按钮快速访问功能 👇
    ` : `
🛡️ *Welcome to Binance Guardian AI!*

I'm your crypto safety assistant, designed for beginners and elderly users.

*🎯 I can help you:*

• 🛡️ Check coin safety
• 🗣️ Translate technical terms
• 📚 Learn safety knowledge
• 💼 Monitor account anomalies
• 🔔 Risk alert notifications

*💡 Quick Start:*

💬 You can ask me like this:
• "Is XX coin safe?"
• "What is XX?"
• "How to prevent scams?"
• "What to learn today?"

*🛡️ Guardian Mode:*

Current status: ${this.guardianMode ? '✅ Enabled (Protected)' : '❌ Disabled'}

${this.guardianMode ? `💡 *Guardian is protecting you:*
• Auto-detect scam coins
• Block suspicious operations
• Translate technical terms
• Daily safety lessons
• Simplified interface` : '⚠️ Password required to disable guardian mode'}

Click buttons below for quick access 👇
    `;
    
    // 根据守护模式显示不同的菜单
    let keyboard;
    
    if (this.guardianMode) {
      // 守护模式：简化菜单，只显示安全功能
      keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🛡️ 检查币种' : '🛡️ Check Coin', callback_data: 'check_coin' },
            { text: this.lang === 'zh' ? '📚 今日课程' : '📚 Today\'s Lesson', callback_data: 'today_lesson' }
          ],
          [
            { text: this.lang === 'zh' ? '💼 币安账户' : '💼 Binance Account', callback_data: 'binance_account' },
            { text: this.lang === 'zh' ? '📊 市场概览' : '📊 Market Overview', callback_data: 'market_overview' }
          ],
          [
            { text: this.lang === 'zh' ? '💻 系统监控' : '💻 System', callback_data: 'system' },
            { text: this.lang === 'zh' ? '❓ 帮助' : '❓ Help', callback_data: 'help' }
          ],
          [
            { text: this.lang === 'zh' ? '🇬🇧 English' : '🇨🇳 中文', callback_data: this.lang === 'zh' ? 'lang_en' : 'lang_zh' },
            { text: this.lang === 'zh' ? '🛡️ 守护模式: 开启' : '🛡️ Guardian: ON', callback_data: 'toggle_guardian' }
          ]
        ]
      };
    } else {
      // 专业模式：完整功能菜单
      keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🛡️ 检查币种' : '🛡️ Check Coin', callback_data: 'check_coin' },
            { text: this.lang === 'zh' ? '📚 今日课程' : '📚 Today\'s Lesson', callback_data: 'today_lesson' }
          ],
          [
            { text: this.lang === 'zh' ? '💼 币安账户' : '💼 Binance Account', callback_data: 'binance_account' },
            { text: this.lang === 'zh' ? '📊 市场概览' : '📊 Market Overview', callback_data: 'market_overview' }
          ],
          [
            { text: this.lang === 'zh' ? '📈 交易对' : '📈 Pairs', callback_data: 'pairs' },
            { text: this.lang === 'zh' ? '📝 历史记录' : '📝 History', callback_data: 'history' }
          ],
          [
            { text: this.lang === 'zh' ? '🎯 套利阈值' : '🎯 Threshold', callback_data: 'set_threshold' },
            { text: this.lang === 'zh' ? '⏱️ 刷新间隔' : '⏱️ Interval', callback_data: 'set_interval' }
          ],
          [
            { text: this.lang === 'zh' ? '🔔 推送开关' : '🔔 Push', callback_data: 'toggle_push' },
            { text: this.lang === 'zh' ? '⏰ 价格提醒' : '⏰ Price Alerts', callback_data: 'price_alerts' }
          ],
          [
            { text: this.lang === 'zh' ? '💻 系统监控' : '💻 System', callback_data: 'system' },
            { text: this.lang === 'zh' ? '❓ 帮助' : '❓ Help', callback_data: 'help' }
          ],
          [
            { text: this.lang === 'zh' ? '🇬🇧 English' : '🇨🇳 中文', callback_data: this.lang === 'zh' ? 'lang_en' : 'lang_zh' },
            { text: this.lang === 'zh' ? '⚙️ 专业模式: 开启' : '⚙️ Pro Mode: ON', callback_data: 'toggle_guardian' }
          ]
        ]
      };
    }
    
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
          { text: this.lang === 'zh' ? '🔥 AI500排行' : '🔥 AI500 Ranking', callback_data: 'ai500_ranking' },
          { text: this.lang === 'zh' ? '🧪 测试通知' : '🧪 Test Alert', callback_data: 'test_alert' }
        ],
        [
          { text: this.lang === 'zh' ? '📝 历史记录' : '📝 History', callback_data: 'history' },
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

*🛡️ 关于 Binance Guardian AI*

我们是一个专为加密货币新手和长辈设计的 AI 安全助手，基于 OpenClaw 框架开发。

*🎯 核心功能:*

1. *骗局识别*: 跨境诈骗数据库交叉比对
2. *人话翻译*: 专业术语翻译成大白话
3. *安全课堂*: 每日一课，30 天掌握基础
4. *资产守护*: 实时监控账户安全
5. *风险预警*: 市场异动及时提醒

*🛡️ 守护者模式:*

• 长辈友好的交互方式
• 自动识别币种风险
• 智能翻译专业术语
• 每日安全知识推送
    ` : `
❓ *Help & About Us*

*🛡️ About Binance Guardian AI*

We are an AI safety assistant designed for crypto beginners and elderly users, built on OpenClaw framework.

*🎯 Core Features:*

1. *Scam Detection*: Cross-referencing global scam databases
2. *Plain Translation*: Technical terms to simple language
3. *Safety Lessons*: Daily lessons, master basics in 30 days
4. *Asset Guardian*: Real-time account monitoring
5. *Risk Alerts*: Market anomaly notifications

*🛡️ Guardian Mode:*

• Elderly-friendly interaction
• Auto-detect coin risks
• Smart term translation
• Daily safety knowledge push
    `;
    
    const helpText2 = this.lang === 'zh' ? `
*📋 可用命令:*

/start - 开始使用
/guardian - 切换守护者模式
/check <币名> - 检查币种安全性
/translate <术语> - 翻译专业术语
/lesson - 查看今日课程
/help - 显示此帮助

*🎯 快速开始:*

💬 你可以这样问我：
• 关于币种："XX币安全吗？" "XX币能买吗？"
• 关于功能："XX是什么？" "怎么用XX？"
• 关于安全："怎么防骗？" "如何保护资产？"
• 关于学习："今天学什么？" "有什么课程？"

💡 提示：直接说出你的问题，我会理解并帮助你

*💡 使用提示:*

1. 守护者模式适合新手和长辈
2. 专业模式提供更多技术功能
3. 可以随时切换模式
4. 有问题直接问我

*🔒 安全保证:*

• 只使用只读 API 密钥
• 永不接触私钥和助记词
• 不会要求转账
• 100% 开源透明

*📞 联系:* @Ee_7t
🛡️ 让加密货币投资更安全
    ` : `
*📋 Available Commands:*

/start - Get started
/guardian - Toggle guardian mode
/check <coin> - Check coin safety
/translate <term> - Translate term
/lesson - Today's lesson
/help - Show help

*🎯 Quick Start:*

💬 You can ask me like this:
• About coins: "Is XX coin safe?" "Can I buy XX?"
• About features: "What is XX?" "How to use XX?"
• About safety: "How to prevent scams?" "How to protect assets?"
• About learning: "What to learn today?" "Any courses?"

💡 Tip: Just ask your question, I'll understand and help

*💡 Usage Tips:*

1. Guardian mode for beginners & elderly
2. Professional mode for advanced features
3. Switch modes anytime
4. Ask me anything

*🔒 Security Guarantee:*

• Read-only API keys only
• Never touch private keys
• No transfer requests
• 100% open source

*📞 Contact:* @Ee_7t
🛡️ Making crypto investment safer
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
  
  // /system - Show system monitor
  async handleSystem(msg) {
    const chatId = msg.chat.id;
    
    try {
      const { execSync } = require('child_process');
      
      // Get system info
      const memInfo = execSync('free -h | grep Mem').toString().trim().split(/\s+/);
      const diskInfo = execSync('df -h / | tail -1').toString().trim().split(/\s+/);
      const uptimeInfo = execSync('uptime').toString().trim();
      const cpuInfo = execSync('top -bn1 | grep "Cpu(s)"').toString().trim();
      
      // Parse data
      const memTotal = memInfo[1];
      const memUsed = memInfo[2];
      const memFree = memInfo[3];
      const memAvail = memInfo[6];
      
      const diskSize = diskInfo[1];
      const diskUsed = diskInfo[2];
      const diskAvail = diskInfo[3];
      const diskUse = diskInfo[4];
      
      // Parse uptime
      const uptimeMatch = uptimeInfo.match(/up\s+(.+?),\s+\d+\s+user/);
      const uptime = uptimeMatch ? uptimeMatch[1] : 'unknown';
      
      // Parse load average
      const loadMatch = uptimeInfo.match(/load average:\s+([\d.]+),\s+([\d.]+),\s+([\d.]+)/);
      const load1 = loadMatch ? loadMatch[1] : '0';
      const load5 = loadMatch ? loadMatch[2] : '0';
      const load15 = loadMatch ? loadMatch[3] : '0';
      
      // Parse CPU
      const cpuMatch = cpuInfo.match(/([\d.]+)\s+us,\s+([\d.]+)\s+sy/);
      const cpuUser = cpuMatch ? cpuMatch[1] : '0';
      const cpuSys = cpuMatch ? cpuMatch[2] : '0';
      const cpuTotal = (parseFloat(cpuUser) + parseFloat(cpuSys)).toFixed(1);
      
      // Get bot process info
      const botPid = process.pid;
      const botMem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      
      const systemText = this.lang === 'zh' ? `
💻 *系统监控*

⏰ *运行时间:* ${uptime}

*📊 CPU 使用率:*
• 总计: ${cpuTotal}%
• 用户: ${cpuUser}%
• 系统: ${cpuSys}%
• 负载: ${load1} / ${load5} / ${load15}

*🧠 内存使用:*
• 总计: ${memTotal}
• 已用: ${memUsed}
• 可用: ${memAvail}
• 空闲: ${memFree}

*💾 磁盘使用:*
• 总计: ${diskSize}
• 已用: ${diskUsed} (${diskUse})
• 可用: ${diskAvail}

*🤖 机器人进程:*
• PID: ${botPid}
• 内存: ${botMem} MB

💡 系统运行正常
      `.trim() : `
💻 *System Monitor*

⏰ *Uptime:* ${uptime}

*📊 CPU Usage:*
• Total: ${cpuTotal}%
• User: ${cpuUser}%
• System: ${cpuSys}%
• Load: ${load1} / ${load5} / ${load15}

*🧠 Memory Usage:*
• Total: ${memTotal}
• Used: ${memUsed}
• Available: ${memAvail}
• Free: ${memFree}

*💾 Disk Usage:*
• Total: ${diskSize}
• Used: ${diskUsed} (${diskUse})
• Available: ${diskAvail}

*🤖 Bot Process:*
• PID: ${botPid}
• Memory: ${botMem} MB

💡 System running normally
      `.trim();
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: 'system' },
            { text: this.lang === 'zh' ? '🏠 返回' : '🏠 Back', callback_data: 'start' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, systemText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      const errorText = this.lang === 'zh' ?
        '❌ 获取系统信息失败' :
        '❌ Failed to get system info';
      this.bot.sendMessage(chatId, errorText);
    }
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
    } else if (data === 'system') {
      // Delete old message and send system info
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handleSystem({ chat: { id: chatId } });
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
    } else if (data === 'check_coin') {
      // Check coin safety
      this.bot.answerCallbackQuery(query.id);
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      
      const promptText = this.lang === 'zh' ? 
        '🛡️ *检查币种安全性*\n\n请输入币种名称（如：BTC、ETH、DOGE）：' :
        '🛡️ *Check Coin Safety*\n\nPlease enter coin name (e.g., BTC, ETH, DOGE):';
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'start' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, promptText, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } else if (data === 'today_lesson') {
      // Today's lesson
      this.bot.answerCallbackQuery(query.id);
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      this.handleLesson({ chat: { id: chatId } });
      
    } else if (data === 'toggle_guardian') {
      // Toggle guardian mode with password protection
      this.bot.answerCallbackQuery(query.id);
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      
      if (this.guardianMode) {
        // 关闭守护模式 - 需要密码
        if (!this.config.guardian.passwordSet) {
          // 首次设置密码
          const text = this.lang === 'zh' ? `
🔐 *设置守护者密码*

⚠️ *重要提示：这是第一次设置密码，不是验证！*

为了保护你的安全，关闭守护者模式需要密码验证。

🛡️ *守护者模式保护你：*
• 自动识别诈骗币和高风险项目
• 拦截可疑交易和异常操作
• 翻译专业术语成大白话
• 每日安全知识教育
• 简化界面，隐藏高风险功能

请设置一个 4-6 位数字密码：

⚠️ 注意：
• 这是第一次输入，是设置密码
• 请牢记这个密码
• 密码用于关闭守护者模式
• 不要告诉任何人

请输入密码（4-6位数字）：
          `.trim() : `
🔐 *Set Guardian Password*

⚠️ *IMPORTANT: This is your FIRST TIME setting password, not verification!*

To protect your safety, disabling guardian mode requires password verification.

🛡️ *Guardian Mode Protects You:*
• Auto-detect scam coins and high-risk projects
• Block suspicious transactions and anomalies
• Translate technical terms to plain language
• Daily safety education
• Simplified interface, hide high-risk features

Please set a 4-6 digit password:

⚠️ Note:
• This is FIRST TIME input, setting password
• Remember this password
• Password is used to disable guardian mode
• Don't tell anyone

Please enter password (4-6 digits):
          `.trim();
          
          const keyboard = {
            inline_keyboard: [
              [
                { text: this.lang === 'zh' ? '🔙 取消' : '🔙 Cancel', callback_data: 'start' }
              ]
            ]
          };
          
          this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
          
          // 等待用户输入密码
          this.waitingForPassword = { chatId, action: 'set' };
        } else {
          // 验证密码
          const text = this.lang === 'zh' ? `
🔐 *验证守护者密码*

请输入密码以关闭守护者模式：

⚠️ 关闭守护者模式后：
• 将显示所有高风险功能
• 不再自动拦截风险操作
• 建议仅在必要时关闭

请输入密码：
          `.trim() : `
🔐 *Verify Guardian Password*

Please enter password to disable guardian mode:

⚠️ After disabling guardian mode:
• All high-risk features will be shown
• No auto-blocking of risky operations
• Recommended to disable only when necessary

Please enter password:
          `.trim();
          
          const keyboard = {
            inline_keyboard: [
              [
                { text: this.lang === 'zh' ? '🔙 取消' : '🔙 Cancel', callback_data: 'start' }
              ]
            ]
          };
          
          this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
          
          // 等待用户输入密码
          this.waitingForPassword = { chatId, action: 'verify' };
        }
      } else {
        // 开启守护模式 - 不需要密码
        this.guardianMode = true;
        this.config.guardian.enabled = true;
        this.saveConfig();
        
        const text = this.lang === 'zh' ? 
          '✅ 已开启守护者模式\n\n💡 守护者模式会自动拦截风险操作，保护你的资产安全' :
          '✅ Guardian mode enabled\n\n💡 Guardian mode will auto-block risky operations to protect your assets';
        
        this.bot.sendMessage(chatId, text);
        
        // 刷新主菜单
        setTimeout(() => {
          this.handleStart({ chat: { id: chatId } });
        }, 1000);
      }
      
    } else if (data === 'past_lessons') {
      // Past lessons menu
      this.bot.answerCallbackQuery(query.id);
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      
      const text = this.lang === 'zh' ? `
📚 *往期课程*

选择你想查看的课程：

*第 1-7 天：基础安全知识*
• 第 1 课：如何识别诈骗币？
• 第 2 课：如何设置安全的密码？
• 第 3 课：什么是双重验证（2FA）？
• 第 4 课：如何识别钓鱼网站？
• 第 5 课：什么是私钥？为什么重要？
• 第 6 课：如何安全存储加密货币？
• 第 7 课：什么是助记词？

*第 8-14 天：交易基础*
• 第 8 课：什么是现货交易？
• 第 9 课：什么是合约交易？（警告）
• 第 10 课：如何设置止损？

发送课程编号（1-10）查看详细内容
      `.trim() : `
📚 *Past Lessons*

Choose the lesson you want to view:

*Day 1-7: Basic Safety*
• Lesson 1: How to Identify Scam Coins?
• Lesson 2: How to Set a Secure Password?
• Lesson 3: What is 2FA?
• Lesson 4: How to Identify Phishing Sites?
• Lesson 5: What is Private Key?
• Lesson 6: How to Store Crypto Safely?
• Lesson 7: What is Seed Phrase?

*Day 8-14: Trading Basics*
• Lesson 8: What is Spot Trading?
• Lesson 9: What is Futures Trading? (Warning)
• Lesson 10: How to Set Stop Loss?

Send lesson number (1-10) to view details
      `.trim();
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '1', callback_data: 'lesson_1' },
            { text: '2', callback_data: 'lesson_2' },
            { text: '3', callback_data: 'lesson_3' },
            { text: '4', callback_data: 'lesson_4' },
            { text: '5', callback_data: 'lesson_5' }
          ],
          [
            { text: '6', callback_data: 'lesson_6' },
            { text: '7', callback_data: 'lesson_7' },
            { text: '8', callback_data: 'lesson_8' },
            { text: '9', callback_data: 'lesson_9' },
            { text: '10', callback_data: 'lesson_10' }
          ],
          [
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'start' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } else if (data.startsWith('lesson_')) {
      // View specific lesson
      const lessonNum = parseInt(data.split('_')[1]);
      this.bot.answerCallbackQuery(query.id);
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      
      const lesson = this.safetyLessons.getLesson(lessonNum, this.lang);
      const message = this.safetyLessons.generateLessonMessage(lesson, this.lang);
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '📚 查看其他课程' : '📚 Other Lessons', callback_data: 'past_lessons' },
            { text: this.lang === 'zh' ? '🎓 进阶课程' : '🎓 Advanced', callback_data: 'advanced_lessons' }
          ],
          [
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'start' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } else if (data === 'advanced_lessons') {
      // Advanced lessons menu
      this.bot.answerCallbackQuery(query.id);
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      
      const topics = this.safetyLessons.getAdvancedTopics(this.lang);
      
      const text = this.lang === 'zh' ? `
🎓 *进阶安全课程*

选择你想深入学习的主题：

${topics.map((t, i) => `${i + 1}. *${t.name}*\n   ${t.desc}`).join('\n\n')}

💡 *说明：*
这些课程会推荐专业的 Web3 安全资源，
包括 CertiK、SlowMist、Binance Academy 等
权威机构的公开内容。

点击下方按钮选择主题 👇
      `.trim() : `
🎓 *Advanced Safety Courses*

Choose a topic to learn more:

${topics.map((t, i) => `${i + 1}. *${t.name}*\n   ${t.desc}`).join('\n\n')}

💡 *Note:*
These courses recommend professional Web3 security resources
from authoritative institutions like CertiK, SlowMist,
and Binance Academy.

Click buttons below to select a topic 👇
      `.trim();
      
      // 创建按钮（每行2个）
      const buttons = [];
      for (let i = 0; i < topics.length; i += 2) {
        const row = [];
        row.push({ 
          text: `${i + 1}. ${topics[i].name}`, 
          callback_data: `advanced_${topics[i].id}` 
        });
        if (i + 1 < topics.length) {
          row.push({ 
            text: `${i + 2}. ${topics[i + 1].name}`, 
            callback_data: `advanced_${topics[i + 1].id}` 
          });
        }
        buttons.push(row);
      }
      buttons.push([
        { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'past_lessons' }
      ]);
      
      const keyboard = { inline_keyboard: buttons };
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } else if (data.startsWith('advanced_')) {
      // View advanced topic
      const topicId = data.split('_')[1];
      this.bot.answerCallbackQuery(query.id);
      this.bot.deleteMessage(chatId, messageId).catch(() => {});
      
      const topics = this.safetyLessons.getAdvancedTopics(this.lang);
      const topic = topics.find(t => t.id === topicId);
      
      if (topic) {
        // 异步获取内容
        this.safetyLessons.searchWeb3SafetyContent(topic.name, this.lang).then(content => {
          const keyboard = {
            inline_keyboard: [
              [
                { text: this.lang === 'zh' ? '📚 其他主题' : '📚 Other Topics', callback_data: 'advanced_lessons' },
                { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'start' }
              ]
            ]
          };
          
          this.bot.sendMessage(chatId, content, {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
            disable_web_page_preview: true
          });
        }).catch(error => {
          console.error('❌ Failed to get advanced content:', error.message);
          const errorText = this.lang === 'zh' ? 
            '❌ 获取课程内容失败，请稍后重试' :
            '❌ Failed to get course content, please try again later';
          this.bot.sendMessage(chatId, errorText);
        });
      }
      
    } else if (data === 'binance_account') {
      // Binance account menu
      this.handleBinanceAccount(chatId, messageId, query.id);
    } else if (data.startsWith('spot_holdings')) {
      // Spot holdings with pagination
      const page = parseInt(data.split('_')[2]) || 0;
      this.handleSpotHoldings(chatId, messageId, query.id, page);
    } else if (data.startsWith('futures_positions')) {
      // Futures positions with pagination
      const page = parseInt(data.split('_')[2]) || 0;
      this.handleFuturesPositions(chatId, messageId, query.id, page);
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
    } else if (data === 'ai500_ranking') {
      // AI500 ranking
      this.handleAI500Ranking(chatId, messageId, query.id);
    } else if (data === 'last_summary') {
      // Last summary
      this.handleLastSummary(chatId, messageId, query.id);
    } else if (data === 'deposit_history') {
      // Deposit history
      this.handleDepositHistory(chatId, messageId, query.id);
    } else if (data === 'withdraw_history') {
      // Withdraw history
      this.handleWithdrawHistory(chatId, messageId, query.id);
    } else if (data === 'deposit_address') {
      // Deposit address
      this.handleDepositAddress(chatId, messageId, query.id);
    } else if (data === 'spot_trades') {
      // Spot trades
      this.handleSpotTrades(chatId, messageId, query.id);
    } else if (data === 'futures_trades') {
      // Futures trades
      this.handleFuturesTrades(chatId, messageId, query.id);
    } else if (data.startsWith('deposit_addr_')) {
      // Specific coin deposit address
      const coin = data.replace('deposit_addr_', '');
      this.handleSpecificDepositAddress(chatId, messageId, query.id, coin);
    } else if (data === 'kline_chart') {
      // K-line chart
      this.handleKlineChart(chatId, messageId, query.id);
    } else if (data.startsWith('kline_')) {
      // Specific pair K-line
      const pair = data.replace('kline_', '');
      this.handleSpecificKline(chatId, messageId, query.id, pair);
    } else if (data === 'market_depth') {
      // Market depth
      this.handleMarketDepth(chatId, messageId, query.id);
    } else if (data.startsWith('depth_')) {
      // Specific pair depth
      const pair = data.replace('depth_', '');
      this.handleSpecificDepth(chatId, messageId, query.id, pair);
    } else if (data === 'recent_trades') {
      // Recent trades
      this.handleRecentTrades(chatId, messageId, query.id);
    } else if (data.startsWith('trades_')) {
      // Specific pair trades
      const pair = data.replace('trades_', '');
      this.handleSpecificTrades(chatId, messageId, query.id, pair);
    } else if (data === 'price_alerts') {
      // Price alerts menu
      // Clear any waiting state
      if (this.waitingForAlert) {
        delete this.waitingForAlert;
      }
      this.handlePriceAlerts(chatId, messageId, query.id);
    } else if (data === 'add_alert') {
      // Add new alert
      this.handleAddAlert(chatId, messageId, query.id);
    } else if (data.startsWith('add_alert_')) {
      // Add alert for specific type
      const type = data.replace('add_alert_', '');
      this.handleAddAlertType(chatId, messageId, query.id, type);
    } else if (data.startsWith('alert_pair_')) {
      // Select pair for alert
      const pair = data.replace('alert_pair_', '');
      this.handleAlertPairSelected(chatId, messageId, query.id, pair);
    } else if (data.startsWith('remove_alert_')) {
      // Remove alert
      const alertId = data.replace('remove_alert_', '');
      this.handleRemoveAlert(chatId, messageId, query.id, alertId);
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
            { text: this.lang === 'zh' ? '📈 K线图' : '📈 K-Line', callback_data: 'kline_chart' },
            { text: this.lang === 'zh' ? '📊 深度数据' : '📊 Depth', callback_data: 'market_depth' }
          ],
          [
            { text: this.lang === 'zh' ? '💹 最新成交' : '💹 Recent Trades', callback_data: 'recent_trades' },
            { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: 'market_overview' }
          ],
          [
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'start' }
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
  
  // Handle AI500 ranking
  async handleAI500Ranking(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? '🔥 获取 AI500 排行...' : '🔥 Fetching AI500 ranking...', show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      // Check if NOFX API key is configured
      if (!this.config.nofx || !this.config.nofx.apiKey) {
        const errorText = this.lang === 'zh' ? 
          '❌ NOFX API 未配置\n\n请在 config.json 中添加 nofx.apiKey' :
          '❌ NOFX API not configured\n\nPlease add nofx.apiKey in config.json';
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
            ]
          ]
        };
        
        this.bot.sendMessage(chatId, errorText, { reply_markup: keyboard });
        return;
      }
      
      // Get high potential coins from NOFX
      const nofxApi = require('./nofx-api');
      const api = new nofxApi(this.config.nofx.apiKey);
      const highPotentialCoins = await api.getAI500List();
      
      if (!highPotentialCoins || highPotentialCoins.length === 0) {
        const noDataText = this.lang === 'zh' ? 
          '😴 暂无 AI500 高分币种数据' :
          '😴 No AI500 high-score coins data available';
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
            ]
          ]
        };
        
        this.bot.sendMessage(chatId, noDataText, { reply_markup: keyboard });
        return;
      }
      
      // Sort by AI500 score
      const sortedCoins = highPotentialCoins
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Top 10
      
      let rankingText = this.lang === 'zh' ? `
🔥 *AI500 热点币排行榜*

_NOFX AI500 高分币种 TOP ${sortedCoins.length}_

` : `
🔥 *AI500 Hot Coins Ranking*

_NOFX AI500 Top ${sortedCoins.length} High-Score Coins_

`;
      
      sortedCoins.forEach((coin, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const scoreEmoji = coin.score >= 80 ? '🔥' : coin.score >= 60 ? '⚡' : '💫';
        
        rankingText += `${medal} *${coin.pair}* ${scoreEmoji}\n`;
        rankingText += `   AI500: ${coin.score.toFixed(1)}`;
        
        if (coin.increase_percent !== undefined) {
          const changeEmoji = coin.increase_percent > 0 ? '📈' : '➡️';
          rankingText += ` | ${changeEmoji} +${coin.increase_percent.toFixed(2)}%`;
        }
        
        rankingText += '\n';
        
        if (coin.start_price) {
          rankingText += `   ${this.lang === 'zh' ? '起始价' : 'Start'}: $${coin.start_price.toFixed(6)}`;
        }
        if (coin.max_price) {
          rankingText += ` | ${this.lang === 'zh' ? '最高价' : 'Max'}: $${coin.max_price.toFixed(6)}`;
        }
        
        rankingText += '\n\n';
      });
      
      rankingText += this.lang === 'zh' ? 
        '\n💡 AI500 分数越高，表示该币种潜力越大\n📊 数据来源: NOFX 社区' :
        '\n💡 Higher AI500 score indicates greater potential\n📊 Data source: NOFX Community';
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: 'ai500_ranking' },
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, rankingText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } catch (error) {
      console.error('❌ Failed to get AI500 ranking:', error.message);
      
      const errorText = this.lang === 'zh' ? 
        '❌ 获取 AI500 排行失败\n\n请稍后重试' :
        '❌ Failed to get AI500 ranking\n\nPlease try again later';
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'pairs' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, errorText, { reply_markup: keyboard });
    }
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
    
    // Handle password input
    if (this.waitingForPassword && this.waitingForPassword.chatId === chatId) {
      const action = this.waitingForPassword.action;
      delete this.waitingForPassword;
      
      // Validate password format (4-6 digits)
      if (!/^\d{4,6}$/.test(text)) {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          '❌ 密码格式错误！请输入 4-6 位数字' :
          '❌ Invalid password format! Please enter 4-6 digits'
        );
        return;
      }
      
      if (action === 'set') {
        // 设置密码
        this.config.guardian.password = text;
        this.config.guardian.passwordSet = true;
        this.saveConfig();
        
        const successText = this.lang === 'zh' ? `
✅ *密码设置成功！*

你的守护者密码已设置为：\`${text}\`

⚠️ 请务必记住这个密码！

💡 下次关闭守护者模式时需要输入此密码。
        `.trim() : `
✅ *Password set successfully!*

Your guardian password is set to: \`${text}\`

⚠️ Please remember this password!

💡 You'll need to enter this password to disable guardian mode next time.
        `.trim();
        
        this.bot.sendMessage(chatId, successText, { parse_mode: 'Markdown' });
        
        // 刷新主菜单
        setTimeout(() => {
          this.handleStart({ chat: { id: chatId } });
        }, 2000);
        
      } else if (action === 'verify') {
        // 验证密码
        if (text === this.config.guardian.password) {
          // 密码正确，关闭守护模式
          this.guardianMode = false;
          this.config.guardian.enabled = false;
          this.saveConfig();
          
          const successText = this.lang === 'zh' ? `
✅ *密码验证成功！*

守护者模式已关闭

⚠️ 注意：
• 现在可以访问所有功能
• 不再自动拦截风险操作
• 建议完成操作后重新开启

💡 随时可以点击"守护模式"按钮重新开启
          `.trim() : `
✅ *Password verified!*

Guardian mode disabled

⚠️ Note:
• All features are now accessible
• No auto-blocking of risky operations
• Recommended to re-enable after use

💡 You can re-enable anytime by clicking "Guardian Mode" button
          `.trim();
          
          this.bot.sendMessage(chatId, successText, { parse_mode: 'Markdown' });
          
          // 刷新主菜单
          setTimeout(() => {
            this.handleStart({ chat: { id: chatId } });
          }, 2000);
          
        } else {
          // 密码错误
          const errorText = this.lang === 'zh' ? `
❌ *密码错误！*

守护者模式保持开启状态

💡 如果忘记密码，请联系管理员
          `.trim() : `
❌ *Wrong password!*

Guardian mode remains enabled

💡 If you forgot password, please contact admin
          `.trim();
          
          this.bot.sendMessage(chatId, errorText, { parse_mode: 'Markdown' });
          
          // 刷新主菜单
          setTimeout(() => {
            this.handleStart({ chat: { id: chatId } });
          }, 2000);
        }
      }
      
      return;
    }
    
    // Handle price alert input
    if (this.waitingForAlert && this.waitingForAlert.chatId === chatId) {
      if (text === '/cancel') {
        delete this.waitingForAlert;
        this.bot.sendMessage(chatId, this.lang === 'zh' ? '❌ 已取消' : '❌ Cancelled');
        return;
      }
      
      const { type, pair, currentPrice } = this.waitingForAlert;
      delete this.waitingForAlert;
      
      const value = parseFloat(text);
      
      if (isNaN(value) || value <= 0) {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          '❌ 请输入有效的数字' :
          '❌ Please enter a valid number'
        );
        return;
      }
      
      // Validate value based on type
      if (type.includes('change')) {
        if (value > 100) {
          this.bot.sendMessage(chatId, this.lang === 'zh' ? 
            '❌ 百分比不能超过 100%' :
            '❌ Percentage cannot exceed 100%'
          );
          return;
        }
      }
      
      // Check alert limit
      const activeAlerts = this.priceAlerts.getActiveAlerts();
      if (activeAlerts.length >= 10) {
        this.bot.sendMessage(chatId, this.lang === 'zh' ? 
          '❌ 最多只能设置 10 个提醒，请先删除一些旧提醒' :
          '❌ Maximum 10 alerts allowed, please remove some old alerts first'
        );
        return;
      }
      
      // Add alert
      const alert = this.priceAlerts.addAlert({
        pair,
        type,
        value,
        currentPrice
      });
      
      const typeText = this.getAlertTypeText(type);
      const valueText = type.includes('change') ? `${value}%` : `$${value.toLocaleString()}`;
      
      const successText = this.lang === 'zh' ? `
✅ *提醒添加成功！*

*交易对:* ${pair}
*提醒类型:* ${typeText}
*设定值:* ${valueText}
*当前价格:* $${currentPrice.toLocaleString()}

⏰ 当价格达到条件时，我会立即通知你！

💡 你可以在"价格提醒"菜单中查看和管理所有提醒
      `.trim() : `
✅ *Alert added successfully!*

*Pair:* ${pair}
*Alert Type:* ${typeText}
*Set Value:* ${valueText}
*Current Price:* $${currentPrice.toLocaleString()}

⏰ I'll notify you immediately when price meets the condition!

💡 You can view and manage all alerts in "Price Alerts" menu
      `.trim();
      
      this.bot.sendMessage(chatId, successText, { parse_mode: 'Markdown' });
      
      return;
    }
    
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
  
  // ==================== Binance Account Functions ====================
  
  // Handle Binance account menu
  handleBinanceAccount(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const text = this.lang === 'zh' ? `
💼 *币安账户*

查看你的币安账户信息：

*📊 资产相关*
• 现货持仓
• 合约持仓

*💰 资金记录*
• 充值记录
• 提现记录
• 充值地址

*📝 交易记录*
• 现货交易历史
• 合约交易历史

请选择要查看的内容：
    `.trim() : `
💼 *Binance Account*

View your Binance account information:

*📊 Assets*
• Spot Holdings
• Futures Positions

*💰 Fund Records*
• Deposit History
• Withdraw History
• Deposit Address

*📝 Trade Records*
• Spot Trade History
• Futures Trade History

Please select what you want to view:
    `.trim();
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '📊 现货持仓' : '📊 Spot Holdings', callback_data: 'spot_holdings_0' },
          { text: this.lang === 'zh' ? '📈 合约持仓' : '📈 Futures Positions', callback_data: 'futures_positions_0' }
        ],
        [
          { text: this.lang === 'zh' ? '💵 充值记录' : '💵 Deposits', callback_data: 'deposit_history' },
          { text: this.lang === 'zh' ? '💸 提现记录' : '💸 Withdrawals', callback_data: 'withdraw_history' }
        ],
        [
          { text: this.lang === 'zh' ? '📍 充值地址' : '📍 Deposit Address', callback_data: 'deposit_address' }
        ],
        [
          { text: this.lang === 'zh' ? '📝 现货交易' : '📝 Spot Trades', callback_data: 'spot_trades' },
          { text: this.lang === 'zh' ? '📊 合约交易' : '📊 Futures Trades', callback_data: 'futures_trades' }
        ],
        [
          { text: this.lang === 'zh' ? '🔙 返回主菜单' : '🔙 Back to Menu', callback_data: 'start' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle spot holdings
  async handleSpotHoldings(chatId, messageId, queryId, page = 0) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? '📊 获取现货持仓...' : '📊 Fetching spot holdings...', show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const axios = require('axios');
      const crypto = require('crypto');
      
      // Check if API keys are configured
      if (!this.config.cryptoex || !this.config.cryptoex.apiKey || !this.config.cryptoex.apiSecret) {
        const errorText = this.lang === 'zh' ? 
          '❌ 币安 API 未配置\n\n请在 config.json 中添加 cryptoex.apiKey 和 cryptoex.apiSecret' :
          '❌ Binance API not configured\n\nPlease add cryptoex.apiKey and cryptoex.apiSecret in config.json';
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]
          ]
        };
        
        this.bot.sendMessage(chatId, errorText, { reply_markup: keyboard });
        return;
      }
      
      // Get account info
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.config.cryptoex.apiSecret)
        .update(queryString)
        .digest('hex');
      
      const response = await axios.get('https://api.binance.com/api/v3/account', {
        params: {
          timestamp,
          signature
        },
        headers: {
          'X-MBX-APIKEY': this.config.cryptoex.apiKey
        }
      });
      
      const balances = response.data.balances
        .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map(b => ({
          asset: b.asset,
          free: parseFloat(b.free),
          locked: parseFloat(b.locked),
          total: parseFloat(b.free) + parseFloat(b.locked)
        }))
        .sort((a, b) => b.total - a.total);
      
      if (balances.length === 0) {
        const noDataText = this.lang === 'zh' ? 
          '😴 暂无现货持仓' :
          '😴 No spot holdings';
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]
          ]
        };
        
        this.bot.sendMessage(chatId, noDataText, { reply_markup: keyboard });
        return;
      }
      
      // Pagination
      const ITEMS_PER_PAGE = 10;
      const totalPages = Math.ceil(balances.length / ITEMS_PER_PAGE);
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, balances.length);
      const pageBalances = balances.slice(startIndex, endIndex);
      
      let text = this.lang === 'zh' ? `
📊 *现货持仓*

_第 ${page + 1}/${totalPages} 页 (共 ${balances.length} 个币种)_

` : `
📊 *Spot Holdings*

_Page ${page + 1}/${totalPages} (Total ${balances.length} assets)_

`;
      
      pageBalances.forEach((balance, index) => {
        text += `${startIndex + index + 1}. *${balance.asset}*\n`;
        text += `   ${this.lang === 'zh' ? '可用' : 'Free'}: ${balance.free.toFixed(8)}\n`;
        if (balance.locked > 0) {
          text += `   ${this.lang === 'zh' ? '锁定' : 'Locked'}: ${balance.locked.toFixed(8)}\n`;
        }
        text += `   ${this.lang === 'zh' ? '总计' : 'Total'}: ${balance.total.toFixed(8)}\n\n`;
      });
      
      // Pagination buttons
      const buttons = [];
      if (page > 0) {
        buttons.push({ text: '⬅️ ' + (this.lang === 'zh' ? '上一页' : 'Previous'), callback_data: `spot_holdings_${page - 1}` });
      }
      if (page < totalPages - 1) {
        buttons.push({ text: (this.lang === 'zh' ? '下一页' : 'Next') + ' ➡️', callback_data: `spot_holdings_${page + 1}` });
      }
      
      const keyboard = {
        inline_keyboard: [
          buttons.length > 0 ? buttons : [],
          [
            { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: `spot_holdings_${page}` },
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]
        ].filter(row => row.length > 0)
      };
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } catch (error) {
      console.error('❌ Failed to get spot holdings:', error.message);
      
      const errorText = this.lang === 'zh' ? 
        `❌ 获取现货持仓失败\n\n错误: ${error.response?.data?.msg || error.message}` :
        `❌ Failed to get spot holdings\n\nError: ${error.response?.data?.msg || error.message}`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, errorText, { reply_markup: keyboard });
    }
  }
  
  // Handle futures positions
  async handleFuturesPositions(chatId, messageId, queryId, page = 0) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? '📈 获取合约持仓...' : '📈 Fetching futures positions...', show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const axios = require('axios');
      const crypto = require('crypto');
      
      // Check if API keys are configured
      if (!this.config.cryptoex || !this.config.cryptoex.apiKey || !this.config.cryptoex.apiSecret) {
        const errorText = this.lang === 'zh' ? 
          '❌ 币安 API 未配置\n\n请在 config.json 中添加 cryptoex.apiKey 和 cryptoex.apiSecret' :
          '❌ Binance API not configured\n\nPlease add cryptoex.apiKey and cryptoex.apiSecret in config.json';
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]
          ]
        };
        
        this.bot.sendMessage(chatId, errorText, { reply_markup: keyboard });
        return;
      }
      
      // Get futures positions
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.config.cryptoex.apiSecret)
        .update(queryString)
        .digest('hex');
      
      const response = await axios.get('https://fapi.binance.com/fapi/v2/positionRisk', {
        params: {
          timestamp,
          signature
        },
        headers: {
          'X-MBX-APIKEY': this.config.cryptoex.apiKey
        }
      });
      
      const positions = response.data
        .filter(p => parseFloat(p.positionAmt) !== 0)
        .map(p => ({
          symbol: p.symbol,
          positionAmt: parseFloat(p.positionAmt),
          entryPrice: parseFloat(p.entryPrice),
          markPrice: parseFloat(p.markPrice),
          unRealizedProfit: parseFloat(p.unRealizedProfit),
          leverage: parseInt(p.leverage),
          side: parseFloat(p.positionAmt) > 0 ? 'LONG' : 'SHORT'
        }))
        .sort((a, b) => Math.abs(b.unRealizedProfit) - Math.abs(a.unRealizedProfit));
      
      if (positions.length === 0) {
        const noDataText = this.lang === 'zh' ? 
          '😴 暂无合约持仓' :
          '😴 No futures positions';
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]
          ]
        };
        
        this.bot.sendMessage(chatId, noDataText, { reply_markup: keyboard });
        return;
      }
      
      // Pagination
      const ITEMS_PER_PAGE = 5;
      const totalPages = Math.ceil(positions.length / ITEMS_PER_PAGE);
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, positions.length);
      const pagePositions = positions.slice(startIndex, endIndex);
      
      let text = this.lang === 'zh' ? `
📈 *合约持仓*

_第 ${page + 1}/${totalPages} 页 (共 ${positions.length} 个持仓)_

` : `
📈 *Futures Positions*

_Page ${page + 1}/${totalPages} (Total ${positions.length} positions)_

`;
      
      pagePositions.forEach((pos, index) => {
        const profitEmoji = pos.unRealizedProfit > 0 ? '📈' : pos.unRealizedProfit < 0 ? '📉' : '➡️';
        const sideEmoji = pos.side === 'LONG' ? '🟢' : '🔴';
        
        text += `${startIndex + index + 1}. ${sideEmoji} *${pos.symbol}* (${pos.leverage}x)\n`;
        text += `   ${this.lang === 'zh' ? '方向' : 'Side'}: ${pos.side}\n`;
        text += `   ${this.lang === 'zh' ? '数量' : 'Amount'}: ${Math.abs(pos.positionAmt)}\n`;
        text += `   ${this.lang === 'zh' ? '开仓价' : 'Entry'}: $${pos.entryPrice.toFixed(4)}\n`;
        text += `   ${this.lang === 'zh' ? '标记价' : 'Mark'}: $${pos.markPrice.toFixed(4)}\n`;
        text += `   ${profitEmoji} ${this.lang === 'zh' ? '未实现盈亏' : 'PnL'}: $${pos.unRealizedProfit.toFixed(2)}\n\n`;
      });
      
      // Calculate total PnL
      const totalPnL = positions.reduce((sum, p) => sum + p.unRealizedProfit, 0);
      const totalEmoji = totalPnL > 0 ? '📈' : totalPnL < 0 ? '📉' : '➡️';
      text += `${totalEmoji} *${this.lang === 'zh' ? '总盈亏' : 'Total PnL'}:* $${totalPnL.toFixed(2)}\n`;
      
      // Pagination buttons
      const buttons = [];
      if (page > 0) {
        buttons.push({ text: '⬅️ ' + (this.lang === 'zh' ? '上一页' : 'Previous'), callback_data: `futures_positions_${page - 1}` });
      }
      if (page < totalPages - 1) {
        buttons.push({ text: (this.lang === 'zh' ? '下一页' : 'Next') + ' ➡️', callback_data: `futures_positions_${page + 1}` });
      }
      
      const keyboard = {
        inline_keyboard: [
          buttons.length > 0 ? buttons : [],
          [
            { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: `futures_positions_${page}` },
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]
        ].filter(row => row.length > 0)
      };
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } catch (error) {
      console.error('❌ Failed to get futures positions:', error.message);
      
      const errorText = this.lang === 'zh' ? 
        `❌ 获取合约持仓失败\n\n错误: ${error.response?.data?.msg || error.message}` :
        `❌ Failed to get futures positions\n\nError: ${error.response?.data?.msg || error.message}`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]
        ]
      };
      
      this.bot.sendMessage(chatId, errorText, { reply_markup: keyboard });
    }
  }
  
  // ==================== Guardian Mode Functions ====================
  
  // 切换守护者模式
  handleGuardianMode(msg) {
    const chatId = msg.chat.id;
    this.guardianMode = !this.guardianMode;
    
    const text = this.lang === 'zh' ? `
🛡️ *守护者模式*

当前状态: ${this.guardianMode ? '✅ 已开启' : '❌ 已关闭'}

*守护者模式功能：*
• 🛡️ 自动识别诈骗币
• 🗣️ 专业术语翻译成大白话
• 📚 每日安全课堂
• 💡 智能消息识别

${this.guardianMode ? '现在我会用更简单的方式和你交流！' : '已切换到专业模式。'}
    `.trim() : `
🛡️ *Guardian Mode*

Current Status: ${this.guardianMode ? '✅ Enabled' : '❌ Disabled'}

*Guardian Mode Features:*
• 🛡️ Auto-detect scam coins
• 🗣️ Translate technical terms to plain language
• 📚 Daily safety lessons
• 💡 Smart message recognition

${this.guardianMode ? 'I will now communicate in a simpler way!' : 'Switched to professional mode.'}
    `.trim();
    
    this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }
  
  // 检查币种安全性
  async handleCheckCoin(msg, coinName) {
    const chatId = msg.chat.id;
    
    try {
      const detection = await this.scamDetector.detectScam(coinName, msg.text);
      const warning = this.scamDetector.generateElderlyWarning(coinName, detection, this.lang);
      
      this.bot.sendMessage(chatId, warning, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('❌ Failed to check coin:', error.message);
      
      const errorText = this.lang === 'zh' ? 
        `❌ 检查失败\n\n错误: ${error.message}` :
        `❌ Check failed\n\nError: ${error.message}`;
      
      this.bot.sendMessage(chatId, errorText);
    }
  }
  
  // 翻译术语
  handleTranslate(msg, term) {
    const chatId = msg.chat.id;
    
    const explanation = this.plainTranslator.generateExplanation(term, this.lang);
    this.bot.sendMessage(chatId, explanation, { parse_mode: 'Markdown' });
  }
  
  // 查看今日课程
  handleLesson(msg) {
    const chatId = msg.chat.id;
    
    const lesson = this.safetyLessons.getTodayLesson(this.lang);
    const message = this.safetyLessons.generateLessonMessage(lesson, this.lang);
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '📚 查看往期课程' : '📚 View Past Lessons', callback_data: 'past_lessons' },
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'start' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // 智能消息识别
  async handleSmartMessage(msg) {
    if (!msg.text || !this.guardianMode) {
      return;
    }
    
    const chatId = msg.chat.id;
    const text = msg.text.toLowerCase();
    
    // 1. 检测是否询问币种
    const coinPatterns = [
      /(.+)(币|coin)\s*(能买|可以买|怎么样|安全吗|是什么|靠谱吗)/i,
      /(pi|picoin|pi币|派币)/i,
      /(.+)(usdt|btc|eth|bnb)/i
    ];
    
    for (const pattern of coinPatterns) {
      const match = text.match(pattern);
      if (match) {
        const coinName = match[1] || match[0];
        await this.handleCheckCoin(msg, coinName);
        return;
      }
    }
    
    // 2. 检测是否询问术语
    const detectedTerms = this.plainTranslator.detectTerms(text);
    if (detectedTerms.length > 0) {
      // 如果检测到术语，自动翻译第一个
      this.handleTranslate(msg, detectedTerms[0]);
      return;
    }
    
    // 3. 检测是否询问课程
    if (text.includes('课程') || text.includes('学习') || text.includes('教') || 
        text.includes('lesson') || text.includes('learn') || text.includes('teach')) {
      this.handleLesson(msg);
      return;
    }
    
    // 4. 检测是否询问安全
    if (text.includes('安全') || text.includes('骗') || text.includes('风险') ||
        text.includes('safe') || text.includes('scam') || text.includes('risk')) {
      const safetyTip = this.lang === 'zh' ? `
🛡️ *安全提示*

想了解什么安全知识？

你可以问我：
• "Pi 币能买吗？" - 检查币种安全性
• "什么是 Launchpool？" - 翻译专业术语
• "今天的课程" - 查看每日安全课堂

或者直接发送 /help 查看所有功能。
      `.trim() : `
🛡️ *Safety Tips*

What would you like to know about safety?

You can ask me:
• "Is Pi coin safe?" - Check coin safety
• "What is Launchpool?" - Translate terms
• "Today's lesson" - View daily safety lesson

Or send /help to see all features.
      `.trim();
      
      this.bot.sendMessage(chatId, safetyTip, { parse_mode: 'Markdown' });
      return;
    }
    
    // 5. 如果都不匹配，提供帮助
    if (this.guardianMode) {
      const helpText = this.lang === 'zh' ? `
💡 *我可以帮你：*

• 检查币种安全性（如："Pi 币能买吗？"）
• 翻译专业术语（如："什么是 Launchpool？"）
• 每日安全课堂（发送 /lesson）

或者点击 /help 查看所有功能。
      `.trim() : `
💡 *I can help you with:*

• Check coin safety (e.g., "Is Pi coin safe?")
• Translate technical terms (e.g., "What is Launchpool?")
• Daily safety lessons (send /lesson)

Or click /help to see all features.
      `.trim();
      
      this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    }
  }
  
  // Handle deposit history
  async handleDepositHistory(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? '💵 获取充值记录...' : '💵 Fetching deposits...', show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const axios = require('axios');
      const crypto = require('crypto');
      
      if (!this.config.cryptoex || !this.config.cryptoex.apiKey || !this.config.cryptoex.apiSecret) {
        const errorText = this.lang === 'zh' ? 
          '❌ 币安 API 未配置\n\n请在 config.json 中添加 API 密钥' :
          '❌ Binance API not configured\n\nPlease add API keys in config.json';
        
        this.bot.sendMessage(chatId, errorText, {
          reply_markup: {
            inline_keyboard: [[
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]]
          }
        });
        return;
      }
      
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.config.cryptoex.apiSecret)
        .update(queryString)
        .digest('hex');
      
      const response = await axios.get('https://api.binance.com/sapi/v1/capital/deposit/hisrec', {
        headers: { 'X-MBX-APIKEY': this.config.cryptoex.apiKey },
        params: { timestamp, signature }
      });
      
      const deposits = response.data;
      
      if (!deposits || deposits.length === 0) {
        const text = this.lang === 'zh' ? 
          '💵 *充值记录*\n\n暂无充值记录' :
          '💵 *Deposit History*\n\nNo deposits found';
        
        this.bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]]
          }
        });
        return;
      }
      
      // Show last 10 deposits
      const recentDeposits = deposits.slice(0, 10);
      
      let text = this.lang === 'zh' ? '💵 *充值记录*\n\n' : '💵 *Deposit History*\n\n';
      
      recentDeposits.forEach((deposit, index) => {
        const date = new Date(deposit.insertTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const status = deposit.status === 1 ? '✅' : '⏳';
        
        text += `${index + 1}. ${status} ${deposit.coin}\n`;
        text += `   ${this.lang === 'zh' ? '数量' : 'Amount'}: ${deposit.amount}\n`;
        text += `   ${this.lang === 'zh' ? '时间' : 'Time'}: ${date}\n`;
        if (deposit.network) {
          text += `   ${this.lang === 'zh' ? '网络' : 'Network'}: ${deposit.network}\n`;
        }
        text += `\n`;
      });
      
      if (deposits.length > 10) {
        text += this.lang === 'zh' ? 
          `\n💡 仅显示最近 10 条记录，共 ${deposits.length} 条` :
          `\n💡 Showing last 10 of ${deposits.length} records`;
      }
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]]
        }
      });
      
    } catch (error) {
      console.error('Error fetching deposit history:', error);
      const errorText = this.lang === 'zh' ? 
        `❌ 获取充值记录失败\n\n${error.message}` :
        `❌ Failed to fetch deposits\n\n${error.message}`;
      
      this.bot.sendMessage(chatId, errorText, {
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]]
        }
      });
    }
  }
  
  // Handle withdraw history
  async handleWithdrawHistory(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? '💸 获取提现记录...' : '💸 Fetching withdrawals...', show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const axios = require('axios');
      const crypto = require('crypto');
      
      if (!this.config.cryptoex || !this.config.cryptoex.apiKey || !this.config.cryptoex.apiSecret) {
        const errorText = this.lang === 'zh' ? 
          '❌ 币安 API 未配置' :
          '❌ Binance API not configured';
        
        this.bot.sendMessage(chatId, errorText, {
          reply_markup: {
            inline_keyboard: [[
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]]
          }
        });
        return;
      }
      
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.config.cryptoex.apiSecret)
        .update(queryString)
        .digest('hex');
      
      const response = await axios.get('https://api.binance.com/sapi/v1/capital/withdraw/history', {
        headers: { 'X-MBX-APIKEY': this.config.cryptoex.apiKey },
        params: { timestamp, signature }
      });
      
      const withdrawals = response.data;
      
      if (!withdrawals || withdrawals.length === 0) {
        const text = this.lang === 'zh' ? 
          '💸 *提现记录*\n\n暂无提现记录' :
          '💸 *Withdraw History*\n\nNo withdrawals found';
        
        this.bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]]
          }
        });
        return;
      }
      
      const recentWithdrawals = withdrawals.slice(0, 10);
      
      let text = this.lang === 'zh' ? '💸 *提现记录*\n\n' : '💸 *Withdraw History*\n\n';
      
      recentWithdrawals.forEach((withdrawal, index) => {
        const date = new Date(withdrawal.applyTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const statusMap = {
          0: '⏳',
          1: '❌',
          2: '⏳',
          3: '⏳',
          4: '⏳',
          5: '⏳',
          6: '✅'
        };
        const status = statusMap[withdrawal.status] || '❓';
        
        text += `${index + 1}. ${status} ${withdrawal.coin}\n`;
        text += `   ${this.lang === 'zh' ? '数量' : 'Amount'}: ${withdrawal.amount}\n`;
        text += `   ${this.lang === 'zh' ? '时间' : 'Time'}: ${date}\n`;
        if (withdrawal.network) {
          text += `   ${this.lang === 'zh' ? '网络' : 'Network'}: ${withdrawal.network}\n`;
        }
        text += `\n`;
      });
      
      if (withdrawals.length > 10) {
        text += this.lang === 'zh' ? 
          `\n💡 仅显示最近 10 条记录，共 ${withdrawals.length} 条` :
          `\n💡 Showing last 10 of ${withdrawals.length} records`;
      }
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]]
        }
      });
      
    } catch (error) {
      console.error('Error fetching withdraw history:', error);
      const errorText = this.lang === 'zh' ? 
        `❌ 获取提现记录失败\n\n${error.message}` :
        `❌ Failed to fetch withdrawals\n\n${error.message}`;
      
      this.bot.sendMessage(chatId, errorText, {
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]]
        }
      });
    }
  }
  
  // Handle deposit address
  async handleDepositAddress(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const text = this.lang === 'zh' ? `
📍 *充值地址*

请选择要查看充值地址的币种：

💡 提示：
• 充值前请确认网络类型
• 不同网络的地址不同
• 充值到错误网络会导致资产丢失

常用币种：
    `.trim() : `
📍 *Deposit Address*

Please select the coin to view deposit address:

💡 Tips:
• Confirm network type before deposit
• Different networks have different addresses
• Depositing to wrong network will cause asset loss

Popular coins:
    `.trim();
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: 'BTC', callback_data: 'deposit_addr_BTC' },
          { text: 'ETH', callback_data: 'deposit_addr_ETH' },
          { text: 'USDT', callback_data: 'deposit_addr_USDT' }
        ],
        [
          { text: 'BNB', callback_data: 'deposit_addr_BNB' },
          { text: 'SOL', callback_data: 'deposit_addr_SOL' },
          { text: 'XRP', callback_data: 'deposit_addr_XRP' }
        ],
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle specific coin deposit address
  async handleSpecificDepositAddress(chatId, messageId, queryId, coin) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? `📍 获取 ${coin} 充值地址...` : `📍 Fetching ${coin} address...`, show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const axios = require('axios');
      const crypto = require('crypto');
      
      if (!this.config.cryptoex || !this.config.cryptoex.apiKey || !this.config.cryptoex.apiSecret) {
        const errorText = this.lang === 'zh' ? 
          '❌ 币安 API 未配置' :
          '❌ Binance API not configured';
        
        this.bot.sendMessage(chatId, errorText, {
          reply_markup: {
            inline_keyboard: [[
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'deposit_address' }
            ]]
          }
        });
        return;
      }
      
      const timestamp = Date.now();
      const queryString = `coin=${coin}&timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.config.cryptoex.apiSecret)
        .update(queryString)
        .digest('hex');
      
      const response = await axios.get('https://api.binance.com/sapi/v1/capital/deposit/address', {
        headers: { 'X-MBX-APIKEY': this.config.cryptoex.apiKey },
        params: { coin, timestamp, signature }
      });
      
      const addressData = response.data;
      
      let text = this.lang === 'zh' ? 
        `📍 *${coin} 充值地址*\n\n` :
        `📍 *${coin} Deposit Address*\n\n`;
      
      text += `${this.lang === 'zh' ? '币种' : 'Coin'}: ${addressData.coin}\n`;
      text += `${this.lang === 'zh' ? '地址' : 'Address'}: \`${addressData.address}\`\n`;
      
      if (addressData.tag) {
        text += `${this.lang === 'zh' ? '标签/Memo' : 'Tag/Memo'}: \`${addressData.tag}\`\n`;
      }
      
      if (addressData.url) {
        text += `${this.lang === 'zh' ? '网络' : 'Network'}: ${addressData.url}\n`;
      }
      
      text += `\n⚠️ ${this.lang === 'zh' ? '重要提示' : 'Important'}:\n`;
      text += this.lang === 'zh' ? 
        `• 请确认网络类型正确\n• 充值到错误网络会导致资产丢失\n• 某些币种需要填写标签/Memo` :
        `• Confirm network type is correct\n• Wrong network will cause asset loss\n• Some coins require tag/memo`;
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'deposit_address' }
          ]]
        }
      });
      
    } catch (error) {
      console.error('Error fetching deposit address:', error);
      const errorText = this.lang === 'zh' ? 
        `❌ 获取充值地址失败\n\n${error.response?.data?.msg || error.message}` :
        `❌ Failed to fetch deposit address\n\n${error.response?.data?.msg || error.message}`;
      
      this.bot.sendMessage(chatId, errorText, {
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'deposit_address' }
          ]]
        }
      });
    }
  }
  
  // Handle spot trades
  async handleSpotTrades(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? '📝 获取现货交易记录...' : '📝 Fetching spot trades...', show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const axios = require('axios');
      const crypto = require('crypto');
      
      if (!this.config.cryptoex || !this.config.cryptoex.apiKey || !this.config.cryptoex.apiSecret) {
        const errorText = this.lang === 'zh' ? 
          '❌ 币安 API 未配置' :
          '❌ Binance API not configured';
        
        this.bot.sendMessage(chatId, errorText, {
          reply_markup: {
            inline_keyboard: [[
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]]
          }
        });
        return;
      }
      
      // Get recent trades for BTCUSDT as example
      const symbol = 'BTCUSDT';
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}&timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.config.cryptoex.apiSecret)
        .update(queryString)
        .digest('hex');
      
      const response = await axios.get('https://api.binance.com/api/v3/myTrades', {
        headers: { 'X-MBX-APIKEY': this.config.cryptoex.apiKey },
        params: { symbol, timestamp, signature, limit: 10 }
      });
      
      const trades = response.data;
      
      if (!trades || trades.length === 0) {
        const text = this.lang === 'zh' ? 
          `📝 *现货交易记录*\n\n暂无 ${symbol} 交易记录` :
          `📝 *Spot Trade History*\n\nNo ${symbol} trades found`;
        
        this.bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
            ]]
          }
        });
        return;
      }
      
      let text = this.lang === 'zh' ? 
        `📝 *现货交易记录*\n\n交易对: ${symbol}\n\n` :
        `📝 *Spot Trade History*\n\nPair: ${symbol}\n\n`;
      
      trades.forEach((trade, index) => {
        const date = new Date(trade.time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const side = trade.isBuyer ? (this.lang === 'zh' ? '买入' : 'BUY') : (this.lang === 'zh' ? '卖出' : 'SELL');
        const sideIcon = trade.isBuyer ? '🟢' : '🔴';
        
        text += `${index + 1}. ${sideIcon} ${side}\n`;
        text += `   ${this.lang === 'zh' ? '价格' : 'Price'}: ${parseFloat(trade.price).toFixed(2)} USDT\n`;
        text += `   ${this.lang === 'zh' ? '数量' : 'Qty'}: ${parseFloat(trade.qty).toFixed(6)}\n`;
        text += `   ${this.lang === 'zh' ? '时间' : 'Time'}: ${date}\n\n`;
      });
      
      text += this.lang === 'zh' ? 
        `\n💡 仅显示 ${symbol} 最近 10 条交易` :
        `\n💡 Showing last 10 ${symbol} trades`;
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]]
        }
      });
      
    } catch (error) {
      console.error('Error fetching spot trades:', error);
      const errorText = this.lang === 'zh' ? 
        `❌ 获取交易记录失败\n\n${error.response?.data?.msg || error.message}` :
        `❌ Failed to fetch trades\n\n${error.response?.data?.msg || error.message}`;
      
      this.bot.sendMessage(chatId, errorText, {
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
          ]]
        }
      });
    }
  }
  
  // Handle futures trades (placeholder)
  async handleFuturesTrades(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const text = this.lang === 'zh' ? 
      '📊 *合约交易记录*\n\n此功能需要合约 API 权限\n\n💡 提示：合约交易风险较高，建议谨慎使用' :
      '📊 *Futures Trade History*\n\nThis feature requires futures API permission\n\n💡 Tip: Futures trading is high risk, use with caution';
    
    this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'binance_account' }
        ]]
      }
    });
  }
  
  // Handle K-line chart menu
  handleKlineChart(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const text = this.lang === 'zh' ? `
📈 *K线图*

选择要查看K线图的交易对：

💡 提示：
• K线图显示价格走势
• 默认显示最近24小时
• 包含开盘、收盘、最高、最低价

常用交易对：
    `.trim() : `
📈 *K-Line Chart*

Select pair to view K-line chart:

💡 Tips:
• K-line shows price trends
• Default: last 24 hours
• Includes open, close, high, low prices

Popular pairs:
    `.trim();
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: 'BTCUSDT', callback_data: 'kline_BTCUSDT' },
          { text: 'ETHUSDT', callback_data: 'kline_ETHUSDT' }
        ],
        [
          { text: 'BNBUSDT', callback_data: 'kline_BNBUSDT' },
          { text: 'SOLUSDT', callback_data: 'kline_SOLUSDT' }
        ],
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'market_overview' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle specific pair K-line
  async handleSpecificKline(chatId, messageId, queryId, pair) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? `📈 生成 ${pair} K线图...` : `📈 Generating ${pair} chart...`, show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const axios = require('axios');
      const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
      const fs = require('fs');
      const path = require('path');
      
      // Get kline data from Binance
      const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
          symbol: pair,
          interval: '1h',
          limit: 24
        }
      });
      
      const klines = response.data;
      
      // Prepare chart data
      const labels = klines.map(k => {
        const date = new Date(k[0]);
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      });
      
      const prices = klines.map(k => ({
        x: k[0],
        o: parseFloat(k[1]), // open
        h: parseFloat(k[2]), // high
        l: parseFloat(k[3]), // low
        c: parseFloat(k[4])  // close
      }));
      
      // Create chart
      const width = 800;
      const height = 400;
      const chartCallback = (ChartJS) => {
        ChartJS.defaults.color = '#666';
        ChartJS.defaults.font.size = 12;
      };
      
      const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
        width, 
        height, 
        chartCallback,
        backgroundColour: 'white'
      });
      
      const configuration = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: pair,
            data: prices.map(p => p.c),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `${pair} - ${this.lang === 'zh' ? '24小时K线图' : '24H K-Line Chart'}`,
              font: { size: 16 }
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      };
      
      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
      
      // Save to temp file
      const tempFile = path.join('/tmp', `kline_${pair}_${Date.now()}.png`);
      fs.writeFileSync(tempFile, imageBuffer);
      
      // Send chart
      await this.bot.sendPhoto(chatId, tempFile, {
        caption: this.lang === 'zh' ? 
          `📈 ${pair} K线图\n\n⏰ 时间范围: 最近24小时\n📊 间隔: 1小时` :
          `📈 ${pair} K-Line Chart\n\n⏰ Time Range: Last 24 hours\n📊 Interval: 1 hour`,
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'kline_chart' }
          ]]
        }
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
    } catch (error) {
      console.error('Error generating K-line chart:', error);
      const errorText = this.lang === 'zh' ? 
        `❌ 生成K线图失败\n\n${error.message}` :
        `❌ Failed to generate chart\n\n${error.message}`;
      
      this.bot.sendMessage(chatId, errorText, {
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'kline_chart' }
          ]]
        }
      });
    }
  }
  
  // Handle market depth menu
  handleMarketDepth(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const text = this.lang === 'zh' ? `
📊 *市场深度*

选择要查看深度数据的交易对：

💡 提示：
• 深度数据显示买卖盘口
• 包含买单和卖单价格
• 显示挂单数量

常用交易对：
    `.trim() : `
📊 *Market Depth*

Select pair to view depth data:

💡 Tips:
• Depth shows order book
• Includes bid and ask prices
• Shows order quantities

Popular pairs:
    `.trim();
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: 'BTCUSDT', callback_data: 'depth_BTCUSDT' },
          { text: 'ETHUSDT', callback_data: 'depth_ETHUSDT' }
        ],
        [
          { text: 'BNBUSDT', callback_data: 'depth_BNBUSDT' },
          { text: 'SOLUSDT', callback_data: 'depth_SOLUSDT' }
        ],
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'market_overview' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle specific pair depth
  async handleSpecificDepth(chatId, messageId, queryId, pair) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? `📊 获取 ${pair} 深度数据...` : `📊 Fetching ${pair} depth...`, show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const axios = require('axios');
      
      const response = await axios.get('https://api.binance.com/api/v3/depth', {
        params: {
          symbol: pair,
          limit: 10
        }
      });
      
      const depth = response.data;
      
      let text = this.lang === 'zh' ? 
        `📊 *${pair} 市场深度*\n\n` :
        `📊 *${pair} Market Depth*\n\n`;
      
      // Asks (卖单)
      text += this.lang === 'zh' ? '*🔴 卖单 (Ask):*\n' : '*🔴 Asks (Sell):*\n';
      depth.asks.slice(0, 5).reverse().forEach((ask, index) => {
        const price = parseFloat(ask[0]);
        const qty = parseFloat(ask[1]);
        text += `${5 - index}. $${price.toLocaleString()} × ${qty.toFixed(4)}\n`;
      });
      
      text += '\n━━━━━━━━━━━━━━━━\n\n';
      
      // Bids (买单)
      text += this.lang === 'zh' ? '*🟢 买单 (Bid):*\n' : '*🟢 Bids (Buy):*\n';
      depth.bids.slice(0, 5).forEach((bid, index) => {
        const price = parseFloat(bid[0]);
        const qty = parseFloat(bid[1]);
        text += `${index + 1}. $${price.toLocaleString()} × ${qty.toFixed(4)}\n`;
      });
      
      const spread = parseFloat(depth.asks[0][0]) - parseFloat(depth.bids[0][0]);
      const spreadPercent = (spread / parseFloat(depth.bids[0][0]) * 100).toFixed(4);
      
      text += `\n💡 ${this.lang === 'zh' ? '买卖价差' : 'Spread'}: $${spread.toFixed(2)} (${spreadPercent}%)`;
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: `depth_${pair}` },
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'market_depth' }
          ]]
        }
      });
      
    } catch (error) {
      console.error('Error fetching market depth:', error);
      const errorText = this.lang === 'zh' ? 
        `❌ 获取深度数据失败\n\n${error.message}` :
        `❌ Failed to fetch depth\n\n${error.message}`;
      
      this.bot.sendMessage(chatId, errorText, {
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'market_depth' }
          ]]
        }
      });
    }
  }
  
  // Handle recent trades menu
  handleRecentTrades(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const text = this.lang === 'zh' ? `
💹 *最新成交*

选择要查看最新成交的交易对：

💡 提示：
• 显示最近的成交记录
• 包含价格、数量、时间
• 买卖方向标识

常用交易对：
    `.trim() : `
💹 *Recent Trades*

Select pair to view recent trades:

💡 Tips:
• Shows latest trade records
• Includes price, quantity, time
• Buy/sell direction indicators

Popular pairs:
    `.trim();
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: 'BTCUSDT', callback_data: 'trades_BTCUSDT' },
          { text: 'ETHUSDT', callback_data: 'trades_ETHUSDT' }
        ],
        [
          { text: 'BNBUSDT', callback_data: 'trades_BNBUSDT' },
          { text: 'SOLUSDT', callback_data: 'trades_SOLUSDT' }
        ],
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'market_overview' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle specific pair recent trades
  async handleSpecificTrades(chatId, messageId, queryId, pair) {
    this.bot.answerCallbackQuery(queryId, { text: this.lang === 'zh' ? `💹 获取 ${pair} 最新成交...` : `💹 Fetching ${pair} trades...`, show_alert: false });
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    try {
      const axios = require('axios');
      
      const response = await axios.get('https://api.binance.com/api/v3/trades', {
        params: {
          symbol: pair,
          limit: 20
        }
      });
      
      const trades = response.data;
      
      let text = this.lang === 'zh' ? 
        `💹 *${pair} 最新成交*\n\n` :
        `💹 *${pair} Recent Trades*\n\n`;
      
      trades.slice(0, 15).forEach((trade, index) => {
        const price = parseFloat(trade.price);
        const qty = parseFloat(trade.qty);
        const time = new Date(trade.time).toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
        const side = trade.isBuyerMaker ? '🔴' : '🟢';
        
        text += `${side} $${price.toLocaleString()} × ${qty.toFixed(4)} (${time})\n`;
      });
      
      text += `\n💡 ${this.lang === 'zh' ? '🟢 = 买入主导, 🔴 = 卖出主导' : '🟢 = Buy, 🔴 = Sell'}`;
      
      this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔄 刷新' : '🔄 Refresh', callback_data: `trades_${pair}` },
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'recent_trades' }
          ]]
        }
      });
      
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      const errorText = this.lang === 'zh' ? 
        `❌ 获取最新成交失败\n\n${error.message}` :
        `❌ Failed to fetch trades\n\n${error.message}`;
      
      this.bot.sendMessage(chatId, errorText, {
        reply_markup: {
          inline_keyboard: [[
            { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'recent_trades' }
          ]]
        }
      });
    }
  }
  
  // Start price alerts monitoring
  startPriceAlertsMonitoring() {
    const getPrices = async () => {
      const prices = {};
      const allPairs = this.getAllPairs();
      
      for (const pair of allPairs) {
        const price = this.state.priceCache?.[pair];
        if (price) {
          prices[pair] = price;
        }
      }
      
      return prices;
    };
    
    const onTrigger = (alert) => {
      const chatId = this.config.telegram.chatId;
      if (!chatId) return;
      
      const text = this.lang === 'zh' ? `
⏰ *价格提醒触发！*

*交易对:* ${alert.pair}
*触发价格:* $${alert.triggeredPrice.toLocaleString()}
*提醒类型:* ${this.getAlertTypeText(alert.type)}
*设定值:* ${alert.type.includes('change') ? alert.value + '%' : '$' + alert.value.toLocaleString()}

⏰ 提醒时间: ${new Date().toLocaleString('zh-CN')}
      `.trim() : `
⏰ *Price Alert Triggered!*

*Pair:* ${alert.pair}
*Triggered Price:* $${alert.triggeredPrice.toLocaleString()}
*Alert Type:* ${this.getAlertTypeText(alert.type)}
*Set Value:* ${alert.type.includes('change') ? alert.value + '%' : '$' + alert.value.toLocaleString()}

⏰ Time: ${new Date().toLocaleString('en-US')}
      `.trim();
      
      this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    };
    
    this.priceAlerts.startMonitoring(onTrigger, getPrices, 30000);
  }
  
  // Get alert type text
  getAlertTypeText(type) {
    const typeMap = {
      zh: {
        above: '价格高于',
        below: '价格低于',
        change_up: '涨幅超过',
        change_down: '跌幅超过'
      },
      en: {
        above: 'Price above',
        below: 'Price below',
        change_up: 'Rise over',
        change_down: 'Fall over'
      }
    };
    
    return typeMap[this.lang][type] || type;
  }
  
  // Handle price alerts menu
  handlePriceAlerts(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const alerts = this.priceAlerts.getAllAlerts();
    const activeAlerts = alerts.filter(a => !a.triggered && a.enabled);
    const triggeredAlerts = alerts.filter(a => a.triggered);
    
    let text = this.lang === 'zh' ? `
⏰ *价格提醒*

*活跃提醒 (${activeAlerts.length}):*
${activeAlerts.length > 0 ? activeAlerts.map((a, i) => `${i + 1}. ${this.priceAlerts.formatAlert(a, this.lang)}`).join('\n') : '暂无活跃提醒'}

*已触发 (${triggeredAlerts.length}):*
${triggeredAlerts.length > 0 ? triggeredAlerts.slice(0, 3).map((a, i) => `${i + 1}. ${this.priceAlerts.formatAlert(a, this.lang)}`).join('\n') : '暂无已触发提醒'}

💡 提示：
• 提醒会在价格达到设定值时自动通知
• 每个提醒只触发一次
• 最多可设置 10 个提醒
    `.trim() : `
⏰ *Price Alerts*

*Active Alerts (${activeAlerts.length}):*
${activeAlerts.length > 0 ? activeAlerts.map((a, i) => `${i + 1}. ${this.priceAlerts.formatAlert(a, this.lang)}`).join('\n') : 'No active alerts'}

*Triggered (${triggeredAlerts.length}):*
${triggeredAlerts.length > 0 ? triggeredAlerts.slice(0, 3).map((a, i) => `${i + 1}. ${this.priceAlerts.formatAlert(a, this.lang)}`).join('\n') : 'No triggered alerts'}

💡 Tips:
• Alerts notify automatically when price reaches target
• Each alert triggers once
• Maximum 10 alerts
    `.trim();
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '➕ 添加提醒' : '➕ Add Alert', callback_data: 'add_alert' }
        ]
      ]
    };
    
    // Add remove buttons for active alerts
    if (activeAlerts.length > 0) {
      const removeButtons = [];
      activeAlerts.slice(0, 5).forEach((alert, index) => {
        removeButtons.push([
          { text: this.lang === 'zh' ? `🗑️ 删除提醒 ${index + 1}` : `🗑️ Remove Alert ${index + 1}`, callback_data: `remove_alert_${alert.id}` }
        ]);
      });
      keyboard.inline_keyboard.push(...removeButtons);
    }
    
    keyboard.inline_keyboard.push([
      { text: this.lang === 'zh' ? '🔙 返回主菜单' : '🔙 Back to Menu', callback_data: 'start' }
    ]);
    
    this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle add alert
  handleAddAlert(chatId, messageId, queryId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const text = this.lang === 'zh' ? `
➕ *添加价格提醒*

请选择提醒类型：

*价格提醒*
• 价格高于 - 当价格超过设定值时提醒
• 价格低于 - 当价格低于设定值时提醒

*涨跌幅提醒*
• 涨幅超过 - 当涨幅超过设定百分比时提醒
• 跌幅超过 - 当跌幅超过设定百分比时提醒

💡 提示：涨跌幅是相对于添加提醒时的价格计算
    `.trim() : `
➕ *Add Price Alert*

Please select alert type:

*Price Alerts*
• Price Above - Alert when price exceeds target
• Price Below - Alert when price falls below target

*Change Alerts*
• Rise Over - Alert when rise exceeds percentage
• Fall Over - Alert when fall exceeds percentage

💡 Tip: Change is calculated from price when alert is added
    `.trim();
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '📈 价格高于' : '📈 Price Above', callback_data: 'add_alert_above' },
          { text: this.lang === 'zh' ? '📉 价格低于' : '📉 Price Below', callback_data: 'add_alert_below' }
        ],
        [
          { text: this.lang === 'zh' ? '🚀 涨幅超过' : '🚀 Rise Over', callback_data: 'add_alert_change_up' },
          { text: this.lang === 'zh' ? '💥 跌幅超过' : '💥 Fall Over', callback_data: 'add_alert_change_down' }
        ],
        [
          { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'price_alerts' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle add alert type
  handleAddAlertType(chatId, messageId, queryId, type) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const typeText = this.getAlertTypeText(type);
    
    const text = this.lang === 'zh' ? `
➕ *添加提醒: ${typeText}*

请选择交易对：
    `.trim() : `
➕ *Add Alert: ${typeText}*

Please select pair:
    `.trim();
    
    const allPairs = this.getAllPairs();
    const keyboard = {
      inline_keyboard: []
    };
    
    // Add pair buttons (2 per row)
    for (let i = 0; i < allPairs.length; i += 2) {
      const row = [];
      row.push({ text: allPairs[i], callback_data: `alert_pair_${allPairs[i]}` });
      if (i + 1 < allPairs.length) {
        row.push({ text: allPairs[i + 1], callback_data: `alert_pair_${allPairs[i + 1]}` });
      }
      keyboard.inline_keyboard.push(row);
    }
    
    keyboard.inline_keyboard.push([
      { text: this.lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'add_alert' }
    ]);
    
    // Store alert type in waiting state
    this.waitingForAlert = { type, chatId };
    
    this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle alert pair selected
  handleAlertPairSelected(chatId, messageId, queryId, pair) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    if (!this.waitingForAlert) {
      this.bot.sendMessage(chatId, this.lang === 'zh' ? '❌ 会话已过期，请重新开始' : '❌ Session expired, please start again');
      return;
    }
    
    const { type } = this.waitingForAlert;
    const typeText = this.getAlertTypeText(type);
    const currentPrice = this.state.priceCache?.[pair] || 0;
    
    const text = this.lang === 'zh' ? `
➕ *添加提醒*

*交易对:* ${pair}
*当前价格:* $${currentPrice.toLocaleString()}
*提醒类型:* ${typeText}

请输入${type.includes('change') ? '百分比' : '价格'}值：

${type.includes('change') ? 
  '例如：输入 5 表示涨跌幅超过 5%' :
  `例如：输入 ${(currentPrice * 1.05).toFixed(0)} 表示价格${type === 'above' ? '高于' : '低于'} $${(currentPrice * 1.05).toLocaleString()}`
}

发送 /cancel 取消操作
    `.trim() : `
➕ *Add Alert*

*Pair:* ${pair}
*Current Price:* $${currentPrice.toLocaleString()}
*Alert Type:* ${typeText}

Please enter ${type.includes('change') ? 'percentage' : 'price'} value:

${type.includes('change') ? 
  'Example: Enter 5 for 5% change' :
  `Example: Enter ${(currentPrice * 1.05).toFixed(0)} for price ${type === 'above' ? 'above' : 'below'} $${(currentPrice * 1.05).toLocaleString()}`
}

Send /cancel to cancel
    `.trim();
    
    // Update waiting state
    this.waitingForAlert = { type, pair, currentPrice, chatId };
    
    // Add inline keyboard with cancel button
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.lang === 'zh' ? '❌ 取消' : '❌ Cancel', callback_data: 'price_alerts' }
        ]
      ]
    };
    
    this.bot.sendMessage(chatId, text, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Handle remove alert
  handleRemoveAlert(chatId, messageId, queryId, alertId) {
    this.bot.answerCallbackQuery(queryId);
    this.bot.deleteMessage(chatId, messageId).catch(() => {});
    
    const success = this.priceAlerts.removeAlert(alertId);
    
    if (success) {
      const text = this.lang === 'zh' ? '✅ 提醒已删除' : '✅ Alert removed';
      this.bot.sendMessage(chatId, text).then(() => {
        setTimeout(() => {
          this.handlePriceAlerts(chatId, null, queryId);
        }, 500);
      }).catch(error => {
        console.error('Error sending message:', error);
      });
    } else {
      const text = this.lang === 'zh' ? '❌ 删除失败，提醒不存在' : '❌ Failed to remove, alert not found';
      this.bot.sendMessage(chatId, text);
    }
  }
  
  // Save config to file
  saveConfig() {
    if (this.onConfigChange) {
      this.onConfigChange(this.config);
    }
  }
}

module.exports = TelegramUI;
