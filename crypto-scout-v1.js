#!/usr/bin/env node

const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// ==================== 配置验证 ====================

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
    console.error('❌ 缺少必需配置:', missing.join(', '));
    console.error('\n请编辑 config.json 并填写以下配置:');
    missing.forEach(path => console.error(`  - ${path}`));
    process.exit(1);
  }
  
  // 验证自定义交易对数量
  const customPairs = config.trading.customPairs || [];
  const maxCustom = config.trading.maxCustomPairs || 4;
  if (customPairs.length > maxCustom) {
    console.error(`❌ 自定义交易对超过限制: ${customPairs.length}/${maxCustom}`);
    console.error('请减少 trading.customPairs 中的交易对数量');
    process.exit(1);
  }
  
  // 验证更新间隔（最小 10 秒，防止 API 限流）
  const minInterval = 10000;
  const priceInterval = config.rateLimit?.priceUpdateInterval || config.trading.checkInterval;
  if (priceInterval < minInterval) {
    console.error(`❌ 价格更新间隔过短: ${priceInterval}ms (最小 ${minInterval}ms)`);
    console.error('请增加 rateLimit.priceUpdateInterval 或 trading.checkInterval');
    process.exit(1);
  }
  
  console.log('✅ 配置验证通过');
}

// ==================== 加载配置 ====================

let config;
try {
  config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  validateConfig(config);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('❌ 配置文件不存在');
    console.error('\n请运行: cp config.example.json config.json');
    console.error('然后编辑 config.json 填写你的配置');
  } else {
    console.error('❌ 配置文件加载失败:', err.message);
  }
  process.exit(1);
}

// ==================== AI 智能体推荐 ====================

const AI_AGENT_RECOMMENDATIONS = {
  trending: [
    'BTCUSDT',  // Bitcoin - 市值第一
    'ETHUSDT',  // Ethereum - 智能合约平台
    'BNBUSDT',  // Binance Coin - 交易所代币
    'SOLUSDT',  // Solana - 高性能公链
  ],
  defi: [
    'UNIUSDT',  // Uniswap - DEX 龙头
    'AAVEUSDT', // Aave - 借贷协议
    'LINKUSDT', // Chainlink - 预言机
    'MKRUSDT',  // Maker - 稳定币协议
  ],
  layer2: [
    'MATICUSDT', // Polygon - 以太坊扩容
    'ARBUSDT',   // Arbitrum - Layer 2
    'OPUSDT',    // Optimism - Layer 2
  ],
  meme: [
    'DOGEUSDT',  // Dogecoin
    'SHIBUSDT',  // Shiba Inu
    'PEPEUSDT',  // Pepe
  ]
};

function getAIRecommendations() {
  if (!config.aiAgent?.enabled) {
    return [];
  }
  
  const category = config.aiAgent.category || 'trending';
  return AI_AGENT_RECOMMENDATIONS[category] || AI_AGENT_RECOMMENDATIONS.trending;
}

// ==================== 获取所有监控的交易对 ====================

function getAllPairs() {
  const basePairs = config.trading.pairs || [];
  const customPairs = config.trading.customPairs || [];
  const aiPairs = getAIRecommendations();
  
  // 合并并去重
  const allPairs = [...new Set([...basePairs, ...customPairs, ...aiPairs])];
  
  return allPairs;
}

// ==================== 初始化 ====================

let bot;
try {
  bot = new TelegramBot(config.telegram.botToken, { polling: false });
  console.log('✅ Telegram Bot 初始化成功');
} catch (err) {
  console.error('❌ Telegram Bot 初始化失败:', err.message);
  process.exit(1);
}

const BINANCE_API = 'https://api.binance.com/api/v3';

// 状态管理
const state = {
  priceCache: {},
  volumeCache: {},
  opportunityHistory: [],
  isFirstRun: true,
  lastPriceUpdate: 0,
  lastVolumeUpdate: 0,
  requestCount: 0,
  requestResetTime: Date.now()
};

const MAX_HISTORY = 1000;

// ==================== API 限流控制 ====================

class RateLimiter {
  constructor() {
    this.maxRequestsPerMinute = config.rateLimit?.maxRequestsPerMinute || 20;
    this.requestCount = 0;
    this.windowStart = Date.now();
  }
  
