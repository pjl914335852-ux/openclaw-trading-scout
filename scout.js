#!/usr/bin/env node

const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// 加载配置
let config;
try {
  config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (err) {
  console.error('❌ 配置文件加载失败，请复制 config.example.json 为 config.json 并填写配置');
  process.exit(1);
}

// 初始化 Telegram Bot
let bot;
if (config.telegram.botToken) {
  bot = new TelegramBot(config.telegram.botToken, { polling: false });
}

// 币安 API 基础 URL
const BINANCE_API = config.binance.testnet 
  ? 'https://testnet.binance.vision/api/v3'
  : 'https://api.binance.com/api/v3';

// 价格缓存
const priceCache = {};
const opportunityHistory = [];

// 获取实时价格
async function fetchPrices() {
  try {
    const symbols = config.trading.pairs.join(',');
    const response = await axios.get(`${BINANCE_API}/ticker/price`, {
      params: { symbols: `["${config.trading.pairs.join('","')}"]` }
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

// 获取24小时交易量
async function fetchVolumes() {
  try {
    const response = await axios.get(`${BINANCE_API}/ticker/24hr`);
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

// 计算价差套利机会
function findArbitrageOpportunities(prices, volumes) {
  const opportunities = [];
  
  // 简单策略：比较不同交易对之间的相对价格变化
  const pairs = Object.keys(prices);
  
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const pair1 = pairs[i];
      const pair2 = pairs[j];
      
      // 跳过交易量不足的交易对
      if (volumes[pair1] < config.trading.minVolume || volumes[pair2] < config.trading.minVolume) {
        continue;
      }
      
      // 如果有历史价格，计算价格变化率
      if (priceCache[pair1] && priceCache[pair2]) {
        const change1 = ((prices[pair1] - priceCache[pair1]) / priceCache[pair1]) * 100;
        const change2 = ((prices[pair2] - priceCache[pair2]) / priceCache[pair2]) * 100;
        const spread = Math.abs(change1 - change2);
        
        if (spread > config.trading.threshold) {
          opportunities.push({
            pair1,
            pair2,
            spread: spread.toFixed(2),
            change1: change1.toFixed(2),
            change2: change2.toFixed(2),
            suggestion: change1 > change2 ? `买入 ${pair2}, 卖出 ${pair1}` : `买入 ${pair1}, 卖出 ${pair2}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }
  
  return opportunities;
}

// 发送 Telegram 通知
async function sendTelegramAlert(opportunity) {
  if (!bot || !config.telegram.chatId) return;
  
  const message = `
🚨 *套利机会发现！*

交易对: ${opportunity.pair1} / ${opportunity.pair2}
价差: ${opportunity.spread}%
${opportunity.pair1} 变化: ${opportunity.change1}%
${opportunity.pair2} 变化: ${opportunity.change2}%

💡 建议: ${opportunity.suggestion}

⏰ 时间: ${new Date(opportunity.timestamp).toLocaleString('zh-CN')}
  `.trim();
  
  try {
    await bot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' });
    console.log('✅ Telegram 通知已发送');
  } catch (error) {
    console.error('❌ Telegram 通知发送失败:', error.message);
  }
}

// 记录日志
function log(message) {
  const timestamp = new Date().toLocaleString('zh-CN');
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  if (config.logging.enabled) {
    fs.appendFileSync(config.logging.file, logMessage + '\n');
  }
}

// 主循环
async function mainLoop() {
  log('🦞 Trading Scout 正在检查...');
  
  // 获取价格
  const prices = await fetchPrices();
  if (!prices) return;
  
  // 获取交易量
  const volumes = await fetchVolumes();
  
  // 显示当前价格
  console.log('\n📊 当前价格:');
  Object.entries(prices).forEach(([symbol, price]) => {
    console.log(`  ${symbol}: $${price.toLocaleString()}`);
  });
  
  // 查找套利机会
  const opportunities = findArbitrageOpportunities(prices, volumes);
  
  if (opportunities.length > 0) {
    console.log(`\n🎯 发现 ${opportunities.length} 个套利机会:\n`);
    
    for (const opp of opportunities) {
      console.log(`  ${opp.pair1} / ${opp.pair2}`);
      console.log(`  价差: ${opp.spread}%`);
      console.log(`  建议: ${opp.suggestion}\n`);
      
      // 发送通知
      await sendTelegramAlert(opp);
      
      // 记录历史
      opportunityHistory.push(opp);
    }
  } else {
    console.log('\n😴 暂无套利机会\n');
  }
  
  // 更新价格缓存
  Object.assign(priceCache, prices);
  
  // 显示统计
  console.log(`📈 历史机会数: ${opportunityHistory.length}`);
  console.log('─'.repeat(50) + '\n');
}

// 启动
async function start() {
  console.log('🦞 OpenClaw Trading Scout 启动\n');
  console.log(`监控交易对: ${config.trading.pairs.join(', ')}`);
  console.log(`检查间隔: ${config.trading.checkInterval / 1000} 秒`);
  console.log(`价差阈值: ${config.trading.threshold}%`);
  console.log(`最小交易量: $${config.trading.minVolume.toLocaleString()}\n`);
  console.log('─'.repeat(50) + '\n');
  
  // 立即执行一次
  await mainLoop();
  
  // 定时执行
  setInterval(mainLoop, config.trading.checkInterval);
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n👋 Trading Scout 停止');
  console.log(`📊 总共发现 ${opportunityHistory.length} 个套利机会`);
  process.exit(0);
});

// 启动
start().catch(err => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});
