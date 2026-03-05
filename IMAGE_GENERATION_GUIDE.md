# 漫画图片生成指南

## 使用 AI 画图工具生成

推荐工具：
- Midjourney (最佳质量)
- DALL-E 3 (ChatGPT Plus)
- Stable Diffusion (免费)

---

## 图片1：起点 - 混乱的市场

**提示词**：
```
A cute cartoon lobster character holding a golden BNB coin, looking confused at multiple floating trading charts and price numbers around him. The lobster has big expressive eyes. Background shows a chaotic crypto trading environment with red and green candles. Comic book style, vibrant colors, clean lines, 16:9 aspect ratio.
```

**中文版**：
```
可爱的卡通龙虾角色，手持金色 BNB 硬币，困惑地看着周围漂浮的交易图表和价格数字。龙虾有大大的表情丰富的眼睛。背景是混乱的加密货币交易环境，红绿蜡烛图。漫画书风格，鲜艳色彩，线条清晰，16:9 比例。
```

**保存为**: `images/01-chaos.png`

---

## 图片2：困境 - 累死累活

**提示词**：
```
The same cartoon lobster character sitting exhausted in front of multiple computer monitors showing trading charts, with coffee cups and energy drink cans scattered around. The lobster looks tired with bags under eyes, trying to manually track prices. Dark circles, stressed expression. Comic style, dramatic lighting showing late night trading, 16:9 aspect ratio.
```

**中文版**：
```
同一只卡通龙虾角色，疲惫地坐在多个显示交易图表的电脑显示器前，周围散落着咖啡杯和能量饮料罐。龙虾看起来很累，眼睛下有眼袋，试图手动追踪价格。黑眼圈，压力表情。漫画风格，戏剧性灯光展示深夜交易，16:9 比例。
```

**保存为**: `images/02-exhausted.png`

---

## 图片3：转机 - OpenClaw 登场

**提示词**：
```
The lobster character having a lightbulb moment, excitedly typing on a laptop with OpenClaw logo visible on screen. Behind him, a glowing AI robot assistant (shaped like a mechanical claw) is emerging from the computer. Bright, hopeful lighting. Comic book style with action lines showing excitement and energy, 16:9 aspect ratio.
```

**中文版**：
```
龙虾角色灵光一现，兴奋地在笔记本电脑上打字，屏幕上可见 OpenClaw 标志。在他身后，一个发光的 AI 机器人助手（形状像机械爪）正从电脑中浮现。明亮、充满希望的灯光。漫画书风格，带有动作线条展示兴奋和能量，16:9 比例。
```

**保存为**: `images/03-breakthrough.png`

---

## 图片4：成功 - 躺赚时代

**提示词**：
```
The lobster character relaxing on a beach chair under palm trees, wearing sunglasses, holding a tropical drink, while his phone shows trading notifications with profit symbols (💰). In the background, a small robot claw is working on a laptop. Peaceful, successful vibe. Sunset colors, comic book style, 16:9 aspect ratio.
```

**中文版**：
```
龙虾角色在棕榈树下的沙滩椅上放松，戴着墨镜，拿着热带饮料，手机显示带有利润符号（💰）的交易通知。在背景中，一个小机器人爪正在笔记本电脑上工作。平和、成功的氛围。日落色彩，漫画书风格，16:9 比例。
```

**保存为**: `images/04-success.png`

---

## 图片5：封面海报

**提示词**：
```
Epic movie poster style: Giant cartoon lobster character in the center wearing a detective/scout outfit with binoculars, standing heroically. Behind him, a massive golden BNB coin shines like the sun. Foreground shows trading charts and price tickers. Background has a futuristic city skyline. Bold title space at top reading "OpenClaw Trading Scout". Cinematic lighting, vibrant colors, professional comic book art style, vertical poster format 2:3 aspect ratio.
```

**中文版**：
```
史诗电影海报风格：巨大的卡通龙虾角色在中心，穿着侦探/侦察兵服装，拿着望远镜，英勇地站立。在他身后，一枚巨大的金色 BNB 硬币像太阳一样闪耀。前景显示交易图表和价格行情。背景是未来主义城市天际线。顶部有醒目的标题空间，写着"OpenClaw Trading Scout"。电影般的灯光，鲜艳的色彩，专业漫画艺术风格，垂直海报格式 2:3 比例。
```

**保存为**: `images/00-poster.png`

---

## 图片6：产品截图（实际运行）

直接截取终端运行效果：

```bash
cd binance-trading-scout
npm test
# 截图保存为 images/05-demo-output.png
```

---

## 图片7：架构图

使用 ASCII 艺术或简单的流程图工具：

```
┌─────────────────┐
│  Binance API    │  ← 获取实时价格
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Trading Scout  │  ← OpenClaw Agent
│  (Node.js)      │     - 价格分析
└────────┬────────┘     - 套利计算
         │
         ▼
┌─────────────────┐
│  Telegram Bot   │  ← 推送通知
└─────────────────┘
```

**保存为**: `images/06-architecture.png`

---

## 图片8：Telegram 推送示例

模拟 Telegram 消息界面：

```
🚨 套利机会发现！

交易对: BNBUSDT / ETHUSDT
价差: 0.62%
BNBUSDT 变化: 0.38%
ETHUSDT 变化: -0.38%

💡 建议: 买入 ETHUSDT, 卖出 BNBUSDT

⏰ 时间: 2026-03-05 04:27:26
```

**保存为**: `images/07-telegram-notification.png`

---

## 生成步骤

1. 打开 Midjourney / DALL-E / Stable Diffusion
2. 复制对应的提示词
3. 生成图片
4. 下载并保存到 `images/` 目录
5. 确保文件名正确

---

## 注意事项

- 保持风格一致（都用漫画风格）
- 龙虾角色在所有图片中保持相似
- 颜色鲜艳，线条清晰
- 16:9 比例适合横向展示
- 海报用 2:3 垂直比例

---

## 快速生成命令（Midjourney）

```
/imagine A cute cartoon lobster character holding a golden BNB coin, looking confused at multiple floating trading charts and price numbers around him. The lobster has big expressive eyes. Background shows a chaotic crypto trading environment with red and green candles. Comic book style, vibrant colors, clean lines --ar 16:9
```

依次生成所有图片即可。
