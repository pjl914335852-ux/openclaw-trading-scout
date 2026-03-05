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
  opportunityHistory: [],
  isFirstRun: true
};

const MAX_HISTORY = 1000; // 最多保留 1000 条历史

// ==================== 获取价格 ====================

async function fetchPrices() {
  try {
    const symbols = config.trading.pairs.map(p => `"${p}"`).join(',');
    const response = await axios.get(`${BINANCE_API}/ticker/price`, {
      params: { symbols: `[${symbols}]` },
      timeout: 10000
    });
    
    const prices = {};
    response.data.forEach(item => {
      prices[item.symbol] = parseFloat(item.price);
    });
    
    return prices;
  } catch (error) {
    console.error('❌ 获取价格失败:', error.message);
    return null;
  }
}

// ==================== 获取交易量 ====================

async function fetchVolumes() {
  try {
    const response = await axios.get(`${BINANCE_API}/ticker/24hr`, {
      timeout: 10000
    });
    
    const volumes = {};
    response.data.forEach(item => {
      if (config.trading.pairs.includes(item.symbol)) {
        volumes[item.symbol] = parseFloat(item.quoteVolume);
      }
    });
    
    return volumes;
  } catch (error) {
    console.error('❌ 获取交易量失败:', error.message);
    return {};
  }
}

// ==================== 风险评估 ====================

function assessRisk(spread, volumes, pair1, pair2) {
  let riskScore = 0;
  
  // 价差越大，风险越低
  if (spread > 1.0) riskScore += 2;
  else if (spread > 0.7) riskScore += 1;
  
  // 交易量越大，风险越低
  const avgVolume = (volumes[pair1] + volumes[pair2]) / 2;
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
      
      // 跳过交易量不足的交易对
      if (volumes[pair1] < minVolume || volumes[pair2] < minVolume) {
        continue;
      }
      
      // 如果有历史价格，计算价格变化率
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
    
    // 获取价格
    const prices = await fetchPrices();
    if (!prices) {
      console.error('⚠️  获取价格失败，跳过本次检查\n');
      return;
    }
    
    // 获取交易量
    const volumes = await fetchVolumes();
    if (!volumes || Object.keys(volumes).length === 0) {
      console.error('⚠️  获取交易量失败，跳过本次检查\n');
      return;
    }
    
    // 显示当前价格
    console.log('\n📊 当前价格:');
    Object.entries(prices).forEach(([symbol, price]) => {
      const volume = volumes[symbol] ? `(${(volumes[symbol] / 1000000).toFixed(1)}M)` : '';
      console.log(`  ${symbol}: $${price.toLocaleString()} ${volume}`);
    });
    
    // 首次运行只初始化缓存
    if (state.isFirstRun) {
      Object.assign(state.priceCache, prices);
      console.log('\n✅ 价格缓存已初始化，下次检查将开始发现机会\n');
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

交易对: ${opp.pair1} / ${opp.pair2}
价差: ${opp.spread}%
风险等级: ${opp.riskLevel}

${opp.pair1} 变化: ${opp.change1}%
${opp.pair2} 变化: ${opp.change2}%

💡 建议: ${opp.suggestion}

⏰ 时间: ${new Date(opp.timestamp).toLocaleString('zh-CN')}
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
    
    // 显示统计
    console.log(`📈 历史机会数: ${state.opportunityHistory.length}`);
    console.log('─'.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ mainLoop 执行失败:', error.message);
  }
}

// ==================== 启动 ====================

async function start() {
  console.log('\n' + '='.repeat(50));
  console.log('🦞 OpenClaw Trading Scout 启动');
  console.log('='.repeat(50) + '\n');
  
  console.log('📋 配置信息:');
  console.log(`  监控交易对: ${config.trading.pairs.join(', ')}`);
  console.log(`  检查间隔: ${config.trading.checkInterval / 1000} 秒`);
  console.log(`  价差阈值: ${config.trading.threshold}%`);
  console.log(`  最小交易量: $${(config.trading.minVolume || 1000000).toLocaleString()}`);
  console.log(`  Telegram: ${config.telegram.chatId ? '已配置 ✅' : '未配置 ❌'}`);
  console.log('\n' + '='.repeat(50) + '\n');
  
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
