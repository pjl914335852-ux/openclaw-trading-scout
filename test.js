#!/usr/bin/env node

// 测试脚本 - 不需要真实 API，模拟数据演示功能

console.log('🦞 OpenClaw Trading Scout - 演示模式\n');
console.log('监控交易对: BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT');
console.log('检查间隔: 5 秒');
console.log('价差阈值: 0.5%\n');
console.log('─'.repeat(50) + '\n');

// 模拟价格数据
let iteration = 0;
const basePrices = {
  BTCUSDT: 95234.50,
  ETHUSDT: 2845.20,
  BNBUSDT: 612.80,
  SOLUSDT: 142.35
};

function randomChange(base, maxPercent = 2) {
  const change = (Math.random() - 0.5) * 2 * maxPercent / 100;
  return base * (1 + change);
}

function simulateCheck() {
  iteration++;
  const timestamp = new Date().toLocaleString('zh-CN');
  
  console.log(`[${timestamp}] 🦞 Trading Scout 正在检查...\n`);
  
  // 生成模拟价格
  const prices = {};
  Object.entries(basePrices).forEach(([symbol, base]) => {
    prices[symbol] = randomChange(base);
  });
  
  // 显示价格
  console.log('📊 当前价格:');
  Object.entries(prices).forEach(([symbol, price]) => {
    console.log(`  ${symbol}: $${price.toFixed(2).toLocaleString()}`);
  });
  
  // 模拟套利机会（每3次检查发现一次）
  if (iteration % 3 === 0) {
    const pairs = Object.keys(prices);
    const pair1 = pairs[Math.floor(Math.random() * pairs.length)];
    let pair2 = pairs[Math.floor(Math.random() * pairs.length)];
    while (pair2 === pair1) {
      pair2 = pairs[Math.floor(Math.random() * pairs.length)];
    }
    
    const spread = (Math.random() * 1.5 + 0.5).toFixed(2);
    const change1 = (Math.random() * 2 - 1).toFixed(2);
    const change2 = (Math.random() * 2 - 1).toFixed(2);
    
    console.log(`\n🎯 发现 1 个套利机会:\n`);
    console.log(`  ${pair1} / ${pair2}`);
    console.log(`  价差: ${spread}%`);
    console.log(`  ${pair1} 变化: ${change1}%`);
    console.log(`  ${pair2} 变化: ${change2}%`);
    console.log(`  建议: ${parseFloat(change1) > parseFloat(change2) ? `买入 ${pair2}, 卖出 ${pair1}` : `买入 ${pair1}, 卖出 ${pair2}`}\n`);
    console.log('✅ Telegram 通知已发送（演示模式）');
  } else {
    console.log('\n😴 暂无套利机会');
  }
  
  console.log(`\n📈 历史机会数: ${Math.floor(iteration / 3)}`);
  console.log('─'.repeat(50) + '\n');
}

// 运行5次演示
let count = 0;
const interval = setInterval(() => {
  simulateCheck();
  count++;
  
  if (count >= 5) {
    clearInterval(interval);
    console.log('\n👋 演示结束');
    console.log(`📊 总共发现 ${Math.floor(count / 3)} 个套利机会\n`);
    console.log('💡 提示: 编辑 config.json 配置真实 API 后运行 npm start');
  }
}, 3000);

console.log('⏳ 演示运行中，将执行 5 次检查...\n');
