#!/usr/bin/env node

const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const NOFXDataAPI = require('./nofx-api');
const TelegramUI = require('./telegram-ui');

// ==================== Configuration Validation ====================

function validateConfig(config) {
  const required = {
    'telegram.botToken': config.telegram?.botToken,
    'telegram.chatId': config.telegram?.chatId,
    'trading.pairs': config.trading?.pairs,
    'trading.threshold': config.trading?.threshold,
    'trading.checkInterval': config.trading?.checkInterval
  };
  
  const missing = [];
  Object.entries(required).forEach(([path, value]) => {
    if (!value) missing.push(path);
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required configuration:', missing.join(', '));
    console.error('\nPlease edit config.json and fill in:');
    missing.forEach(path => console.error(`  - ${path}`));
    process.exit(1);
  }
  
  const customPairs = config.trading.customPairs || [];
  const maxCustom = config.trading.maxCustomPairs || 4;
  if (customPairs.length > maxCustom) {
    console.error(`❌ Custom pairs exceeded limit: ${customPairs.length}/${maxCustom}`);
    process.exit(1);
  }
  
  const minInterval = 10000;
  const priceInterval = config.rateLimit?.priceUpdateInterval || config.trading.checkInterval;
  if (priceInterval < minInterval) {
    console.error(`❌ Price update interval too short: ${priceInterval}ms (min ${minInterval}ms)`);
    process.exit(1);
  }
  
  console.log('✅ Configuration validated');
}

// ==================== Load Configuration ====================

let config;
try {
  config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  validateConfig(config);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('❌ Configuration file not found');
    console.error('\nPlease run: cp config.example.json config.json');
    console.error('Then edit config.json to fill in your configuration');
  } else {
    console.error('❌ Failed to load configuration:', err.message);
  }
  process.exit(1);
}

// ==================== Initialize ====================

const lang = config.language || 'en';

let bot;
try {
  bot = new TelegramBot(config.telegram.botToken, { polling: true });
  console.log('✅ Telegram Bot initialized');
} catch (err) {
  console.error('❌ Telegram Bot initialization failed:', err.message);
  process.exit(1);
}

// Initialize NOFX API
const nofxAPI = new NOFXDataAPI(config.nofx?.apiKey);
console.log('✅ NOFX API initialized');

const BINANCE_API = 'https://api.binance.com/api/v3';

// State management
const state = {
  priceCache: {},
  volumeCache: {},
  nofxCache: {},
  opportunityHistory: [],
  isFirstRun: true,
  lastPriceUpdate: 0,
  lastVolumeUpdate: 0,
  lastNOFXUpdate: 0,
  requestCount: 0,
  requestResetTime: Date.now(),
  startTime: Date.now()
};

const MAX_HISTORY = 1000;

// Initialize Telegram UI
const telegramUI = new TelegramUI(bot, config, state);
console.log('✅ Telegram UI initialized');

// ==================== AI Agent Recommendations ====================

const AI_AGENT_RECOMMENDATIONS = {
  trending: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'],
  defi: ['UNIUSDT', 'AAVEUSDT', 'LINKUSDT', 'MKRUSDT'],
  layer2: ['MATICUSDT', 'ARBUSDT', 'OPUSDT'],
  meme: ['DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT']
};

function getAIRecommendations() {
  if (!config.aiAgent?.enabled) return [];
  const category = config.aiAgent.category || 'trending';
  return AI_AGENT_RECOMMENDATIONS[category] || AI_AGENT_RECOMMENDATIONS.trending;
}

function getAllPairs() {
  const basePairs = config.trading.pairs || [];
  const customPairs = config.trading.customPairs || [];
  const aiPairs = getAIRecommendations();
  return [...new Set([...basePairs, ...customPairs, ...aiPairs])];
}

// ==================== Rate Limiter ====================

class RateLimiter {
  constructor() {
    this.maxRequestsPerMinute = config.rateLimit?.maxRequestsPerMinute || 20;
    this.requestCount = 0;
    this.windowStart = Date.now();
  }
  
