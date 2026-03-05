# OpenClaw Trading Scout 🦞

> 让 AI 帮你盯盘 - 24/7 自动监控币安交易机会

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Powered-blue)](https://openclaw.ai)

**龙虾交易侦察兵** - 基于 OpenClaw 的智能交易监控 Agent，为币安生态打造的实用工具。

## 🎉 全新 Pro 版本！

**🚀 Pro 版本 - 6 大全新功能：**
- 📊 **市场情绪分析** - AI 判断看涨/震荡/看跌
- 🔔 **智能价格提醒** - 触发时 AI 自动分析
- 💰 **资金流向分析** - 识别大户动向
- 🎯 **支撑/阻力位** - 订单簿深度分析
- ⚠️ **异常波动监控** - 实时检测暴涨暴跌
- 📈 **历史回测报告** - 统计策略有效性

👉 **[查看 Pro 版本文档](./README-PRO.md)** | **[使用 Pro 版本](./crypto-scout-pro.js)** 🔥

**AI 增强版本：**
- 🤖 AI 深度分析 + 💬 自然语言交互
- 👉 **[查看 AI 版本文档](./README-AI.md)** | **[使用 AI 版本](./crypto-scout-ai.js)**

---

## ✨ 特性

- 🔍 **实时监控** - 24/7 不间断监控多个交易对价格
- 💰 **智能套利** - 自动发现价差机会，计算最佳交易策略
- 📱 **即时推送** - Telegram Bot 实时推送交易信号
- 📊 **数据统计** - 历史机会记录和收益分析
- ⚙️ **灵活配置** - 自定义监控对、阈值、频率
- 🚀 **开箱即用** - 简单配置即可运行

## 🎯 为什么选择 Trading Scout？

传统交易痛点：
- ❌ 人工盯盘累死累活
- ❌ 错过最佳交易时机
- ❌ 情绪化交易导致亏损

Trading Scout 解决方案：
- ✅ AI 24/7 自动监控
- ✅ 毫秒级发现机会
- ✅ 理性分析，稳定盈利

## 🚀 快速开始

### 1. 安装

```bash
# 克隆项目
git clone https://github.com/your-repo/openclaw-trading-scout
cd openclaw-trading-scout

# 安装依赖
npm install
```

### 2. 配置

```bash
# 复制配置模板
cp config.example.json config.json

# 编辑配置文件
nano config.json
```

配置示例：

```json
{
  "cryptoex": {
    "apiKey": "your_cryptoex_api_key",
    "apiSecret": "your_cryptoex_api_secret",
    "testnet": false
  },
  "telegram": {
    "botToken": "your_telegram_bot_token",
    "chatId": "your_telegram_chat_id"
  },
  "trading": {
    "pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"],
    "threshold": 0.5,
    "checkInterval": 5000,
    "minVolume": 1000000
  }
}
```

### 3. 运行

```bash
# 演示模式（无需 API，模拟数据）
npm test

# 正式运行（需要配置 API）
npm start
```

## 📊 运行效果

```
🦞 OpenClaw Trading Scout 启动

监控交易对: BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT
检查间隔: 5 秒
价差阈值: 0.5%

──────────────────────────────────────────────────

[2026-03-05 04:27:26] 🦞 Trading Scout 正在检查...

📊 当前价格:
  BTCUSDT: $96,513.89
  ETHUSDT: $2,857.98
  BNBUSDT: $623.23
  SOLUSDT: $144.65

🎯 发现 1 个套利机会:

  BNBUSDT / ETHUSDT
  价差: 0.62%
  BNBUSDT 变化: 0.38%
  ETHUSDT 变化: -0.38%
  建议: 买入 ETHUSDT, 卖出 BNBUSDT

✅ Telegram 通知已发送

📈 历史机会数: 1
──────────────────────────────────────────────────
```

## 🏗️ 技术架构

```
┌─────────────────┐
│  CryptoExchange API    │  ← 获取实时价格和交易量
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Trading Scout  │  ← OpenClaw Agent 核心
│  (Node.js)      │     - 价格分析
└────────┬────────┘     - 套利计算
         │              - 信号生成
         ▼
┌─────────────────┐
│  Telegram Bot   │  ← 推送通知给用户
└─────────────────┘
```

## 💡 核心算法

```javascript
// 套利机会发现
function findArbitrageOpportunities(prices, volumes) {
  const opportunities = [];
  
  // 遍历所有交易对组合
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      // 计算价格变化率
      const change1 = (prices[pair1] - priceCache[pair1]) / priceCache[pair1] * 100;
      const change2 = (prices[pair2] - priceCache[pair2]) / priceCache[pair2] * 100;
      const spread = Math.abs(change1 - change2);
      
      // 超过阈值则记录
      if (spread > threshold) {
        opportunities.push({
          pair1, pair2, spread,
          suggestion: change1 > change2 
            ? `买入 ${pair2}, 卖出 ${pair1}` 
            : `买入 ${pair1}, 卖出 ${pair2}`
        });
      }
    }
  }
  
  return opportunities;
}
```

## 📱 Telegram 推送示例

```
🚨 套利机会发现！

交易对: BNBUSDT / ETHUSDT
价差: 0.62%
BNBUSDT 变化: 0.38%
ETHUSDT 变化: -0.38%

💡 建议: 买入 ETHUSDT, 卖出 BNBUSDT

⏰ 时间: 2026-03-05 04:27:26
```

## 🎯 为币安生态创造的价值

### 1. 提高交易效率
- 24/7 不间断监控
- 毫秒级响应
- 多市场覆盖

### 2. 降低交易门槛
- 新手友好，AI 给建议
- 风险控制，过滤噪音
- 学习工具，提升认知

### 3. 增强用户粘性
- 真正帮用户赚钱
- 可扩展更多策略
- 社区分享配置

### 4. 推广 OpenClaw
- 展示技术能力
- 开源代码贡献
- 教育开发者

## 🗺️ 未来规划

### 短期（1-2 周）
- [ ] 添加更多交易策略（网格、趋势）
- [ ] 支持更多交易所（OKX、Bybit）
- [ ] Web 控制面板

### 中期（1-2 月）
- [ ] 回测系统
- [ ] 策略优化算法
- [ ] 风险管理模块

### 长期（3-6 月）
- [ ] 自动执行交易（需用户授权）
- [ ] 社区策略市场
- [ ] 移动端 App

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 开源免费使用

## 🔗 相关链接

- [OpenClaw 官网](https://openclaw.ai)
- [OpenClaw 文档](https://docs.openclaw.ai)
- [OpenClaw Discord](https://discord.com/invite/clawd)
- [币安 API 文档](https://cryptoex-docs.github.io/apidocs/)

## 👤 作者

**Brart**
- Telegram: [@Ee_7t](https://t.me/Ee_7t)

## 🙏 鸣谢

- OpenClaw 团队提供强大的 AI Agent 框架
- 币安提供优质的交易 API
- NOFX 提供强大的数据
- 社区提供灵感和反馈

---

⭐ 如果这个项目对你有帮助，请给个 Star！

_Built with ❤️ using OpenClaw_
