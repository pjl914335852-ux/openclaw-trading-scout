# 🚀 快速使用指南

## 📋 第一步：获取 Telegram Bot Token

### 1. 创建 Telegram Bot

1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按提示设置 Bot 名称和用户名
4. 复制 Bot Token（类似：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 2. 获取你的 Chat ID

1. 在 Telegram 中搜索 `@userinfobot`
2. 点击 Start
3. 复制你的 ID（纯数字，如：`6249730195`）

---

## 🔑 第二步：获取币安 API 密钥（可选）

### 什么时候需要 API 密钥？

**需要：**
- ✅ 查看账户余额
- ✅ 未来的自动交易功能（Phase 2）

**不需要：**
- ❌ 只监控价格和发现机会
- ❌ 接收 Telegram 通知

### 如何获取币安 API 密钥

#### 1. 登录币安账户
访问 [https://www.binance.com](https://www.binance.com) 并登录

#### 2. 进入 API 管理
- 点击右上角头像
- 选择 "API Management"（API 管理）

#### 3. 创建 API Key
- 点击 "Create API"（创建 API）
- 输入标签名称（如：Trading Scout）
- 完成安全验证（邮箱/手机验证码）

#### 4. 配置权限（重要！）

**必须启用：**
- ✅ **Enable Reading** - 读取权限（必需）
- ✅ **Enable Spot & Margin Trading** - 现货交易（未来自动交易需要）

**必须禁用：**
- ❌ **Enable Withdrawals** - 提现权限（安全起见，禁用！）

**推荐设置：**
- ✅ **Restrict access to trusted IPs** - IP 白名单
  - 添加你的服务器 IP：`139.180.208.140`
  - 或者你的本地 IP

#### 5. 保存密钥
- 复制 **API Key**（公钥）
- 复制 **Secret Key**（私钥，只显示一次！）
- ⚠️ **Secret Key 只显示一次，务必保存好！**

#### 6. 测试网（推荐新手）

如果想先测试，可以使用币安测试网：

1. 访问 [https://testnet.binance.vision](https://testnet.binance.vision)
2. 用 GitHub 账号登录
3. 生成测试网 API Key
4. 配置时设置 `"testnet": true`

---

## ⚙️ 第三步：配置

## ⚙️ 第三步：配置

编辑 `config.json` 文件：

### 最小配置（只监控）

如果只想监控价格和接收通知，不需要 API Key：

```json
{
  "telegram": {
    "botToken": "你的_BOT_TOKEN",
    "chatId": "你的_CHAT_ID"
  },
  "trading": {
    "pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"],
    "threshold": 0.5,
    "checkInterval": 30000,
    "minVolume": 1000000
  }
}
```

### 完整配置（包含 API Key）

如果想查看余额和使用未来的交易功能：

```json
{
  "cryptoex": {
    "apiKey": "你的_API_KEY",
    "apiSecret": "你的_SECRET_KEY",
    "testnet": false
  },
  "telegram": {
    "botToken": "你的_BOT_TOKEN",
    "chatId": "你的_CHAT_ID"
  },
  "trading": {
    "pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"],
    "threshold": 0.5,
    "checkInterval": 30000,
    "minVolume": 1000000,
    "stopLoss": 2.0,
    "takeProfit": 5.0,
    "trailingStop": 1.5,
    "maxPositions": 3,
    "maxPositionSize": 0.1,
    "minPositionSize": 0.02
  }
}
```

**配置说明：**

**Binance API（可选）：**
- `apiKey`: 从币安 API 管理获取
- `apiSecret`: 从币安 API 管理获取（只显示一次！）
- `testnet`: 是否使用测试网（`true` = 测试网，`false` = 正式网）

**Telegram（必需）：**
- `botToken`: 从 BotFather 获取的 Token
- `chatId`: 你的 Telegram 用户 ID

**交易参数：**
- `pairs`: 要监控的交易对（可以添加更多）
- `threshold`: 价差阈值（0.5 = 0.5%）
- `checkInterval`: 检查间隔（30000 = 30秒）
- `minVolume`: 最小交易量（1000000 = 100万美元）

**风险控制（可选）：**
- `stopLoss`: 止损百分比（2.0 = 2%）
- `takeProfit`: 止盈百分比（5.0 = 5%）
- `trailingStop`: 移动止损百分比（1.5 = 1.5%）

**仓位管理（可选）：**
- `maxPositions`: 最大持仓数（3 = 最多 3 个）
- `maxPositionSize`: 最大仓位（0.1 = 10%）
- `minPositionSize`: 最小仓位（0.02 = 2%）

---

## 🎯 第四步：运行

```bash
# 进入项目目录
cd /root/.openclaw/workspace/crypto-trading-scout

# 运行监控程序
node crypto-scout.js
```

---

## 🔒 安全提示

### API Key 安全

1. **永远不要分享你的 Secret Key**
   - Secret Key 只显示一次
   - 任何人拿到 Secret Key 都可以操作你的账户

2. **禁用提现权限**
   - 创建 API Key 时，务必禁用 "Enable Withdrawals"
   - 即使 API Key 泄露，也无法提现

3. **使用 IP 白名单**
   - 限制只有特定 IP 可以使用 API Key
   - 添加你的服务器 IP：`139.180.208.140`

4. **定期更换 API Key**
   - 建议每 3-6 个月更换一次
   - 如果怀疑泄露，立即删除并重新创建

5. **使用测试网测试**
   - 新手建议先用测试网（testnet）
   - 测试网使用虚拟资金，不会有真实损失

6. **不要把 config.json 推送到 GitHub**
   - config.json 包含敏感信息
   - 已添加到 .gitignore，但要确认

### 交易安全

1. **这是监控工具，不会自动交易**
   - 所有机会需要人工判断
   - 不会自动下单

2. **价差不等于利润**
   - 需要考虑手续费（0.1%）
   - 需要考虑滑点
   - 需要考虑执行时间

3. **建议先观察**
   - 运行几天，了解市场规律
   - 记录哪些机会最频繁
   - 分析哪些机会风险最低

---

## 📊 运行效果

### 启动信息
```
==================================================
🦞 OpenClaw Trading Scout 启动
==================================================

📋 配置信息:
  监控交易对: BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT
  检查间隔: 30 秒
  价差阈值: 0.5%
  最小交易量: $1,000,000
  Telegram: 已配置 ✅

==================================================

✅ 配置验证通过
✅ Telegram Bot 初始化成功
```

### 首次检查
```
[2026-03-06 02:20:00] 🦞 Trading Scout 正在检查...

📊 当前价格:
  BTCUSDT: $96,513.89 (1234.5M)
  ETHUSDT: $2,857.98 (567.8M)
  BNBUSDT: $623.23 (89.2M)
  SOLUSDT: $145.67 (234.1M)

✅ 价格缓存已初始化，下次检查将开始发现机会

──────────────────────────────────────────────────
```

### 发现机会
```
[2026-03-06 02:20:30] 🦞 Trading Scout 正在检查...

📊 当前价格:
  BTCUSDT: $96,600.00 (1234.5M)
  ETHUSDT: $2,850.00 (567.8M)
  BNBUSDT: $625.00 (89.2M)
  SOLUSDT: $146.00 (234.1M)

🎯 发现 1 个套利机会:

  BTCUSDT / ETHUSDT
  价差: 0.62% | 风险: medium
  BTCUSDT: +0.09% | ETHUSDT: -0.28%
  💡 建议: 买入 ETHUSDT, 卖出 BTCUSDT

✅ Telegram 通知已发送

📈 历史机会数: 1
──────────────────────────────────────────────────
```

### Telegram 通知
你会在 Telegram 收到：
```
🚨 套利机会发现！

交易对: BTCUSDT / ETHUSDT
价差: 0.62%
风险等级: medium

BTCUSDT 变化: +0.09%
ETHUSDT 变化: -0.28%

💡 建议: 买入 ETHUSDT, 卖出 BTCUSDT

⏰ 时间: 2026-03-06 02:20:30
```

---

## 🛑 停止程序

按 `Ctrl + C` 停止，会显示统计信息：

```
==================================================
👋 Trading Scout 停止
==================================================
📊 总共发现 15 个套利机会

📝 最近 5 个机会:
  1. BTCUSDT/ETHUSDT - 0.62% (medium)
  2. BNBUSDT/SOLUSDT - 0.78% (low)
  3. ETHUSDT/SOLUSDT - 0.55% (high)
  4. BTCUSDT/BNBUSDT - 0.91% (low)
  5. ETHUSDT/BNBUSDT - 0.67% (medium)

👋 再见！
```

---

## 🔧 常见问题

### 1. 配置文件错误
```
❌ 缺少必需配置: telegram.botToken, telegram.chatId

请编辑 config.json 并填写以下配置:
  - telegram.botToken
  - telegram.chatId
```
**解决：** 检查 config.json 是否正确填写了 Bot Token 和 Chat ID

### 2. Telegram 通知失败
```
❌ Telegram 通知发送失败: 401 Unauthorized
```
**解决：** Bot Token 错误，重新从 BotFather 获取

### 3. 获取价格失败
```
❌ 获取价格失败: timeout of 10000ms exceeded
```
**解决：** 网络问题，等待一会儿会自动重试

---

## 📝 日志文件

程序会自动保存日志到 `scout.log`：

```bash
# 查看日志
tail -f scout.log

# 查看最近 50 条
tail -50 scout.log
```

---

## 🎯 下一步

1. **调整参数** - 根据实际情况调整 `threshold` 和 `checkInterval`
2. **添加交易对** - 在 `pairs` 中添加更多交易对
3. **分析机会** - 观察哪些机会最频繁、风险最低
4. **手动交易** - 根据通知在交易所手动执行

---

## ⚠️ 重要提醒

- ✅ 这是**监控工具**，不会自动交易
- ✅ 所有机会需要**人工判断**后再操作
- ✅ 价差不等于利润，需要考虑手续费和滑点
- ✅ 建议先观察几天，了解市场规律

---

## 🆘 需要帮助？

如果遇到问题：
1. 检查 config.json 配置是否正确
2. 查看 scout.log 日志文件
3. 确认网络连接正常
4. 确认 Telegram Bot 已启动（发送 /start 给你的 Bot）

祝交易顺利！🦞💰
