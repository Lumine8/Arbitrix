/**
 * ═══════════════════════════════════════════════════════════════
 * REWARD ENGINE
 * Calculates rewards based on trade outcomes
 * Reward = profit - entropy_penalty - drift_penalty - overtrading_penalty
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Reward calculation engine
 */
class RewardEngine {
  constructor(config = {}) {
    // Penalty coefficients (λ1, λ2, λ3)
    this.lambda1 = config.drawdownPenalty || 0.5; // Drawdown penalty
    this.lambda2 = config.entropyPenalty || 0.3; // Entropy penalty
    this.lambda3 = config.driftPenalty || 0.2; // Drift penalty
    this.overtradingPenalty = config.overtradingPenalty || 0.1; // Overtrading penalty
    this.directionBonus = config.directionBonus || 10; // Correct direction bonus

    this.rewardHistory = [];
  }

  /**
   * Calculate reward for a completed trade
   * Reward = base_profit - penalties + bonuses
   *
   * @param {Object} tradeOutcome - {
   *   actualPnL: number,
   *   predictedDirection: string,
   *   actualDirection: string,
   *   entropy: number,
   *   rlfsScore: number,
   *   confidence: number,
   *   tradeFrequency: number,
   *   positionHeldDays: number
   * }
   * @returns {Object} {reward, breakdown}
   */
  calculateReward(tradeOutcome) {
    try {
      if (!tradeOutcome) {
        return { reward: 0, breakdown: { error: "Missing trade outcome" } };
      }

      const {
        actualPnL = 0,
        predictedDirection = null,
        actualDirection = null,
        entropy = 0.5,
        rlfsScore = 1.0,
        confidence = 0.5,
        tradeFrequency = 1,
        positionHeldDays = 1,
        maxDrawdown = 0,
      } = tradeOutcome;

      // === BASE PROFIT COMPONENT ===
      // Map P&L to [-100, 100] scale for consistency
      let baseProfitReward = Math.tanh(actualPnL / 100) * 100;
      if (actualPnL === 0) baseProfitReward = 0; // No profit = no reward
      if (actualPnL < 0) baseProfitReward = Math.max(-50, actualPnL); // Cap losses

      // === DIRECTIONAL ACCURACY BONUS ===
      let directionBonus = 0;
      if (predictedDirection && actualDirection) {
        if (predictedDirection === actualDirection) {
          directionBonus = this.directionBonus;
        } else {
          // Wrong direction: penalty
          directionBonus = -this.directionBonus * 0.5;
        }
      }

      // === ENTROPY PENALTY ===
      // High entropy (chaotic market) = lower confidence
      const entropyPenalty = this.lambda2 * entropy * 20; // Scale by entropy
      const adaptedEntropyPenalty =
        entropy > 0.7 ? entropyPenalty : entropyPenalty * 0.5;

      // === DRIFT PENALTY ===
      // Low RLFS score = feature drift = unreliable signals
      const driftPenalty = this.lambda3 * (1 - rlfsScore) * 15; // Scale by drift magnitude

      // === DRAWDOWN PENALTY ===
      // Penalize large drawdowns
      const drawdownPenalty =
        this.lambda1 * Math.pow(Math.max(0, maxDrawdown), 1.5);

      // === OVERTRADING PENALTY ===
      // Too frequent trading without holding = punishment
      const overtradingPenalty =
        tradeFrequency > 2 && positionHeldDays < 1
          ? this.overtradingPenalty * 10 // Heavy penalty for scalping
          : this.overtradingPenalty * (tradeFrequency - 1);

      // === CONFIDENCE CALIBRATION ===
      // If high confidence and correct: bonus
      // If high confidence and wrong: penalty
      let confidenceBonus = 0;
      if (actualPnL > 0 && confidence > 0.7) {
        confidenceBonus = 5; // Good prediction with high confidence
      } else if (actualPnL < 0 && confidence > 0.7) {
        confidenceBonus = -10; // Bad prediction with high confidence (worse)
      }

      // === FINAL REWARD CALCULATION ===
      const totalPenalty =
        adaptedEntropyPenalty +
        driftPenalty +
        drawdownPenalty +
        overtradingPenalty;
      const totalReward =
        baseProfitReward + directionBonus + confidenceBonus - totalPenalty;

      // Clamp reward to [-100, 100]
      const finalReward = Math.max(-100, Math.min(100, totalReward));

      // Record for history
      this.rewardHistory.push({
        timestamp: new Date(),
        reward: finalReward,
        breakdown: {
          baseProfitReward,
          directionBonus,
          entropyPenalty: -adaptedEntropyPenalty,
          driftPenalty: -driftPenalty,
          drawdownPenalty: -drawdownPenalty,
          overtradingPenalty: -overtradingPenalty,
          confidenceBonus,
        },
      });

      // Keep last 1000 rewards
      if (this.rewardHistory.length > 1000) {
        this.rewardHistory.shift();
      }

      return {
        reward: parseFloat(finalReward.toFixed(2)),
        breakdown: {
          baseProfitReward: parseFloat(baseProfitReward.toFixed(2)),
          directionBonus: parseFloat(directionBonus.toFixed(2)),
          entropyPenalty: -parseFloat(adaptedEntropyPenalty.toFixed(2)),
          driftPenalty: -parseFloat(driftPenalty.toFixed(2)),
          drawdownPenalty: -parseFloat(drawdownPenalty.toFixed(2)),
          overtradingPenalty: -parseFloat(overtradingPenalty.toFixed(2)),
          confidenceBonus: parseFloat(confidenceBonus.toFixed(2)),
          totalPenalty: -parseFloat(totalPenalty.toFixed(2)),
          finalReward: parseFloat(finalReward.toFixed(2)),
        },
      };
    } catch (e) {
      console.error("Error calculating reward:", e);
      return { reward: 0, breakdown: { error: e.message } };
    }
  }