  async checkLimit() {
    const now = Date.now();
    if (now - this.windowStart >= 60000) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = 60000 - (now - this.windowStart);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.windowStart = Date.now();
      }
    }
    
    this.requestCount++;
  }
  
  getStatus() {
    return {
      count: this.requestCount,
      limit: this.maxRequestsPerMinute,
      remaining: this.maxRequestsPerMinute - this.requestCount
    };
  }
}

const rateLimiter = new RateLimiter();

// ==================== Fetch Prices ====================

async function fetchPrices() {
  const now = Date.now();
  const priceInterval = config.rateLimit?.priceUpdateInterval || config.trading.checkInterval;
  
  if (now - state.lastPriceUpdate < priceInterval && Object.keys(state.priceCache).length > 0) {
    return state.priceCache;
  }
  
  try {
    await rateLimiter.checkLimit();
    
    const pairs = getAllPairs();
    const symbols = pairs.map(p => `"${p}"`).join(',');
    const response = await axios.get(`${BINANCE_API}/ticker/price`, {
      params: { symbols: `[${symbols}]` },
      timeout: 10000
    });
    
    const prices = {};
    response.data.forEach(item => {
      prices[item.symbol] = parseFloat(item.price);
    });
    
    state.lastPriceUpdate = now;
    return prices;
  } catch (error) {
    console.error('❌ Failed to fetch prices:', error.message);
    return null;
  }
}

// ==================== Fetch Volumes ====================

async function fetchVolumes() {
  const now = Date.now();
  const volumeInterval = config.rateLimit?.volumeUpdateInterval || 60000;
  
  if (now - state.lastVolumeUpdate < volumeInterval && Object.keys(state.volumeCache).length > 0) {
    return state.volumeCache;
  }
  
  try {
    await rateLimiter.checkLimit();
    
    const response = await axios.get(`${BINANCE_API}/ticker/24hr`, {
      timeout: 10000
    });
    
    const volumes = {};
    const pairs = getAllPairs();
    
    response.data.forEach(item => {
      if (pairs.includes(item.symbol)) {
        volumes[item.symbol] = parseFloat(item.quoteVolume);
      }
    });
    
    state.lastVolumeUpdate = now;
    return volumes;
  } catch (error) {
    console.error('❌ Failed to fetch volumes:', error.message);
    return {};
  }
}

// ==================== Fetch NOFX Data ====================

async function fetchNOFXData() {
  const now = Date.now();
  const nofxInterval = config.nofx?.updateInterval || 300000; // 5 minutes default
  
  if (now - state.lastNOFXUpdate < nofxInterval && Object.keys(state.nofxCache).length > 0) {
    return state.nofxCache;
  }
  
  try {
    const pairs = getAllPairs();
    const nofxData = {};
    
    // Fetch NOFX data for each pair (with rate limiting)
    for (const pair of pairs) {
      const metrics = await nofxAPI.getEnhancedPairData(pair);
      if (metrics) {
        nofxData[pair] = metrics;
      }
    }
    
    state.lastNOFXUpdate = now;
    state.nofxCache = nofxData;
    return nofxData;
  } catch (error) {
    console.error('❌ Failed to fetch NOFX data:', error.message);
    return state.nofxCache || {};
  }
}

// ==================== Risk Assessment ====================

function assessRisk(spread, volumes, pair1, pair2, nofxData) {
  let riskScore = 0;
  
  // Spread score
  if (spread > 1.0) riskScore += 2;
  else if (spread > 0.7) riskScore += 1;
  
  // Volume score
  const vol1 = volumes[pair1] || 0;
  const vol2 = volumes[pair2] || 0;
  const avgVolume = (vol1 + vol2) / 2;
  
  if (avgVolume > 100000000) riskScore += 2;
  else if (avgVolume > 50000000) riskScore += 1;
  
  // NOFX signal quality score
  if (nofxData) {
    const quality1 = nofxData[pair1]?.signalQuality || 0;
    const quality2 = nofxData[pair2]?.signalQuality || 0;
    const avgQuality = (quality1 + quality2) / 2;
    
    if (avgQuality > 70) riskScore += 2;
    else if (avgQuality > 50) riskScore += 1;
  }
  
  if (riskScore >= 4) return 'low';
  if (riskScore >= 2) return 'medium';
  return 'high';
}