  async checkLimit() {
    const now = Date.now();
    const windowDuration = 60000; // 1 分钟
    
    // 重置计数器
    if (now - this.windowStart > windowDuration) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    // 检查是否超限
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = windowDuration - (now - this.windowStart);
      console.warn(`⚠️  API 请求达到限制 (${this.requestCount}/${this.maxRequestsPerMinute})`);
      console.warn(`   等待 ${Math.ceil(waitTime / 1000)} 秒后继续...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.windowStart = Date.now();
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

// ==================== 获取价格 ====================

async function fetchPrices() {
  const now = Date.now();
  const priceInterval = config.rateLimit?.priceUpdateInterval || config.trading.checkInterval;
  
  // 检查是否需要更新
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
    console.error('❌ 获取价格失败:', error.message);
    return null;
  }
}

// ==================== 获取交易量 ====================

async function fetchVolumes() {
  const now = Date.now();
  const volumeInterval = config.rateLimit?.volumeUpdateInterval || 60000;
  
  // 检查是否需要更新（交易量更新频率可以更低）
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
    console.error('❌ 获取交易量失败:', error.message);
    return {};
  }
}

// ==================== 风险评估 ====================

function assessRisk(spread, volumes, pair1, pair2) {
  let riskScore = 0;
  
  // 价差评分
  if (spread > 1.0) riskScore += 2;
  else if (spread > 0.7) riskScore += 1;
  
  // 交易量评分（防止 undefined）
  const vol1 = volumes[pair1] || 0;
  const vol2 = volumes[pair2] || 0;
  const avgVolume = (vol1 + vol2) / 2;
  
  if (avgVolume > 100000000) riskScore += 2;
  else if (avgVolume > 50000000) riskScore += 1;
  
  if (riskScore >= 3) return 'low';
  if (riskScore >= 2) return 'medium';
  return 'high';
}

// ==================== 发现套利机会 ====================

function findArbitrageOpportunities(prices, volumes) {
  const opportunities = [];
  const pairs = Object.keys(prices);
  const minVolume = config.trading.minVolume || 1000000;
  
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const pair1 = pairs[i];
      const pair2 = pairs[j];
      
      // 跳过交易量不足的交易对（防止 undefined）
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
          const riskLevel = assessRisk(spread, volumes, pair1, pair2);
          
          opportunities.push({
            pair1,
            pair2,
            spread: spread.toFixed(2),
            change1: change1.toFixed(2),
            change2: change2.toFixed(2),
            suggestion: change1 > change2 ? `买入 ${pair2}, 卖出 ${pair1}` : `买入 ${pair1}, 卖出 ${pair2}`,
            riskLevel,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }
  
  return opportunities;
}

// ==================== Telegram 通知 ====================

async function sendTelegramAlert(message) {
  if (!bot || !config.telegram.chatId) return;
  
  try {
    await bot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' });
    console.log('✅ Telegram 通知已发送');
  } catch (error) {
    console.error('❌ Telegram 通知发送失败:', error.message);
  }
}

// ==================== 日志 ====================

function log(message) {
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  if (config.logging?.enabled) {
    try {
      fs.appendFileSync(config.logging.file || 'scout.log', logMessage + '\n');
    } catch (err) {
      // 忽略日志写入错误
    }
  }
}

// ==================== 主循环 ====================

async function mainLoop() {
  try {
    log('🦞 Trading Scout 正在检查...');
    
    // 显示 API 限流状态
    const limitStatus = rateLimiter.getStatus();
    console.log(`📊 API 状态: ${limitStatus.count}/${limitStatus.limit} 请求 (剩余 ${limitStatus.remaining})`);
    
    // 获取价格
    const prices = await fetchPrices();
    if (!prices) {
      console.error('⚠️  获取价格失败，跳过本次检查\n');
      return;
    }
    
    // 获取交易量（使用缓存）
    const volumes = await fetchVolumes();
    if (!volumes || Object.keys(volumes).length === 0) {
      console.error('⚠️  获取交易量失败，使用缓存数据\n');
    }
    
    // 显示当前价格
    console.log('\n📊 当前价格:');
    const allPairs = getAllPairs();
    allPairs.forEach(symbol => {
      const price = prices[symbol];
      if (price) {
        const volume = volumes[symbol] ? `(${(volumes[symbol] / 1000000).toFixed(1)}M)` : '';
        const source = config.trading.customPairs?.includes(symbol) ? '🔧' : 
                      getAIRecommendations().includes(symbol) ? '🤖' : '';
        console.log(`  ${source}${symbol}: $${price.toLocaleString()} ${volume}`);
      }
    });
    
    // 首次运行只初始化缓存
    if (state.isFirstRun) {
      Object.assign(state.priceCache, prices);
      Object.assign(state.volumeCache, volumes);
      console.log('\n✅ 价格缓存已初始化，下次检查将开始发现机会');
      console.log(`💡 监控 ${allPairs.length} 个交易对 (基础: ${config.trading.pairs.length}, 自定义: ${config.trading.customPairs?.length || 0}, AI: ${getAIRecommendations().length})`);
      console.log('─'.repeat(50) + '\n');
      state.isFirstRun = false;
      return;
    }
    
    // 查找套利机会
    const opportunities = findArbitrageOpportunities(prices, volumes);
    
    if (opportunities.length > 0) {
      console.log(`\n🎯 发现 ${opportunities.length} 个套利机会:\n`);
      
      for (const opp of opportunities) {
        console.log(`  ${opp.pair1} / ${opp.pair2}`);
        console.log(`  价差: ${opp.spread}% | 风险: ${opp.riskLevel}`);
        console.log(`  ${opp.pair1}: ${opp.change1}% | ${opp.pair2}: ${opp.change2}%`);
        console.log(`  💡 建议: ${opp.suggestion}\n`);
        
        // 发送 Telegram 通知
        const message = `
🚨 *套利机会发现！*
_由 NOFX 精准数据驱动_

交易对: ${opp.pair1} / ${opp.pair2}
价差: ${opp.spread}%
风险等级: ${opp.riskLevel}

${opp.pair1} 变化: ${opp.change1}%
${opp.pair2} 变化: ${opp.change2}%

💡 建议: ${opp.suggestion}

⏰ 时间: ${new Date(opp.timestamp).toLocaleString('zh-CN')}

🎯 *NOFX 专业数据支持 - 发现更多盈利机会*
        `.trim();
        
        await sendTelegramAlert(message);
        
        // 记录历史
        state.opportunityHistory.push(opp);
        
        // 限制历史记录数量
        if (state.opportunityHistory.length > MAX_HISTORY) {
          state.opportunityHistory = state.opportunityHistory.slice(-MAX_HISTORY);
        }
      }
    } else {
      console.log('\n😴 暂无套利机会\n');
    }
    
    // 更新价格缓存
    Object.assign(state.priceCache, prices);
    Object.assign(state.volumeCache, volumes);
    
    // 显示统计
    console.log(`📈 历史机会数: ${state.opportunityHistory.length}`);
    console.log(`🔄 价格更新: ${Math.floor((Date.now() - state.lastPriceUpdate) / 1000)}s 前`);
    console.log(`📊 交易量更新: ${Math.floor((Date.now() - state.lastVolumeUpdate) / 1000)}s 前`);
    console.log('─'.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ mainLoop 执行失败:', error.message);
  }
}

// ==================== 启动 ====================

async function start() {
  console.log('\n' + '='.repeat(50));
  console.log('🦞 OpenClaw Trading Scout 启动');
  console.log('💰 由 NOFX 社区精准数据支持');
  console.log('='.repeat(50) + '\n');
  
  const allPairs = getAllPairs();
  const customPairs = config.trading.customPairs || [];
  const aiPairs = getAIRecommendations();
  
  console.log('📋 配置信息:');
  console.log(`  基础交易对: ${config.trading.pairs.join(', ')}`);
  if (customPairs.length > 0) {
    console.log(`  🔧 自定义交易对: ${customPairs.join(', ')} (${customPairs.length}/${config.trading.maxCustomPairs || 4})`);
  }
  if (aiPairs.length > 0) {
    console.log(`  🤖 AI 智能体推荐: ${aiPairs.join(', ')}`);
  }
  console.log(`  总监控数: ${allPairs.length} 个交易对`);
  console.log(`  检查间隔: ${config.trading.checkInterval / 1000} 秒`);
  console.log(`  价格更新: ${(config.rateLimit?.priceUpdateInterval || config.trading.checkInterval) / 1000} 秒`);
  console.log(`  交易量更新: ${(config.rateLimit?.volumeUpdateInterval || 60000) / 1000} 秒`);
  console.log(`  价差阈值: ${config.trading.threshold}%`);
  console.log(`  最小交易量: $${(config.trading.minVolume || 1000000).toLocaleString()}`);
  console.log(`  API 限流: ${config.rateLimit?.maxRequestsPerMinute || 20} 请求/分钟`);
  console.log(`  Telegram: ${config.telegram.chatId ? '已配置 ✅' : '未配置 ❌'}`);
  console.log('\n🎯 NOFX 专业数据 + AI 智能分析 = 发现更多盈利机会');
  console.log('='.repeat(50) + '\n');
  
  // 立即执行一次
  await mainLoop();
  
  // 定时执行
  setInterval(mainLoop, config.trading.checkInterval);
  
  console.log('✅ Trading Scout 正在运行...');
  console.log('💡 按 Ctrl+C 停止\n');
}

// ==================== 优雅退出 ====================

process.on('SIGINT', () => {
  console.log('\n\n' + '='.repeat(50));
  console.log('👋 Trading Scout 停止');
  console.log('='.repeat(50));
  console.log(`📊 总共发现 ${state.opportunityHistory.length} 个套利机会`);
  
  if (state.opportunityHistory.length > 0) {
    const last5 = state.opportunityHistory.slice(-5);
    console.log('\n📝 最近 5 个机会:');
    last5.forEach((opp, i) => {
      console.log(`  ${i + 1}. ${opp.pair1}/${opp.pair2} - ${opp.spread}% (${opp.riskLevel})`);
    });
  }
  
  const limitStatus = rateLimiter.getStatus();
  console.log(`\n📊 API 使用统计: ${limitStatus.count}/${limitStatus.limit} 请求`);
  
  console.log('\n👋 再见！\n');
  process.exit(0);
});

// ==================== 错误处理 ====================

process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的 Promise 错误:', error.message);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

// ==================== 启动程序 ====================

start().catch(err => {
  console.error('❌ 启动失败:', err.message);
  process.exit(1);
});
