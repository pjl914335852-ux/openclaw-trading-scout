#!/usr/bin/env node

const axios = require('axios');
const crypto = require('crypto');
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
const BINANCE_API = config.cryptoex.testnet 
  ? 'https://testnet.cryptoex.vision/api/v3'
  : 'https://api.cryptoex.com/api/v3';

// 状态管理
const state = {
  priceCache: {},
  opportunityHistory: [],
  activePositions: [],
  accountBalance: {},
  orderHistory: []
};

// ==================== 币安 API 签名 ====================

function signRequest(params) {
  const queryString = Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const signature = crypto
    .createHmac('sha256', config.cryptoex.apiSecret)
    .update(queryString)
    .digest('hex');
  
  return { ...params, signature };
}

// ==================== 账户管理 ====================

async function getAccountBalance() {
  if (!config.cryptoex.apiKey) {
    console.log('⚠️  未配置 API Key，跳过余额查询');
    return null;
  }

  try {
    const timestamp = Date.now();
    const params = signRequest({ timestamp });
    
    const response = await axios.get(`${BINANCE_API}/account`, {
      params,
      headers: { 'X-MBX-APIKEY': config.cryptoex.apiKey }
    });
    
    const balances = {};
    response.data.balances.forEach(item => {
      const free = parseFloat(item.free);
      const locked = parseFloat(item.locked);
      if (free > 0 || locked > 0) {
        balances[item.asset] = { free, locked, total: free + locked };
      }
    });
    
    state.accountBalance = balances;
    return balances;
  } catch (error) {
    console.error('❌ 获取账户余额失败:', error.response?.data || error.message);
    return null;
  }
}

// ==================== 仓位管理 ====================

class PositionManager {
  constructor() {
    this.maxPositions = config.trading.maxPositions || 3;
    this.maxPositionSize = config.trading.maxPositionSize || 0.1; // 10% of balance
    this.minPositionSize = config.trading.minPositionSize || 0.02; // 2% of balance
  }

  // 计算建议仓位大小
  calculatePositionSize(balance, price, riskLevel = 'medium') {
    const riskMultipliers = {
      low: 0.5,
      medium: 1.0,
      high: 1.5
    };
    
    const multiplier = riskMultipliers[riskLevel] || 1.0;
    const baseSize = balance * this.maxPositionSize * multiplier;
    
    // 确保在最小和最大范围内
    const minSize = balance * this.minPositionSize;
    const maxSize = balance * this.maxPositionSize;
    
    return Math.max(minSize, Math.min(baseSize, maxSize));
  }

  // 检查是否可以开新仓
  canOpenPosition() {
    return state.activePositions.length < this.maxPositions;
  }

  // 添加仓位
  addPosition(position) {
    state.activePositions.push({
      ...position,
      id: `pos_${Date.now()}`,
      openTime: new Date().toISOString(),
      status: 'open'
    });
    
    this.savePositions();
  }

  // 关闭仓位
  closePosition(positionId, closePrice, reason) {
    const position = state.activePositions.find(p => p.id === positionId);
    if (!position) return null;

    position.closePrice = closePrice;
    position.closeTime = new Date().toISOString();
    position.status = 'closed';
    position.closeReason = reason;
    position.pnl = this.calculatePnL(position);
    position.pnlPercent = ((position.closePrice - position.entryPrice) / position.entryPrice * 100).toFixed(2);

    // 移到历史记录
    state.orderHistory.push(position);
    state.activePositions = state.activePositions.filter(p => p.id !== positionId);
    
    this.savePositions();
    return position;
  }

  // 计算盈亏
  calculatePnL(position) {
    const priceDiff = position.closePrice - position.entryPrice;
    return (priceDiff * position.quantity).toFixed(2);
  }

  // 保存仓位到文件
  savePositions() {
    const data = {
      activePositions: state.activePositions,
      orderHistory: state.orderHistory,
      lastUpdate: new Date().toISOString()
    };
    
    fs.writeFileSync('positions.json', JSON.stringify(data, null, 2));
  }