  /**
   * Get reward statistics
   * @returns {Object}
   */
  getRewardStats() {
    if (this.rewardHistory.length === 0) {
      return { totalRewards: 0, avgReward: 0, maxReward: 0, minReward: 0 };
    }

    const rewards = this.rewardHistory.map((r) => r.reward);
    const totalRewards = rewards.reduce((sum, r) => sum + r, 0);
    const avgReward = totalRewards / rewards.length;
    const maxReward = Math.max(...rewards);
    const minReward = Math.min(...rewards);

    // Recent performance (last 50)
    const recent = this.rewardHistory.slice(-50).map((r) => r.reward);
    const recentAvg =
      recent.length > 0 ? recent.reduce((a, b) => a + b) / recent.length : 0;

    return {
      count: this.rewardHistory.length,
      totalRewards: parseFloat(totalRewards.toFixed(2)),
      avgReward: parseFloat(avgReward.toFixed(2)),
      recentAvgReward: parseFloat(recentAvg.toFixed(2)),
      maxReward: parseFloat(maxReward.toFixed(2)),
      minReward: parseFloat(minReward.toFixed(2)),
      trend: recentAvg > avgReward ? "improving" : "declining",
    };
  }

  /**
   * Update reward configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    if (config.drawdownPenalty !== undefined)
      this.lambda1 = config.drawdownPenalty;
    if (config.entropyPenalty !== undefined)
      this.lambda2 = config.entropyPenalty;
    if (config.driftPenalty !== undefined) this.lambda3 = config.driftPenalty;
    if (config.overtradingPenalty !== undefined)
      this.overtradingPenalty = config.overtradingPenalty;
    if (config.directionBonus !== undefined)
      this.directionBonus = config.directionBonus;
  }

  /**
   * Reset reward history
   */
  resetHistory() {
    this.rewardHistory = [];
  }
}

module.exports = RewardEngine;
