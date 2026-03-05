// Test NOFX API
const NOFXDataAPI = require('./nofx-api');

async function test() {
  const nofx = new NOFXDataAPI();
  
  console.log('🦞 Testing NOFX API...\n');
  
  // Test 1: Get AI500 list
  console.log('1. Testing AI500 List...');
  const ai500 = await nofx.getAI500List();
  if (ai500) {
    console.log(`✅ Found ${ai500.length || 0} high-potential coins`);
    if (ai500.length > 0) {
      console.log(`   Example: ${ai500[0].pair || ai500[0].symbol} (Score: ${ai500[0].score})`);
    }
  } else {
    console.log('❌ Failed to fetch AI500 list');
  }
  
  // Test 2: Get OI top ranking
  console.log('\n2. Testing OI Top Ranking...');
  const oiTop = await nofx.getOITopRanking('1h', 5);
  if (oiTop) {
    console.log(`✅ Found ${oiTop.length || 0} coins with high OI growth`);
    if (oiTop.length > 0) {
      console.log(`   Example: ${oiTop[0].symbol} (OI Delta: ${oiTop[0].oi_delta_percent}%)`);
    }
  } else {
    console.log('❌ Failed to fetch OI ranking');
  }
  
  // Test 3: Get coin data for BTCUSDT
  console.log('\n3. Testing Coin Data (BTCUSDT)...');
  const btcData = await nofx.getCoinData('BTCUSDT');
  if (btcData) {
    console.log('✅ BTC data retrieved');
    console.log(`   Price change 1h: ${(btcData.price_change?.['1h'] || 0) * 100}%`);
    console.log(`   AI500 score: ${btcData.ai500?.score || 0}`);
    console.log(`   Institution flow 1h: $${(btcData.netflow?.institution?.['1h'] || 0).toLocaleString()}`);
  } else {
    console.log('❌ Failed to fetch BTC data');
  }
  
  // Test 4: Get enhanced pair data
  console.log('\n4. Testing Enhanced Pair Data (ETHUSDT)...');
  const ethMetrics = await nofx.getEnhancedPairData('ETHUSDT');
  if (ethMetrics) {
    console.log('✅ ETH metrics calculated');
    console.log(`   Signal quality: ${ethMetrics.signalQuality}/100`);
    console.log(`   Flow strength: $${ethMetrics.flowStrength.toLocaleString()}`);
    console.log(`   OI strength: ${ethMetrics.oiStrength.toFixed(2)}%`);
    console.log(`   Has strong signals: ${nofx.hasStrongSignals(ethMetrics) ? 'YES' : 'NO'}`);
  } else {
    console.log('❌ Failed to calculate ETH metrics');
  }
  
  // Test 5: Get market overview
  console.log('\n5. Testing Market Overview...');
  const overview = await nofx.getMarketOverview();
  if (overview) {
    console.log('✅ Market overview retrieved');
    console.log(`   AI500 coins: ${overview.ai500?.length || 0}`);
    console.log(`   OI top movers: ${overview.oiTop?.length || 0}`);
    console.log(`   Netflow leaders: ${overview.netflowTop?.length || 0}`);
    console.log(`   Trending: ${overview.trending?.length || 0}`);
  } else {
    console.log('❌ Failed to fetch market overview');
  }
  
  console.log('\n✅ NOFX API test complete!');
}

test().catch(console.error);