// ==================== Find Arbitrage Opportunities ====================

function findArbitrageOpportunities(prices, volumes, nofxData) {
  const opportunities = [];
  const pairs = Object.keys(prices);
  const minVolume = config.trading.minVolume || 1000000;
  
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const pair1 = pairs[i];
      const pair2 = pairs[j];
      
      const vol1 = volumes[pair1] || 0;
      const vol2 = volumes[pair2] || 0;
      if (vol1 < minVolume || vol2 < minVolume) {
        continue;
      }
      
      if (state.priceCache[pair1] && state.priceCache[pair2]) {
        const change1 = ((prices[pair1] - state.priceCache[pair1]) / state.priceCache[pair1]) * 100;
        const change2 = ((prices[pair2] - state.priceCache[pair2]) / state.priceCache[pair2]) * 100;
        const spread = Math.abs(change1 - change2);
        
        if (spread > config.trading.threshold) {
          const riskLevel = assessRisk(spread, volumes, pair1, pair2, nofxData);
          
          // Get NOFX metrics
          const nofx1 = nofxData[pair1];
          const nofx2 = nofxData[pair2];
          
          opportunities.push({
            pair1,
            pair2,
            spread: spread.toFixed(2),
            change1: change1.toFixed(2),
            change2: change2.toFixed(2),
            suggestion: change1 > change2 ? `Buy ${pair2}, Sell ${pair1}` : `Buy ${pair1}, Sell ${pair2}`,
            riskLevel,
            nofx: {
              quality1: nofx1?.signalQuality || 0,
              quality2: nofx2?.signalQuality || 0,
              avgQuality: ((nofx1?.signalQuality || 0) + (nofx2?.signalQuality || 0)) / 2,
              flow1: nofx1?.totalFlow1h || 0,
              flow2: nofx2?.totalFlow1h || 0,
              ai500Score1: nofx1?.ai500Score || 0,
              ai500Score2: nofx2?.ai500Score || 0
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }
  
  return opportunities;
}

// ==================== Send Telegram Alert ====================

async function sendTelegramAlert(opportunity) {
  try {
    const message = lang === 'zh' ? `
🚨 *套利机会发现！*
_由 NOFX 精准数据驱动_

*交易对:* ${opportunity.pair1} / ${opportunity.pair2}
*价差:* ${opportunity.spread}%
*风险等级:* ${opportunity.riskLevel}

*价格变化:*
${opportunity.pair1}: ${opportunity.change1}%
${opportunity.pair2}: ${opportunity.change2}%

*💡 建议:* ${opportunity.suggestion}

*📊 NOFX 信号质量:*
• ${opportunity.pair1}: ${opportunity.nofx.quality1}/100 (AI: ${opportunity.nofx.ai500Score1})
• ${opportunity.pair2}: ${opportunity.nofx.quality2}/100 (AI: ${opportunity.nofx.ai500Score2})
• 平均质量: ${opportunity.nofx.avgQuality.toFixed(1)}/100

*💰 资金流 (1h):*
• ${opportunity.pair1}: $${opportunity.nofx.flow1.toLocaleString()}
• ${opportunity.pair2}: $${opportunity.nofx.flow2.toLocaleString()}

⏰ *时间:* ${new Date(opportunity.timestamp).toLocaleString('zh-CN')}

🎯 *NOFX 专业数据支持 - 发现更多盈利机会*
    `.trim() : `
🚨 *Arbitrage Opportunity Found!*
_Powered by NOFX Precise Data_

*Pairs:* ${opportunity.pair1} / ${opportunity.pair2}
*Spread:* ${opportunity.spread}%
*Risk Level:* ${opportunity.riskLevel}

*Price Changes:*
${opportunity.pair1}: ${opportunity.change1}%
${opportunity.pair2}: ${opportunity.change2}%

*💡 Suggestion:* ${opportunity.suggestion}

*📊 NOFX Signal Quality:*
• ${opportunity.pair1}: ${opportunity.nofx.quality1}/100 (AI: ${opportunity.nofx.ai500Score1})
• ${opportunity.pair2}: ${opportunity.nofx.quality2}/100 (AI: ${opportunity.nofx.ai500Score2})
• Average Quality: ${opportunity.nofx.avgQuality.toFixed(1)}/100

*💰 Fund Flow (1h):*
• ${opportunity.pair1}: $${opportunity.nofx.flow1.toLocaleString()}
• ${opportunity.pair2}: $${opportunity.nofx.flow2.toLocaleString()}

⏰ *Time:* ${new Date(opportunity.timestamp).toLocaleString('en-US')}

🎯 *NOFX Professional Data - Discover More Profit Opportunities*
    `.trim();
    
    await bot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' });
    console.log('✅ Telegram notification sent');
  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error.message);
  }
}

// ==================== Log ====================

function log(message) {
  const timestamp = new Date().toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', { timeZone: 'Asia/Shanghai' });
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  if (config.logging?.enabled) {
    try {
      fs.appendFileSync(config.logging.file || 'scout.log', logMessage + '\n');
    } catch (err) {
      // Ignore log write errors
    }
  }
}

// ==================== Main Loop ====================

async function mainLoop() {
  try {
    log(lang === 'zh' ? '🦞 交易侦察员正在检查...' : '🦞 Trading Scout checking...');
    
    const limitStatus = rateLimiter.getStatus();
    console.log(`📊 API Status: ${limitStatus.count}/${limitStatus.limit} requests (${limitStatus.remaining} remaining)`);
    
    // Fetch data
    const prices = await fetchPrices();
    if (!prices) {
      console.error(lang === 'zh' ? '⚠️  获取价格失败，跳过本次检查\n' : '⚠️  Failed to fetch prices, skipping this check\n');
      return;
    }
    
    const volumes = await fetchVolumes();
    if (!volumes || Object.keys(volumes).length === 0) {
      console.error(lang === 'zh' ? '⚠️  获取交易量失败，使用缓存数据\n' : '⚠️  Failed to fetch volumes, using cached data\n');
    }
    
    // Fetch NOFX data (less frequently)
    const nofxData = await fetchNOFXData();
    
    // Display current prices
    console.log(lang === 'zh' ? '\n📊 当前价格:' : '\n📊 Current Prices:');
    const allPairs = getAllPairs();
    allPairs.forEach(symbol => {
      const price = prices[symbol];
      if (price) {
        const volume = volumes[symbol] ? `(${(volumes[symbol] / 1000000).toFixed(1)}M)` : '';
        const nofx = nofxData[symbol];
        const quality = nofx ? ` [Q:${nofx.signalQuality}]` : '';
        const source = config.trading.customPairs?.includes(symbol) ? '🔧' : 
                      getAIRecommendations().includes(symbol) ? '🤖' : '';
        console.log(`  ${source}${symbol}: $${price.toLocaleString()} ${volume}${quality}`);
      }
    });
    
    // First run: initialize cache
    if (state.isFirstRun) {
      Object.assign(state.priceCache, prices);
      Object.assign(state.volumeCache, volumes);
      console.log(lang === 'zh' ? 
        '\n✅ 价格缓存已初始化，下次检查将开始发现机会' :
        '\n✅ Price cache initialized, will start detecting opportunities next check');
      console.log(lang === 'zh' ?
        `💡 监控 ${allPairs.length} 个交易对 (基础: ${config.trading.pairs.length}, 自定义: ${config.trading.customPairs?.length || 0}, AI: ${getAIRecommendations().length})` :
        `💡 Monitoring ${allPairs.length} pairs (base: ${config.trading.pairs.length}, custom: ${config.trading.customPairs?.length || 0}, AI: ${getAIRecommendations().length})`);
      console.log('─'.repeat(50) + '\n');
      state.isFirstRun = false;
      return;
    }
    
    // Find opportunities
    const opportunities = findArbitrageOpportunities(prices, volumes, nofxData);
    
    if (opportunities.length > 0) {
      console.log(lang === 'zh' ?
        `\n🎯 发现 ${opportunities.length} 个套利机会:\n` :
        `\n🎯 Found ${opportunities.length} arbitrage opportunities:\n`);
      
      for (const opp of opportunities) {
        console.log(`  ${opp.pair1} / ${opp.pair2}`);
        console.log(lang === 'zh' ?
          `  价差: ${opp.spread}% | 风险: ${opp.riskLevel} | NOFX质量: ${opp.nofx.avgQuality.toFixed(1)}` :
          `  Spread: ${opp.spread}% | Risk: ${opp.riskLevel} | NOFX Quality: ${opp.nofx.avgQuality.toFixed(1)}`);
        console.log(`  ${opp.pair1}: ${opp.change1}% | ${opp.pair2}: ${opp.change2}%`);
        console.log(lang === 'zh' ? `  💡 建议: ${opp.suggestion}\n` : `  💡 Suggestion: ${opp.suggestion}\n`);
        
        await sendTelegramAlert(opp);
        
        state.opportunityHistory.push(opp);
        
        if (state.opportunityHistory.length > MAX_HISTORY) {
          state.opportunityHistory = state.opportunityHistory.slice(-MAX_HISTORY);
        }
      }
    } else {
      console.log(lang === 'zh' ? '\n😴 暂无套利机会\n' : '\n😴 No arbitrage opportunities\n');
    }
    
    // Update cache
    Object.assign(state.priceCache, prices);
    Object.assign(state.volumeCache, volumes);
    
    // Display stats
    console.log(lang === 'zh' ? `📈 历史机会数: ${state.opportunityHistory.length}` : `📈 Historical opportunities: ${state.opportunityHistory.length}`);
    console.log(lang === 'zh' ?
      `🔄 价格更新: ${Math.floor((Date.now() - state.lastPriceUpdate) / 1000)}秒前` :
      `🔄 Price update: ${Math.floor((Date.now() - state.lastPriceUpdate) / 1000)}s ago`);
    console.log(lang === 'zh' ?
      `📊 交易量更新: ${Math.floor((Date.now() - state.lastVolumeUpdate) / 1000)}秒前` :
      `📊 Volume update: ${Math.floor((Date.now() - state.lastVolumeUpdate) / 1000)}s ago`);
    console.log(lang === 'zh' ?
      `🎯 NOFX更新: ${Math.floor((Date.now() - state.lastNOFXUpdate) / 1000)}秒前` :
      `🎯 NOFX update: ${Math.floor((Date.now() - state.lastNOFXUpdate) / 1000)}s ago`);
    console.log('─'.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ mainLoop execution failed:', error.message);
  }
}

// ==================== Start ====================

async function start() {
  console.log('\n' + '='.repeat(50));
  console.log(lang === 'zh' ? '🦞 OpenClaw 交易侦察员启动' : '🦞 OpenClaw Trading Scout Started');
  console.log(lang === 'zh' ? '💰 由 NOFX 社区精准数据支持' : '💰 Powered by NOFX Community Data');
  console.log('='.repeat(50) + '\n');
  
  const allPairs = getAllPairs();
  const customPairs = config.trading.customPairs || [];
  const aiPairs = getAIRecommendations();
  
  console.log(lang === 'zh' ? '📋 配置信息:' : '📋 Configuration:');
  console.log(lang === 'zh' ?
    `  基础交易对: ${config.trading.pairs.join(', ')}` :
    `  Base pairs: ${config.trading.pairs.join(', ')}`);
  if (customPairs.length > 0) {
    console.log(lang === 'zh' ?
      `  🔧 自定义交易对: ${customPairs.join(', ')} (${customPairs.length}/${config.trading.maxCustomPairs || 4})` :
      `  🔧 Custom pairs: ${customPairs.join(', ')} (${customPairs.length}/${config.trading.maxCustomPairs || 4})`);
  }
  if (aiPairs.length > 0) {
    console.log(lang === 'zh' ?
      `  🤖 AI 智能体推荐: ${aiPairs.join(', ')}` :
      `  🤖 AI Agent recommendations: ${aiPairs.join(', ')}`);
  }
  console.log(lang === 'zh' ?
    `  总监控数: ${allPairs.length} 个交易对` :
    `  Total monitoring: ${allPairs.length} pairs`);
  console.log(lang === 'zh' ?
    `  检查间隔: ${config.trading.checkInterval / 1000} 秒` :
    `  Check interval: ${config.trading.checkInterval / 1000} seconds`);
  console.log(lang === 'zh' ?
    `  价格更新: ${(config.rateLimit?.priceUpdateInterval || config.trading.checkInterval) / 1000} 秒` :
    `  Price update: ${(config.rateLimit?.priceUpdateInterval || config.trading.checkInterval) / 1000} seconds`);
  console.log(lang === 'zh' ?
    `  交易量更新: ${(config.rateLimit?.volumeUpdateInterval || 60000) / 1000} 秒` :
    `  Volume update: ${(config.rateLimit?.volumeUpdateInterval || 60000) / 1000} seconds`);
  console.log(lang === 'zh' ?
    `  NOFX更新: ${(config.nofx?.updateInterval || 300000) / 1000} 秒` :
    `  NOFX update: ${(config.nofx?.updateInterval || 300000) / 1000} seconds`);
  console.log(lang === 'zh' ?
    `  价差阈值: ${config.trading.threshold}%` :
    `  Spread threshold: ${config.trading.threshold}%`);
  console.log(lang === 'zh' ?
    `  最小交易量: $${(config.trading.minVolume || 1000000).toLocaleString()}` :
    `  Min volume: $${(config.trading.minVolume || 1000000).toLocaleString()}`);
  console.log(lang === 'zh' ?
    `  API 限流: ${config.rateLimit?.maxRequestsPerMinute || 20} 请求/分钟` :
    `  API rate limit: ${config.rateLimit?.maxRequestsPerMinute || 20} requests/minute`);
  console.log(lang === 'zh' ?
    `  Telegram: ${config.telegram.chatId ? '已配置 ✅' : '未配置 ❌'}` :
    `  Telegram: ${config.telegram.chatId ? 'Configured ✅' : 'Not configured ❌'}`);
  console.log(lang === 'zh' ?
    `  语言: ${lang === 'zh' ? '中文' : 'English'}` :
    `  Language: ${lang === 'zh' ? 'Chinese' : 'English'}`);
  console.log('\n' + (lang === 'zh' ?
    '🎯 NOFX 专业数据 + AI 智能分析 = 发现更多盈利机会' :
    '🎯 NOFX Professional Data + AI Analysis = More Profit Opportunities'));
  console.log('='.repeat(50) + '\n');
  
  // Run immediately
  await mainLoop();
  
  // Schedule periodic runs
  setInterval(mainLoop, config.trading.checkInterval);
  
  console.log(lang === 'zh' ? '✅ 交易侦察员正在运行...' : '✅ Trading Scout is running...');
  console.log(lang === 'zh' ? '💡 按 Ctrl+C 停止\n' : '💡 Press Ctrl+C to stop\n');
}

// ==================== Graceful Shutdown ====================

process.on('SIGINT', () => {
  console.log('\n\n' + '='.repeat(50));
  console.log(lang === 'zh' ? '👋 交易侦察员停止' : '👋 Trading Scout Stopped');
  console.log('='.repeat(50));
  console.log(lang === 'zh' ?
    `📊 总共发现 ${state.opportunityHistory.length} 个套利机会` :
    `📊 Total opportunities found: ${state.opportunityHistory.length}`);
  
  if (state.opportunityHistory.length > 0) {
    const last5 = state.opportunityHistory.slice(-5);
    console.log(lang === 'zh' ? '\n📝 最近 5 个机会:' : '\n📝 Recent 5 opportunities:');
    last5.forEach((opp, index) => {
      console.log(`  ${index + 1}. ${opp.pair1}/${opp.pair2} - ${opp.spread}% (${opp.riskLevel})`);
    });
  } else {
    console.log(lang === 'zh' ? '\n😴 本次运行未发现套利机会' : '\n😴 No opportunities found during this session');
  }
  
  console.log(lang === 'zh' ? '\n💰 感谢使用 NOFX 交易侦察员！' : '\n💰 Thanks for using NOFX Trading Scout!');
  console.log('='.repeat(50) + '\n');
  
  process.exit(0);
});

// ==================== Start Application ====================

start().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
