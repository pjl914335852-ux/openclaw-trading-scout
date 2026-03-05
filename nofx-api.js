// NOFX Data API Integration
// NOFX 数据 API 集成

const axios = require('axios');

class NOFXDataAPI {
  constructor(apiKey) {
    this.baseURL = 'https://nofxos.ai';
    this.apiKey = apiKey || 'cm_568c67eae410d912c54c';
    this.rateLimit = 30; // requests per second
    this.requestCount = 0;
    this.requestResetTime = Date.now();
  }
  
  // Rate limiting
  async checkRateLimit() {
    const now = Date.now();
    if (now - this.requestResetTime >= 1000) {
      this.requestCount = 0;
      this.requestResetTime = now;
    }
    
    if (this.requestCount >= this.rateLimit) {
      const waitTime = 1000 - (now - this.requestResetTime);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.requestResetTime = Date.now();
      }
    }
    
    this.requestCount++;
  }
  
  // Make API request
  async request(endpoint, params = {}) {
    await this.checkRateLimit();
    
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await axios.get(url, {
        params: { ...params, auth: this.apiKey },
        timeout: 10000
      });
      
      // Extract data from response
      if (response.data && response.data.success && response.data.data) {
        // Handle different response formats
        if (response.data.data.coins) {
          return response.data.data.coins;
        } else if (response.data.data.list) {
          return response.data.data.list;
        } else if (Array.isArray(response.data.data)) {
          return response.data.data;
        } else {
          return response.data.data;
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`NOFX API Error (${endpoint}):`, error.message);
      return null;
    }
  }
  
  // ==================== Coin Data ====================
  
  async getCoinData(symbol) {
    return await this.request(`/api/coin/${symbol}`);
  }
  
  // ==================== AI500 Index ====================
  
  async getAI500List() {
    return await this.request('/api/ai500/list');
  }
  
  async getAI500Details(symbol) {
    return await this.request(`/api/ai500/${symbol}`);
  }
  
  async getAI500Stats() {
    return await this.request('/api/ai500/stats');
  }
  
  // ==================== Market Data ====================
  
  async getPriceRanking(duration = '1h', limit = 20) {
    return await this.request('/api/price/ranking', { duration, limit });
  }
  
  // ==================== Open Interest ====================
  
  async getOITopRanking(duration = '1h', limit = 20) {
    return await this.request('/api/oi/top-ranking', { duration, limit });
  }
  
  async getOILowRanking(duration = '1h', limit = 20) {
    return await this.request('/api/oi/low-ranking', { duration, limit });
  }
  
  // ==================== Fund Flow ====================
  
  async getNetflowTopRanking(duration = '1h', limit = 20) {
    return await this.request('/api/netflow/top-ranking', { duration, limit });
  }
  
  async getNetflowLowRanking(duration = '1h', limit = 20) {
    return await this.request('/api/netflow/low-ranking', { duration, limit });
  }
  
  // ==================== AI300 Quantitative Model ====================
  
  async getAI300List() {
    return await this.request('/api/ai300/list');
  }
  
  async getAI300Stats() {
    return await this.request('/api/ai300/stats');
  }
  
  // ==================== Long-Short Ratio ====================
  
  async getLongShortList() {
    return await this.request('/api/long-short/list');
  }
  
  async getLongShortData(symbol) {
    return await this.request(`/api/long-short/${symbol}`);
  }
  
  // ==================== Funding Rate ====================
  
  async getFundingRateTop(limit = 20) {
    return await this.request('/api/funding-rate/top', { limit });
  }
  
  async getFundingRateLow(limit = 20) {
    return await this.request('/api/funding-rate/low', { limit });
  }
  
  async getFundingRate(symbol) {
    return await this.request(`/api/funding-rate/${symbol}`);
  }
  
  // ==================== OI Market Cap Ranking ====================
  
  async getOICapRanking(limit = 20) {
    return await this.request('/api/oi-cap/ranking', { limit });
  }
  
  // ==================== Order Book Heatmap ====================
  
  async getHeatmapFuture(symbol) {
    return await this.request(`/api/heatmap/future/${symbol}`);
  }
  
  async getHeatmapSpot(symbol) {
    return await this.request(`/api/heatmap/spot/${symbol}`);
  }
  
  async getHeatmapList(limit = 20) {
    return await this.request('/api/heatmap/list', { limit });
  }
  
  // ==================== Query Ranking ====================
  
  async getQueryRankList(limit = 20) {
    return await this.request('/api/query-rank/list', { limit });
  }
  
  // ==================== Enhanced Analysis ====================
  
  // Get comprehensive analysis for a symbol
  async getComprehensiveAnalysis(symbol) {
    const [coinData, ai500, longShort, fundingRate, heatmapFuture, heatmapSpot] = await Promise.all([
      this.getCoinData(symbol),
      this.getAI500Details(symbol),
      this.getLongShortData(symbol),
      this.getFundingRate(symbol),
      this.getHeatmapFuture(symbol),
      this.getHeatmapSpot(symbol)
    ]);
    
    return {
      coin: coinData,
      ai500: ai500,
      longShort: longShort,
      fundingRate: fundingRate,
      heatmap: {
        future: heatmapFuture,
        spot: heatmapSpot
      }
    };
  }
  
  // Get market overview
  async getMarketOverview() {
    const [ai500List, oiTop, netflowTop, ai300List, queryRank] = await Promise.all([
      this.getAI500List(),
      this.getOITopRanking('1h', 10),
      this.getNetflowTopRanking('1h', 10),
      this.getAI300List(),
      this.getQueryRankList(10)
    ]);
    
    return {
      ai500: ai500List,
      oiTop: oiTop,
      netflowTop: netflowTop,
      ai300: ai300List,
      trending: queryRank
    };
  }
  
  // Get enhanced pair data for arbitrage detection
  async getEnhancedPairData(symbol) {
    const coinData = await this.getCoinData(symbol);
    
    if (!coinData) return null;
    
    // Extract key metrics
    const metrics = {
      symbol: symbol,
      
      // Price changes
      priceChange1h: coinData.price_change?.['1h'] || 0,
      priceChange4h: coinData.price_change?.['4h'] || 0,
      priceChange24h: coinData.price_change?.['24h'] || 0,
      
      // Fund flow
      institutionFlow1h: coinData.netflow?.institution?.['1h'] || 0,
      personalFlow1h: coinData.netflow?.personal?.['1h'] || 0,
      totalFlow1h: (coinData.netflow?.institution?.['1h'] || 0) + (coinData.netflow?.personal?.['1h'] || 0),
      
      // Open Interest
      oiBinance: coinData.oi?.binance?.oi || 0,
      oiBinanceDelta: coinData.oi?.binance?.oi_delta_percent || 0,
      oiBybit: coinData.oi?.bybit?.oi || 0,
      oiBybitDelta: coinData.oi?.bybit?.oi_delta_percent || 0,
      
      // AI Score
      ai500Score: coinData.ai500?.score || 0,
      ai500Active: coinData.ai500?.is_active || false,
      
      // Derived metrics
      flowStrength: Math.abs((coinData.netflow?.institution?.['1h'] || 0) + (coinData.netflow?.personal?.['1h'] || 0)),
      oiStrength: Math.abs((coinData.oi?.binance?.oi_delta_percent || 0) + (coinData.oi?.bybit?.oi_delta_percent || 0)) / 2,
      
      // Signal quality
      signalQuality: this.calculateSignalQuality(coinData)
    };
    
    return metrics;
  }
  
  // Calculate signal quality score (0-100)
  calculateSignalQuality(coinData) {
    let score = 0;
    
    // AI500 score (0-40 points)
    const ai500Score = coinData.ai500?.score || 0;
    score += (ai500Score / 100) * 40;
    
    // Fund flow strength (0-30 points)
    const totalFlow = Math.abs((coinData.netflow?.institution?.['1h'] || 0) + (coinData.netflow?.personal?.['1h'] || 0));
    const flowScore = Math.min(totalFlow / 1000000, 1); // Normalize to 1M USDT
    score += flowScore * 30;
    
    // OI change strength (0-30 points)
    const oiDelta = Math.abs((coinData.oi?.binance?.oi_delta_percent || 0) + (coinData.oi?.bybit?.oi_delta_percent || 0)) / 2;
    const oiScore = Math.min(oiDelta / 10, 1); // Normalize to 10%
    score += oiScore * 30;
    
    return Math.round(score);
  }
  
  // Check if a pair has strong signals
  hasStrongSignals(metrics) {
    if (!metrics) return false;
    
    // Strong signal criteria
    const strongAI = metrics.ai500Score > 70;
    const strongFlow = Math.abs(metrics.totalFlow1h) > 500000; // > 500K USDT
    const strongOI = metrics.oiStrength > 5; // > 5% OI change
    const highQuality = metrics.signalQuality > 60;
    
    // At least 2 strong signals
    const signalCount = [strongAI, strongFlow, strongOI, highQuality].filter(Boolean).length;
    
    return signalCount >= 2;
  }
}

module.exports = NOFXDataAPI;
