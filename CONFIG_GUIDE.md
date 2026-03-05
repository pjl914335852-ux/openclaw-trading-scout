# ⚙️ 配置指南

## 📋 完整配置示例

```json
{
  "telegram": {
    "botToken": "你的_BOT_TOKEN",
    "chatId": "你的_CHAT_ID"
  },
  "trading": {
    "pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"],
    "customPairs": ["LINKUSDT", "UNIUSDT"],
    "maxCustomPairs": 4,
    "threshold": 0.5,
    "checkInterval": 30000,
    "minVolume": 1000000
  },
  "aiAgent": {
    "enabled": true,
    "category": "defi"
  },
  "rateLimit": {
    "maxRequestsPerMinute": 20,
    "priceUpdateInterval": 30000,
    "volumeUpdateInterval": 60000
  },
  "logging": {
    "enabled": true,
    "file": "scout.log"
  }
}
```

---

## 📊 配置项说明

### 1. Telegram 配置（必需）

```json
"telegram": {
  "botToken": "你的_BOT_TOKEN",  // 从 @BotFather 获取
  "chatId": "你的_CHAT_ID"       // 从 @userinfobot 获取
}
```

---

### 2. 交易配置

#### 基础交易对
```json
"pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"]
```
- 默认监控的交易对
- 建议选择主流币种（流动性好）

#### 🔧 自定义交易对（最多 4 个）
```json
"customPairs": ["LINKUSDT", "UNIUSDT"],
"maxCustomPairs": 4
```
- **用途**: 监控你感兴趣的特定代币
- **限制**: 最多 4 个（防止 API 限流）
- **示例**: 
  - DeFi 代币: LINKUSDT, UNIUSDT, AAVEUSDT
  - Layer 2: MATICUSDT, ARBUSDT, OPUSDT
  - Meme 币: DOGEUSDT, SHIBUSDT, PEPEUSDT

#### 其他参数
```json
"threshold": 0.5,        // 价差阈值 (%)
"checkInterval": 30000,  // 检查间隔 (毫秒)
"minVolume": 1000000     // 最小交易量 (美元)
```

**参数调整建议:**
- `threshold`: 
  - 0.3-0.5% - 更多机会，但可能噪音多
  - 0.5-1.0% - 平衡（推荐）
  - 1.0%+ - 更少但更可靠的机会
- `checkInterval`:
  - 最小 10 秒（10000）
  - 推荐 30 秒（30000）- 平衡速度和 API 限制
  - 60 秒（60000）- 更保守，适合长期运行
- `minVolume`:
  - 100 万 - 主流币
  - 50 万 - 包含中等流动性币种
  - 10 万 - 包含小币种（风险高）

---

### 3. 🤖 AI 智能体推荐

```json
"aiAgent": {
  "enabled": true,      // 是否启用 AI 推荐
  "category": "defi"    // 推荐类别
}
```

**可用类别:**

#### `trending` - 趋势币种（默认）
- BTCUSDT - Bitcoin
- ETHUSDT - Ethereum
- BNBUSDT - Binance Coin
- SOLUSDT - Solana

#### `defi` - DeFi 生态
- UNIUSDT - Uniswap (DEX 龙头)
- AAVEUSDT - Aave (借贷协议)
- LINKUSDT - Chainlink (预言机)
- MKRUSDT - Maker (稳定币协议)

#### `layer2` - Layer 2 扩容
- MATICUSDT - Polygon
- ARBUSDT - Arbitrum
- OPUSDT - Optimism

#### `meme` - Meme 币
- DOGEUSDT - Dogecoin
- SHIBUSDT - Shiba Inu
- PEPEUSDT - Pepe

**使用建议:**
- 启用 AI 推荐可以自动监控热门赛道
- 与自定义交易对结合使用效果更好
- 不同类别适合不同市场环境

---

### 4. 🛡️ API 限流保护

```json
"rateLimit": {
  "maxRequestsPerMinute": 20,      // 每分钟最大请求数
  "priceUpdateInterval": 30000,    // 价格更新间隔 (毫秒)
  "volumeUpdateInterval": 60000    // 交易量更新间隔 (毫秒)
}
```

**为什么需要限流？**
- 币安 API 有请求频率限制
- 超限会导致 IP 被临时封禁
- 合理的限流保护账户安全

**参数说明:**
- `maxRequestsPerMinute`: 
  - 默认 20 次/分钟（安全值）
  - 币安限制约 1200 次/分钟，但建议保守设置
- `priceUpdateInterval`:
  - 价格更新频率
  - 最小 10 秒（10000）
  - 推荐 30 秒（30000）