  // 加载仓位
  loadPositions() {
    try {
      if (fs.existsSync('positions.json')) {
        const data = JSON.parse(fs.readFileSync('positions.json', 'utf8'));
        state.activePositions = data.activePositions || [];
        state.orderHistory = data.orderHistory || [];
      }
    } catch (error) {
      console.error('⚠️  加载仓位失败:', error.message);
    }
  }
}

// ==================== 风险控制 ====================

class RiskManager {
  constructor() {
    this.stopLossPercent = config.trading.stopLoss || 2.0; // 2% 止损
    this.takeProfitPercent = config.trading.takeProfit || 5.0; // 5% 止盈
    this.trailingStopPercent = config.trading.trailingStop || 1.5; // 1.5% 移动止损
  }

  // 计算止损价格
  calculateStopLoss(entryPrice, side = 'BUY') {
    if (side === 'BUY') {
      return entryPrice * (1 - this.stopLossPercent / 100);
    } else {
      return entryPrice * (1 + this.stopLossPercent / 100);
    }
  }

  // 计算止盈价格
  calculateTakeProfit(entryPrice, side = 'BUY') {
    if (side === 'BUY') {
      return entryPrice * (1 + this.takeProfitPercent / 100);
    } else {
      return entryPrice * (1 - this.takeProfitPercent / 100);
    }
  }

  // 检查是否触发止损
  shouldStopLoss(position, currentPrice) {
    if (position.side === 'BUY') {
      return currentPrice <= position.stopLoss;
    } else {
      return currentPrice >= position.stopLoss;
    }
  }

  // 检查是否触发止盈
  shouldTakeProfit(position, currentPrice) {
    if (position.side === 'BUY') {
      return currentPrice >= position.takeProfit;
    } else {
      return currentPrice <= position.takeProfit;
    }
  }

  // 更新移动止损
  updateTrailingStop(position, currentPrice) {
    if (position.side === 'BUY') {
      const newStopLoss = currentPrice * (1 - this.trailingStopPercent / 100);
      if (newStopLoss > position.stopLoss) {
        position.stopLoss = newStopLoss;
        return true;
      }
    } else {
      const newStopLoss = currentPrice * (1 + this.trailingStopPercent / 100);
      if (newStopLoss < position.stopLoss) {
        position.stopLoss = newStopLoss;
        return true;
      }
    }
    return false;
  }

  // 评估风险等级
  assessRisk(opportunity, volumes) {
    let riskScore = 0;
    
    // 价差越大，风险越低
    if (opportunity.spread > 1.0) riskScore += 2;
    else if (opportunity.spread > 0.7) riskScore += 1;
    
    // 交易量越大，风险越低
    const avgVolume = (volumes[opportunity.pair1] + volumes[opportunity.pair2]) / 2;
    if (avgVolume > 100000000) riskScore += 2; // > 1亿
    else if (avgVolume > 50000000) riskScore += 1; // > 5千万
    
    // 返回风险等级
    if (riskScore >= 3) return 'low';
    if (riskScore >= 2) return 'medium';
    return 'high';
  }
}

// ==================== 订单跟踪 ====================

class OrderTracker {
  constructor() {
    this.checkInterval = 5000; // 5秒检查一次
  }

  // 启动订单监控
  startTracking() {
    setInterval(() => this.checkPositions(), this.checkInterval);
  }

