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

## ⚙️ 第二步：配置

编辑 `config.json` 文件：

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

**配置说明：**
- `botToken`: 从 BotFather 获取的 Token
- `chatId`: 你的 Telegram 用户 ID
- `pairs`: 要监控的交易对（可以添加更多）
- `threshold`: 价差阈值（0.5 = 0.5%）
- `checkInterval`: 检查间隔（30000 = 30秒）
- `minVolume`: 最小交易量（1000000 = 100万美元）

---

## 🎯 第三步：运行

```bash
# 进入项目目录
cd /root/.openclaw/workspace/crypto-trading-scout

# 运行监控程序
node crypto-scout.js
```

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