- `volumeUpdateInterval`:
  - 交易量更新频率
  - 可以设置更长（60-120 秒）
  - 交易量变化较慢，不需要频繁更新

**💡 优化建议:**
- 如果监控交易对多（>6 个），增加更新间隔
- 如果只监控 2-4 个，可以保持 30 秒
- 长期运行建议 60 秒更新间隔

**⚠️ 重要提示:**
- `checkInterval` 是检查套利机会的频率
- `priceUpdateInterval` 是实际调用 API 的频率
- 即使 `checkInterval` 是 30 秒，如果价格缓存有效，不会重复调用 API
- 这样可以在保持快速响应的同时，避免 API 限流

---

### 5. 📝 日志配置

```json
"logging": {
  "enabled": true,      // 是否启用日志
  "file": "scout.log"   // 日志文件名
}
```

---

## 🎯 配置示例

### 示例 1: 保守型（长期运行）

```json
{
  "trading": {
    "pairs": ["BTCUSDT", "ETHUSDT"],
    "customPairs": [],
    "threshold": 0.8,
    "checkInterval": 60000,
    "minVolume": 5000000
  },
  "aiAgent": {
    "enabled": false
  },
  "rateLimit": {
    "maxRequestsPerMinute": 15,
    "priceUpdateInterval": 60000,
    "volumeUpdateInterval": 120000
  }
}
```
- 只监控 BTC 和 ETH
- 更高的价差阈值（减少噪音）
- 更长的更新间隔（节省 API 配额）
- 适合 24/7 运行

### 示例 2: 激进型（短期监控）

```json
{
  "trading": {
    "pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"],
    "customPairs": ["LINKUSDT", "UNIUSDT", "AAVEUSDT"],
    "threshold": 0.3,
    "checkInterval": 30000,
    "minVolume": 1000000
  },
  "aiAgent": {
    "enabled": true,
    "category": "defi"
  },
  "rateLimit": {
    "maxRequestsPerMinute": 20,
    "priceUpdateInterval": 30000,
    "volumeUpdateInterval": 60000
  }
}
```
- 监控多个交易对
- 更低的价差阈值（更多机会）
- 启用 AI 推荐
- 适合短期密集监控

### 示例 3: DeFi 专注型

```json
{
  "trading": {
    "pairs": ["ETHUSDT"],
    "customPairs": ["UNIUSDT", "AAVEUSDT", "LINKUSDT", "MKRUSDT"],
    "threshold": 0.5,
    "checkInterval": 30000,
    "minVolume": 500000
  },
  "aiAgent": {
    "enabled": true,
    "category": "defi"
  }
}
```
- 专注 DeFi 生态
- 包含 ETH 作为基准
- 自定义 + AI 推荐结合

---

## 💰 推荐使用 NOFX

**为什么推荐 NOFX？**
- 专业的量化交易数据服务
- 提供实时市场数据和分析
- 与币安深度集成
- 适合自动化交易策略

**如何使用:**
1. 访问 NOFX 官网
2. 注册账户
3. 获取 API 密钥
4. 在币安使用 NOFX 数据进行交易

---

## 🔧 常见问题

### Q: 可以同时监控多少个交易对？
A: 建议不超过 10 个。基础 + 自定义 + AI 推荐总和。

### Q: 30 秒更新会不会太频繁？
A: 不会。程序有智能缓存，只在需要时才调用 API。

### Q: 如何避免 API 限流？
A: 
1. 不要设置过短的更新间隔（最小 10 秒）
2. 监控交易对不要太多（<10 个）
3. 使用默认的限流设置

### Q: AI 推荐的币种会自动更新吗？
A: 不会。AI 推荐是预设的优质币种列表，不会自动变化。

### Q: 自定义交易对为什么限制 4 个？
A: 防止 API 请求过多导致限流。如果需要更多，可以修改 `maxCustomPairs`，但要注意 API 限制。

---

## 📊 监控效果

启动后会显示：

```
📋 配置信息:
  基础交易对: BTCUSDT, ETHUSDT
  🔧 自定义交易对: LINKUSDT, UNIUSDT (2/4)
  🤖 AI 智能体推荐: UNIUSDT, AAVEUSDT, LINKUSDT, MKRUSDT
  总监控数: 6 个交易对
  检查间隔: 30 秒
  价格更新: 30 秒
  交易量更新: 60 秒
  API 限流: 20 请求/分钟

💰 推荐使用 NOFX 在币安交易
```

价格显示会标记来源：
- 无标记 - 基础交易对
- 🔧 - 自定义交易对
- 🤖 - AI 智能体推荐

---

**需要帮助？** 查看 USAGE.md 或提交 Issue！