  // 检查所有持仓
  async checkPositions() {
    if (state.activePositions.length === 0) return;

    console.log(`\n🔍 检查 ${state.activePositions.length} 个持仓...`);

    for (const position of state.activePositions) {
      const currentPrice = state.priceCache[position.symbol];
      if (!currentPrice) continue;

      // 检查止损
      if (riskManager.shouldStopLoss(position, currentPrice)) {
        console.log(`🛑 触发止损: ${position.symbol} @ $${currentPrice}`);
        await this.closePosition(position, currentPrice, 'stop_loss');
        continue;
      }

      // 检查止盈
      if (riskManager.shouldTakeProfit(position, currentPrice)) {
        console.log(`🎯 触发止盈: ${position.symbol} @ $${currentPrice}`);
        await this.closePosition(position, currentPrice, 'take_profit');
        continue;
      }

      // 更新移动止损
      if (riskManager.updateTrailingStop(position, currentPrice)) {
        console.log(`📈 更新移动止损: ${position.symbol} 新止损价 $${position.stopLoss.toFixed(2)}`);
        positionManager.savePositions();
      }

      // 显示当前盈亏
      const unrealizedPnL = ((currentPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2);
      console.log(`  ${position.symbol}: ${unrealizedPnL}% (当前 $${currentPrice}, 入场 $${position.entryPrice})`);
    }
  }

  // 关闭仓位
  async closePosition(position, closePrice, reason) {
    const closedPosition = positionManager.closePosition(position.id, closePrice, reason);
    
    if (closedPosition) {
      const message = `
🔔 *仓位已关闭*

交易对: ${closedPosition.symbol}
入场价: $${closedPosition.entryPrice}
出场价: $${closePrice}
盈亏: ${closedPosition.pnlPercent}% ($${closedPosition.pnl})
原因: ${reason === 'stop_loss' ? '止损' : reason === 'take_profit' ? '止盈' : '手动'}
持仓时间: ${this.calculateDuration(closedPosition.openTime, closedPosition.closeTime)}
      `.trim();
      
      await sendTelegramAlert(message);
    }
  }

  // 计算持仓时长
  calculateDuration(openTime, closeTime) {
    const duration = new Date(closeTime) - new Date(openTime);
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
}

// 初始化管理器
const positionManager = new PositionManager();
const riskManager = new RiskManager();
const orderTracker = new OrderTracker();

// ==================== 原有功能 ====================

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

function findArbitrageOpportunities(prices, volumes) {
  const opportunities = [];
  const pairs = Object.keys(prices);
  
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const pair1 = pairs[i];
      const pair2 = pairs[j];
      
      if (volumes[pair1] < config.trading.minVolume || volumes[pair2] < config.trading.minVolume) {
        continue;
      }
      
      if (state.priceCache[pair1] && state.priceCache[pair2]) {
        const change1 = ((prices[pair1] - state.priceCache[pair1]) / state.priceCache[pair1]) * 100;
        const change2 = ((prices[pair2] - state.priceCache[pair2]) / state.priceCache[pair2]) * 100;
        const spread = Math.abs(change1 - change2);
        
        if (spread > config.trading.threshold) {
          const opportunity = {
            pair1,
            pair2,
            spread: spread.toFixed(2),
            change1: change1.toFixed(2),
            change2: change2.toFixed(2),
            suggestion: change1 > change2 ? `买入 ${pair2}, 卖出 ${pair1}` : `买入 ${pair1}, 卖出 ${pair2}`,
            timestamp: new Date().toISOString(),
            riskLevel: riskManager.assessRisk({ spread, pair1, pair2 }, volumes)
          };
          
          opportunities.push(opportunity);
        }
      }
    }
  }
  
  return opportunities;
}

async function sendTelegramAlert(message) {
  if (!bot || !config.telegram.chatId) return;
  
  try {
    await bot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' });
    console.log('✅ Telegram 通知已发送');
  } catch (error) {
    console.error('❌ Telegram 通知发送失败:', error.message);
  }
}

function log(message) {
  const timestamp = new Date().toLocaleString('zh-CN');
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  if (config.logging.enabled) {
    fs.appendFileSync(config.logging.file, logMessage + '\n');
  }
}

