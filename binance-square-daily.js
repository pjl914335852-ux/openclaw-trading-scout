#!/usr/bin/env node
/**
 * 币安广场每日自动发帖（新闻 + AI生成版）
 * 抓取最新加密新闻 → AI 结合用户风格生成内容 → 隐私检查 → 发布
 */

const https = require('https');
const path = require('path');
const { safePost } = require('./binance-square-post-safe.js');
const NOFXDataAPI = require('./nofx-api.js');

const botConfig = JSON.parse(require('fs').readFileSync(
  path.join(__dirname, 'config.json'), 'utf8'
));

const AI_CONFIG = {
  baseUrl: botConfig.ai?.baseUrl || 'https://api.openai.com/v1',
  apiKey: botConfig.ai?.apiKey || '',
  model: botConfig.ai?.model || 'gpt-4o-mini'
};

if (!AI_CONFIG.apiKey) {
  console.error('❌ 未配置 AI API Key');
  process.exit(1);
}

// 抓取 NOFX 市场数据
async function fetchMarketData() {
  try {
    const nofx = new NOFXDataAPI();
    const [priceData, lsData] = await Promise.all([
      nofx.getPriceRanking('24h', 5),
      nofx.getLongShortList()
    ]);

    const topGainers = (priceData?.data?.['24h']?.top || []).slice(0, 5)
      .map(c => `${c.symbol} +${(c.price_delta * 100).toFixed(1)}%`).join(', ');
    const lsInfo = (lsData?.data || []).slice(0, 3)
      .map(c => `${c.symbol} 多空比${c.longShortRatio?.toFixed(2) || '?'}`).join(', ');

    return { topGainers, lsInfo, hasData: !!topGainers };
  } catch(e) {
    console.log('⚠️  NOFX 数据获取失败:', e.message);
    return { hasData: false };
  }
}

function callAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: AI_CONFIG.model,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const aiUrl = new URL(AI_CONFIG.baseUrl + '/chat/completions');
    const req = https.request({
      hostname: aiUrl.hostname,
      port: 443,
      path: aiUrl.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.choices?.[0]?.message?.content || '');
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateContent(marketData) {
  const dataSection = marketData.hasData
    ? `今日市场数据：\n${marketData.topGainers ? `涨幅榜：${marketData.topGainers}` : ''}\n${marketData.lsInfo ? `多空情绪：${marketData.lsInfo}` : ''}\n\n`
    : '';

  const prompt = `${dataSection}你是一个有3年真实加密货币投资经验的普通散户，在币安广场分享今日感悟。

写作风格要求：
- 第一人称，像朋友聊天，接地气，不装
- 有自己的判断和观点，敢说"我觉得""我不看好"
- 结合今日市场数据，有时效性
- 150-200字，有具体数字或案例（可匿名化）
- 有一个核心观点，有反思或教训
- 结尾加2-3个话题标签（#xxx格式）
- 不要用"首先其次最后"格式
- 不要提及任何平台名、用户名、真实姓名、链接、联系方式

直接输出内容，不要加任何前缀说明。`;

  return await callAI(prompt);
}

async function main() {
  console.log('📊 抓取 NOFX 市场数据...');
  const marketData = await fetchMarketData();
  if (marketData.hasData) {
    console.log(`✅ 涨幅榜：${marketData.topGainers}`);
    if (marketData.lsInfo) console.log(`✅ 多空情绪：${marketData.lsInfo}`);
  } else {
    console.log('⚠️  市场数据获取失败，使用纯 AI 生成');
  }

  console.log('\n🤖 AI 生成内容中...');
  let content;
  try {
    content = await generateContent(marketData);
    if (!content || content.length < 50) throw new Error('内容太短');
    console.log('✅ 内容生成完成\n');
    console.log(content + '\n');
  } catch(e) {
    console.error('❌ AI 生成失败:', e.message);
    process.exit(1);
  }

  const result = await safePost(content);
  if (result.success) {
    console.log(`✅ 发帖成功！`);
    console.log(`🔗 链接：${result.url}`);
    process.exit(0);
  } else {
    console.error(`❌ 发帖失败：${result.reason} - ${result.error || ''}`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('❌ 执行出错：', e.message);
  process.exit(1);
});
