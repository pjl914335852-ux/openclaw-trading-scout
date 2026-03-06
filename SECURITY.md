# 🔒 Security & Sensitive Information / 安全与敏感信息

**IMPORTANT: Never commit sensitive information to Git!**

**重要：永远不要将敏感信息提交到 Git！**

---

## 🚨 What is Sensitive Information? / 什么是敏感信息？

### ❌ Never Commit These / 永远不要提交这些：

1. **Telegram Bot Token** / Telegram Bot 令牌
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
   ```

2. **Telegram Chat ID** / Telegram 聊天 ID
   ```
   123456789
   ```

3. **Binance API Key** / 币安 API 密钥
   ```
   your_binance_api_key_here_64_characters_long_example_key_1234567890
   ```

4. **Binance API Secret** / 币安 API 密钥
   ```
   your_binance_api_secret_here_64_characters_long_example_secret_0987654321
   ```

5. **Any passwords, private keys, or credentials** / 任何密码、私钥或凭证

---

## ✅ How We Protect Your Information / 我们如何保护你的信息

### 1. `.gitignore` File / `.gitignore` 文件

The repository includes a `.gitignore` file that prevents sensitive files from being committed:

仓库包含 `.gitignore` 文件，防止敏感文件被提交：

```
# Sensitive configuration
config.json
.env

# API keys and secrets
*.key
*.pem
*.secret

# Logs (may contain sensitive data)
*.log
logs/
```

### 2. Example Configuration / 示例配置

We provide `config.example.json` with **empty values**:

我们提供 `config.example.json`，其中的值为**空**：

```json
{
  "telegram": {
    "botToken": "",
    "chatId": ""
  },
  "cryptoex": {
    "apiKey": "",
    "apiSecret": ""
  }
}
```

### 3. Your Actual Configuration / 你的实际配置

Your `config.json` with real values is **NOT tracked by Git**:

你的 `config.json` 包含真实值，**不会被 Git 追踪**：

```bash
# This file is ignored by Git
config.json
```

---

## 🔍 How to Verify / 如何验证

### Check if config.json is tracked / 检查 config.json 是否被追踪：

```bash
cd /root/.openclaw/workspace/crypto-trading-scout
git status
```

**Good output / 正确的输出：**
```
On branch master
nothing to commit, working tree clean
```

**Bad output / 错误的输出：**
```
Changes to be committed:
  modified:   config.json  ← ❌ This should NOT appear!
```

### Check .gitignore / 检查 .gitignore：

```bash
cat .gitignore | grep config.json
```

**Should output / 应该输出：**
```
config.json
```

---

## 🛡️ What to Do if You Accidentally Committed Secrets / 如果不小心提交了密钥怎么办

### 1. **IMMEDIATELY Revoke the Keys** / **立即撤销密钥**

**Telegram Bot:**
1. Go to @BotFather
2. Send `/revoke`
3. Select your bot
4. Create a new bot token

**Binance API:**
1. Log in to Binance
2. Go to API Management
3. Delete the compromised API key
4. Create a new one

### 2. Remove from Git History / 从 Git 历史中删除

```bash
# Remove file from Git (but keep local copy)
git rm --cached config.json

# Commit the removal
git commit -m "Remove sensitive config.json"

# Force push to overwrite history
git push origin master --force
```

### 3. Clean Git History (Advanced) / 清理 Git 历史（高级）

If the secret was committed multiple times:

如果密钥被多次提交：

```bash
# Use git-filter-repo (recommended)
git filter-repo --path config.json --invert-paths

# Or use BFG Repo-Cleaner
bfg --delete-files config.json

# Force push
git push origin master --force
```

---

## 📋 Best Practices / 最佳实践

### 1. Use Environment Variables / 使用环境变量

Instead of `config.json`, use `.env`:

不使用 `config.json`，改用 `.env`：

```bash
# .env (also in .gitignore)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_CHAT_ID=123456789
BINANCE_API_KEY=your_binance_api_key_here_64_characters_long_example_key_1234567890
BINANCE_API_SECRET=your_binance_api_secret_here_64_characters_long_example_secret_0987654321
```

Load in code:

在代码中加载：

```javascript
require('dotenv').config();

const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  },
  cryptoex: {
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET
  }
};
```

### 2. Use Secrets Management / 使用密钥管理

For production:

生产环境：

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Secret Manager**

### 3. Limit API Key Permissions / 限制 API 密钥权限

**Binance API Key Settings:**

- ✅ **Enable Reading** ← Only this!
- ❌ **Enable Spot & Margin Trading** ← Keep OFF
- ❌ **Enable Futures** ← Keep OFF
- ❌ **Enable Withdrawals** ← NEVER enable!
- ✅ **Restrict access to trusted IPs** ← Recommended

### 4. Rotate Keys Regularly / 定期轮换密钥

- Change API keys every 3-6 months
- 每 3-6 个月更换一次 API 密钥

- Use different keys for different environments
- 不同环境使用不同的密钥

### 5. Monitor for Leaks / 监控泄露

Use tools like:

使用工具如：

- **GitHub Secret Scanning**
- **GitGuardian**
- **TruffleHog**
- **git-secrets**

---

## ✅ Current Status / 当前状态

**Your Trading Scout configuration is SAFE:**

**你的交易侦察员配置是安全的：**

- ✅ `config.json` is in `.gitignore`
- ✅ `config.json` is NOT tracked by Git
- ✅ Only `config.example.json` (with empty values) is in the repository
- ✅ Your actual API keys are only on your local server

**Repository contains:**

**仓库包含：**

- ✅ Source code (crypto-scout.js)
- ✅ Documentation (README.md, etc.)
- ✅ Example configuration (config.example.json) ← Empty values
- ❌ Your actual configuration (config.json) ← NOT in repo

---

## 🎯 Summary / 总结

**Remember:**

**记住：**

1. ❌ **Never commit `config.json`** / 永远不要提交 `config.json`
2. ✅ **Always use `config.example.json` for examples** / 总是使用 `config.example.json` 作为示例
3. ✅ **Keep `.gitignore` up to date** / 保持 `.gitignore` 最新
4. ✅ **Revoke keys immediately if leaked** / 如果泄露立即撤销密钥
5. ✅ **Use read-only API keys** / 使用只读 API 密钥

**Your secrets are safe as long as you follow these practices!**

**只要遵循这些做法，你的密钥就是安全的！**

---

## 📞 Need Help? / 需要帮助？

If you think your keys were leaked:

如果你认为密钥泄露了：

1. **Revoke them immediately** / 立即撤销
2. **Check Git history** / 检查 Git 历史
3. **Contact support** / 联系支持

Telegram: @Ee_7t