async function mainLoop() {
  log('🦞 Trading Scout 正在检查...');
  
  const prices = await fetchPrices();
  if (!prices) return;
  
  const volumes = await fetchVolumes();
  
  console.log('\n📊 当前价格:');
  Object.entries(prices).forEach(([symbol, price]) => {
    console.log(`  ${symbol}: $${price.toLocaleString()}`);
  });
  
  // 显示账户余额
  if (config.cryptoex.apiKey) {
    const balance = await getAccountBalance();
    if (balance) {
      console.log('\n💰 账户余额:');
      Object.entries(balance).forEach(([asset, bal]) => {
        if (bal.total > 0.01) {
          console.log(`  ${asset}: ${bal.total.toFixed(4)} (可用: ${bal.free.toFixed(4)})`);
        }
      });
    }
  }
  
  // 显示持仓
  if (state.activePositions.length > 0) {
    console.log('\n📈 当前持仓:');
    state.activePositions.forEach(pos => {
      const currentPrice = prices[pos.symbol];
      const unrealizedPnL = currentPrice ? ((currentPrice - pos.entryPrice) / pos.entryPrice * 100).toFixed(2) : 'N/A';
      console.log(`  ${pos.symbol}: ${pos.quantity} @ $${pos.entryPrice} (${unrealizedPnL}%)`);
      console.log(`    止损: $${pos.stopLoss.toFixed(2)} | 止盈: $${pos.takeProfit.toFixed(2)}`);
    });
  }
  
  const opportunities = findArbitrageOpportunities(prices, volumes);
  
  if (opportunities.length > 0) {
    console.log(`\n🎯 发现 ${opportunities.length} 个套利机会:\n`);
    
    for (const opp of opportunities) {
      console.log(`  ${opp.pair1} / ${opp.pair2}`);
      console.log(`  价差: ${opp.spread}% | 风险: ${opp.riskLevel}`);
      console.log(`  建议: ${opp.suggestion}\n`);
      
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
      state.opportunityHistory.push(opp);
    }
  } else {
    console.log('\n😴 暂无套利机会\n');
  }
  
  Object.assign(state.priceCache, prices);
  
  console.log(`📈 历史机会数: ${state.opportunityHistory.length}`);
  console.log(`📊 持仓数: ${state.activePositions.length}/${positionManager.maxPositions}`);
  console.log(`📜 历史订单: ${state.orderHistory.length}`);
  console.log('─'.repeat(50) + '\n');
}

async function start() {
  console.log('🦞 OpenClaw Trading Scout Pro 启动\n');
  console.log(`监控交易对: ${config.trading.pairs.join(', ')}`);
  console.log(`检查间隔: ${config.trading.checkInterval / 1000} 秒`);
  console.log(`价差阈值: ${config.trading.threshold}%`);
  console.log(`最小交易量: $${config.trading.minVolume.toLocaleString()}`);
  console.log(`\n风险控制:`);
  console.log(`  止损: ${riskManager.stopLossPercent}%`);
  console.log(`  止盈: ${riskManager.takeProfitPercent}%`);
  console.log(`  移动止损: ${riskManager.trailingStopPercent}%`);
  console.log(`\n仓位管理:`);
  console.log(`  最大持仓数: ${positionManager.maxPositions}`);
  console.log(`  最大仓位: ${(positionManager.maxPositionSize * 100).toFixed(0)}%`);
  console.log(`  最小仓位: ${(positionManager.minPositionSize * 100).toFixed(0)}%`);
  console.log('\n─'.repeat(50) + '\n');
  
  // 加载历史仓位
  positionManager.loadPositions();
  
  // 启动订单跟踪
  orderTracker.startTracking();
  
  await mainLoop();
  setInterval(mainLoop, config.trading.checkInterval);
}

process.on('SIGINT', () => {
  console.log('\n\n👋 Trading Scout 停止');
  console.log(`📊 总共发现 ${state.opportunityHistory.length} 个套利机会`);
  console.log(`💰 总订单数: ${state.orderHistory.length}`);
  
  if (state.orderHistory.length > 0) {
    const totalPnL = state.orderHistory.reduce((sum, order) => sum + parseFloat(order.pnl || 0), 0);
    console.log(`📈 总盈亏: $${totalPnL.toFixed(2)}`);
  }
  
  process.exit(0);
});

start().catch(err => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});
