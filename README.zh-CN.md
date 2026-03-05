# OpenClaw Trading Scout 🦞

> 让 AI 帮你盯盘 - 24/7 自动监控币安交易机会

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Powered-blue)](https://openclaw.ai)

**AI 驱动的交易监控工具** - 基于 OpenClaw 的智能交易监控 Agent，为币安生态打造的实用工具。

## 🦞 什么是 Trading Scout？

**OpenClaw Trading Scout** 是一个免费开源的加密货币套利监控工具，基于 OpenClaw 框架构建。它作为独立的 Node.js 应用程序运行，24/7 监控币安交易对，当发现套利机会时通过 Telegram 即时推送通知。

**由 NOFX 社区强大的精准数据支持** - 利用专业级市场分析和实时数据流，发现其他人错过的盈利机会。

### 💰 完全免费 - 不消耗任何 Token

**重要：此工具不消耗任何 Token，也不产生任何费用！**

- ✅ **不调用 AI API** - 纯数据监控，不使用 Claude/OpenAI/GPT
- ✅ **不产生币安费用** - 使用免费的公开 API 接口
- ✅ **不产生 Telegram 费用** - Bot API 完全免费
- ✅ **没有隐藏成本** - 可以 24/7 免费运行

### 📊 关于币安 API 费用

**问：使用币安数据会消耗 Token 或产生费用吗？**

**答：不会！完全免费！**

**公开数据（无需 API 密钥）：**
- 价格数据 (`/api/v3/ticker/price`) - ✅ 免费
- 24小时行情 (`/api/v3/ticker/24hr`) - ✅ 免费
- K线数据 - ✅ 免费
- 订单簿深度 - ✅ 免费

**私有数据（需要只读 API 密钥）：**
- 账户余额 (`/api/v3/account`) - ✅ 免费
- 订单历史 - ✅ 免费
- 交易历史 - ✅ 免费

**有什么限制？**
- 不是"Token 消耗"而是"请求频率限制"（防止滥用）
- 币安允许每分钟最多 1,200 次请求
- 我们的工具每分钟只用约 20 次请求（非常保守）
- 这是速度限制，不是费用 - 就像免费高速公路有限速一样

**费用明细：**

| 服务 | 费用 | 说明 |
|------|------|------|
| 币安价格数据 | ✅ 免费 | 公开 API，无需密钥 |
| 币安交易量数据 | ✅ 免费 | 公开 API，无需密钥 |
| 币安账户余额 | ✅ 免费 | 需要只读 API 密钥 |
| Telegram 通知 | ✅ 免费 | Bot API 完全免费 |
| 服务器托管 | ✅ 免费 | 你自己的服务器 |

**总费用：0 元/天 = 0 元/月 = 0 元/年**

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

### 🎯 核心特性

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

**挑战：**
- 加密市场 24/7 运行，人工监控难以持续
- 交易机会稍纵即逝，容易错过最佳时机
- 情绪化决策影响交易表现

**解决方案：**
- ✅ AI 全天候自动监控
- ✅ 实时发现交易机会
- ✅ 数据驱动的理性分析

## 🚀 快速开始

### 前置要求
- Node.js 18+
- Telegram Bot Token
- 币安 API 密钥（只读权限）

### 1. 安装

```bash
# 克隆项目
git clone https://github.com/pjl914335852-ux/openclaw-trading-scout
cd openclaw-trading-scout

# 安装依赖
npm install
```

### 2. 获取 API 密钥（可选）

**💰 费用：完全免费**
- **价格数据（公开 API）**：无需 API 密钥，不消耗配额
- **账户余额（私有 API）**：需要 API 密钥，但免费（不消耗配额）
- **所有监控功能**：100% 免费，无任何费用

**什么时候需要？**
- ✅ 查看账户余额
- ✅ 未来的自动交易功能
- ❌ 只监控价格不需要

**如何获取：**
1. 登录 [币安](https://www.binance.com)
2. 进入 个人中心 → API 管理
3. 创建新的 API Key
4. **重要安全设置：**
   - ✅ 启用 "读取权限"（必需）
   - ✅ 启用 "现货交易"（未来交易需要）
   - ❌ 禁用 "提现权限"（安全！）
   - ✅ 限制 IP 访问（推荐）

**安全提示：**
- 🔒 永远不要分享 Secret Key
- 🔒 务必禁用提现权限
- 🔒 使用 IP 白名单
- 🔒 新手建议先用测试网（`"testnet": true`）

### 3. 配置

```bash
# 复制配置模板
cp config.example.json config.json

# 编辑配置文件
nano config.json
```

最小配置示例：

```json
{
  "telegram": {
    "botToken": "your_telegram_bot_token",
    "chatId": "your_telegram_chat_id"
  },
  "trading": {
    "pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"],
    "threshold": 0.5,
    "checkInterval": 30000,
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
- [ ] Web 控制面板
- [ ] 回测系统

### 中期（1-2 月）
- [ ] 策略优化算法
- [ ] 风险管理增强
- [ ] 自动执行交易（测试网）

### 长期（3-6 月）
- [ ] 实盘交易（需用户授权）
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
