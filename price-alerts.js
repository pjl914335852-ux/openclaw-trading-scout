/**
 * Price Alerts Manager
 * Manages price alerts for cryptocurrency pairs
 */

class PriceAlertsManager {
  constructor(config) {
    this.config = config;
    this.alerts = config.priceAlerts || [];
    this.checkInterval = null;
  }

  /**
   * Add a new price alert
   * @param {Object} alert - Alert configuration
   * @returns {Object} - Added alert with ID
   */
  addAlert(alert) {
    const newAlert = {
      id: Date.now().toString(),
      pair: alert.pair,
      type: alert.type, // 'above', 'below', 'change_up', 'change_down'
      value: alert.value,
      currentPrice: alert.currentPrice || 0,
      createdAt: Date.now(),
      triggered: false,
      enabled: true
    };

    this.alerts.push(newAlert);
    this.saveAlerts();
    return newAlert;
  }

  /**
   * Remove an alert by ID
   * @param {string} alertId - Alert ID
   * @returns {boolean} - Success status
   */
  removeAlert(alertId) {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      this.alerts.splice(index, 1);
      this.saveAlerts();
      return true;
    }
    return false;
  }

  /**
   * Get all active alerts
   * @returns {Array} - List of active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(a => a.enabled && !a.triggered);
  }

  /**
   * Get all alerts (including triggered)
   * @returns {Array} - List of all alerts
   */
  getAllAlerts() {
    return this.alerts;
  }

  /**
   * Check alerts against current prices
   * @param {Object} prices - Current prices { pair: price }
   * @returns {Array} - Triggered alerts
   */
  checkAlerts(prices) {
    const triggered = [];

    for (const alert of this.alerts) {
      if (!alert.enabled || alert.triggered) continue;

      const currentPrice = prices[alert.pair];
      if (!currentPrice) continue;

      let shouldTrigger = false;

      switch (alert.type) {
        case 'above':
          shouldTrigger = currentPrice >= alert.value;
          break;
        case 'below':
          shouldTrigger = currentPrice <= alert.value;
          break;
        case 'change_up':
          if (alert.currentPrice > 0) {
            const change = ((currentPrice - alert.currentPrice) / alert.currentPrice) * 100;
            shouldTrigger = change >= alert.value;
          }
          break;
        case 'change_down':
          if (alert.currentPrice > 0) {
            const change = ((alert.currentPrice - currentPrice) / alert.currentPrice) * 100;
            shouldTrigger = change >= alert.value;
          }
          break;
      }

      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = Date.now();
        alert.triggeredPrice = currentPrice;
        triggered.push(alert);
      }
    }

    if (triggered.length > 0) {
      this.saveAlerts();
    }

    return triggered;
  }

  /**
   * Start monitoring alerts
   * @param {Function} onTrigger - Callback when alert triggers
   * @param {Function} getPrices - Function to get current prices
   * @param {number} interval - Check interval in ms (default: 30000)
   */
  startMonitoring(onTrigger, getPrices, interval = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        const prices = await getPrices();
        const triggered = this.checkAlerts(prices);

        for (const alert of triggered) {
          if (onTrigger) {
            onTrigger(alert);
          }
        }
      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    }, interval);
  }

  /**
   * Stop monitoring alerts
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Save alerts to config
   */
  saveAlerts() {
    this.config.priceAlerts = this.alerts;
    if (this.onConfigChange) {
      this.onConfigChange(this.config);
    }
  }

  /**
   * Format alert for display
   * @param {Object} alert - Alert object
   * @param {string} lang - Language ('zh' or 'en')
   * @returns {string} - Formatted alert text
   */
  formatAlert(alert, lang = 'zh') {
    const typeMap = {
      zh: {
        above: '价格高于',
        below: '价格低于',
        change_up: '涨幅超过',
        change_down: '跌幅超过'
      },
      en: {
        above: 'Price above',
        below: 'Price below',
        change_up: 'Rise over',
        change_down: 'Fall over'
      }
    };

    const type = typeMap[lang][alert.type] || alert.type;
    const value = alert.type.includes('change') ? `${alert.value}%` : `$${alert.value.toLocaleString()}`;
    const status = alert.triggered ? (lang === 'zh' ? '✅ 已触发' : '✅ Triggered') : (lang === 'zh' ? '⏳ 等待中' : '⏳ Waiting');

    let text = `${alert.pair}: ${type} ${value} - ${status}`;

    if (alert.triggered && alert.triggeredPrice) {
      text += lang === 'zh' ? 
        `\n   触发价格: $${alert.triggeredPrice.toLocaleString()}` :
        `\n   Triggered at: $${alert.triggeredPrice.toLocaleString()}`;
    }

    return text;
  }
}

module.exports = PriceAlertsManager;
