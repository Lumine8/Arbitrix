const { LearnedParameters, TradeEvaluation, DecisionLog } = require("./models");

// ═════════════════════════════════════════════════════════════════
// SELF-LEARNING ADAPTATION ENGINE
// Learns from past mistakes and adapts parameters
// ═════════════════════════════════════════════════════════════════

class LearningEngine {
  /**
   * Initialize learned parameters for a user
   */
  static async initializeParameters(userId, sessionId) {
    try {
      let params = await LearnedParameters.findOne({ userId }).exec();

      if (!params) {
        params = new LearnedParameters({
          userId,
          sessionId,
          // Default indicator weights (sum = 1.0)
          indicator_weights: {
            EMA_TREND_WEIGHT: {
              value: 0.28,
              iterations: 0,
              performance: 0.5,
            },
            RSI_WEIGHT: {
              value: 0.2,
              iterations: 0,
              performance: 0.5,
            },
            MACD_WEIGHT: {
              value: 0.24,
              iterations: 0,
              performance: 0.5,
            },
            BOLLINGER_WEIGHT: {
              value: 0.16,
              iterations: 0,
              performance: 0.5,
            },
            VOLUME_WEIGHT: {
              value: 0.12,
              iterations: 0,
              performance: 0.5,
            },
          },
          signal_thresholds: {
            BUY_THRESHOLD: 0.1,
            SELL_THRESHOLD: -0.1,
          },
          confidence_scaling: {
            base_multiplier: 1.0,
            entropy_penalty: 0.4,
            drift_penalty: 0.3,
          },
          regime_params: {
            high_entropy_factor: 0.6,
            high_drift_factor: 0.7,
            volatility_multiplier: 1.2,
          },
          learning_iterations: 0,
          regime_statistics: {
            high_entropy: {
              win_rate: 0.5,
              avg_accuracy: 0.5,
              freq_adjustment_factor: 0.8,
            },
            low_entropy: {
              win_rate: 0.5,
              avg_accuracy: 0.5,
              freq_adjustment_factor: 1.0,
            },
            high_drift: {
              win_rate: 0.5,
              avg_accuracy: 0.5,
              freq_adjustment_factor: 0.7,
            },
            stable: {
              win_rate: 0.5,
              avg_accuracy: 0.5,
              freq_adjustment_factor: 1.0,
            },
          },
        });

        await params.save();
        console.log(`✓ Initialized learning parameters for user ${userId}`);
      }

      return params;
    } catch (error) {
      console.error("Error initializing parameters:", error);
      throw error;
    }
  }

  /**
   * Run adaptation cycle based on recent trade evaluations
   * Adjusts weights, thresholds, and confidence scaling
   */
  static async runAdaptationCycle(userId, sessionId, lookbackWindow = 20) {
    try {
      // Get recent evaluations
      const evals = await TradeEvaluation.find({ userId, sessionId })
        .sort({ createdAt: -1 })
        .limit(lookbackWindow)
        .exec();

      if (evals.length === 0) {
        console.log("No evaluations to learn from");
        return null;
      }

      // Analyze performance
      const correctTrades = evals.filter((e) => e.direction_correct);
      const accuracy = correctTrades.length / evals.length;

      // Analyze by regime
      const high_entropy_trades = evals.filter((e) => e.entropy_at_trade > 0.6);
      const low_entropy_trades = evals.filter((e) => e.entropy_at_trade <= 0.6);
      const high_drift_trades = evals.filter(
        (e) => e.feature_drift_at_trade > 0.4,
      );
      const stable_trades = evals.filter(
        (e) => e.feature_drift_at_trade <= 0.4,
      );

      const calculateAccuracy = (trades) => {
        return trades.length > 0
          ? trades.filter((t) => t.direction_correct).length / trades.length
          : 0.5;
      };

      // Get current parameters
      let params = await LearnedParameters.findOne({ userId }).exec();
      if (!params) {
        params = await LearningEngine.initializeParameters(userId, sessionId);
      }

      // Adapt indicator weights based on signal analysis
      const signal_performance = {};
      const signals = ["EMA_TREND", "RSI", "MACD", "BOLLINGER", "VOLUME"];

      for (const signal of signals) {
        const correct = evals.filter(
          (e) =>
            (e.should_increase_weight?.includes(signal) &&
              e.direction_correct) ||
            (!e.direction_correct &&
              !e.should_increase_weight?.includes(signal)),
        ).length;
        signal_performance[signal] = correct / evals.length;
      }

      // Normalize and update weights
      const total_performance = Object.values(signal_performance).reduce(
        (a, b) => a + b,
        0,
      );
      const weight_keys = [
        "EMA_TREND_WEIGHT",
        "RSI_WEIGHT",
        "MACD_WEIGHT",
        "BOLLINGER_WEIGHT",
        "VOLUME_WEIGHT",
      ];

      if (total_performance > 0) {
        weight_keys.forEach((key, idx) => {
          const signal = signals[idx];
          const new_value =
            (signal_performance[signal] / total_performance) * 1.0;
          params.indicator_weights[key].value = +new_value.toFixed(4);
          params.indicator_weights[key].iterations += 1;
          params.indicator_weights[key].performance =
            +signal_performance[signal].toFixed(4);
        });
      }

      // Adapt confidence scaling
      const high_conf_trades = evals.filter((e) => e.confidence_level > 60);
      const high_conf_correct = high_conf_trades.filter(
        (e) => e.direction_correct,
      ).length;
      const conf_calibration =
        high_conf_trades.length > 0
          ? high_conf_correct / high_conf_trades.length
          : 0.5;

      // Reduce entropy penalty if high-entropy trades are accurate
      const entropy_accuracy = calculateAccuracy(high_entropy_trades);
      params.confidence_scaling.entropy_penalty =
        entropy_accuracy > 0.55
          ? params.confidence_scaling.entropy_penalty * 0.95
          : params.confidence_scaling.entropy_penalty * 1.05;
      params.confidence_scaling.entropy_penalty = Math.max(
        0.2,
        Math.min(0.8, params.confidence_scaling.entropy_penalty),
      );

      // Reduce drift penalty if drift trades are accurate
      const drift_accuracy = calculateAccuracy(high_drift_trades);
      params.confidence_scaling.drift_penalty =
        drift_accuracy > 0.55
          ? params.confidence_scaling.drift_penalty * 0.95
          : params.confidence_scaling.drift_penalty * 1.05;
      params.confidence_scaling.drift_penalty = Math.max(
        0.2,
        Math.min(0.8, params.confidence_scaling.drift_penalty),
      );

      // Update regime statistics
      params.regime_statistics.high_entropy = {
        win_rate: calculateAccuracy(high_entropy_trades),
        avg_accuracy: calculateAccuracy(high_entropy_trades),
        freq_adjustment_factor:
          calculateAccuracy(high_entropy_trades) > 0.5 ? 1.0 : 0.7,
      };

      params.regime_statistics.low_entropy = {
        win_rate: calculateAccuracy(low_entropy_trades),
        avg_accuracy: calculateAccuracy(low_entropy_trades),
        freq_adjustment_factor:
          calculateAccuracy(low_entropy_trades) > 0.5 ? 1.0 : 0.8,
      };

      params.regime_statistics.high_drift = {
        win_rate: calculateAccuracy(high_drift_trades),
        avg_accuracy: calculateAccuracy(high_drift_trades),
        freq_adjustment_factor:
          calculateAccuracy(high_drift_trades) > 0.5 ? 1.0 : 0.6,
      };

      params.regime_statistics.stable = {
        win_rate: calculateAccuracy(stable_trades),
        avg_accuracy: calculateAccuracy(stable_trades),
        freq_adjustment_factor:
          calculateAccuracy(stable_trades) > 0.5 ? 1.0 : 0.9,
      };

      // Track performance history
      if (!params.performance_history) params.performance_history = [];
      params.performance_history.push({
        iteration: params.learning_iterations + 1,
        accuracy: +accuracy.toFixed(4),
        win_rate: +((correctTrades.length / evals.length) * 100).toFixed(2),
        avg_confidence_vs_result: +conf_calibration.toFixed(4),
      });
      params.performance_history = params.performance_history.slice(-50); // Keep last 50

      params.learning_iterations += 1;
      params.last_update = new Date();
      params.sessionId = sessionId;

      const updated = await params.save();
      console.log(
        `✓ Adaptation cycle complete. Accuracy: ${(accuracy * 100).toFixed(2)}%`,
      );

      return updated;
    } catch (error) {
      console.error("Error running adaptation cycle:", error);
      throw error;
    }
  }

  /**
   * Get current learned parameters
   */
  static async getParameters(userId) {
    try {
      let params = await LearnedParameters.findOne({ userId }).exec();
      if (!params) {
        params = await LearningEngine.initializeParameters(userId, "default");
      }
      return params;
    } catch (error) {
      console.error("Error getting parameters:", error);
      throw error;
    }
  }

  /**
   * Get learning progress and performance history
   */
  static async getLearningProgress(userId) {
    try {
      const params = await LearnedParameters.findOne({ userId }).exec();
      if (!params) return null;

      return {
        learning_iterations: params.learning_iterations,
        last_update: params.last_update,
        performance_history: params.performance_history || [],
        indicator_weights: params.indicator_weights,
        confidence_scaling: params.confidence_scaling,
        regime_statistics: params.regime_statistics,
      };
    } catch (error) {
      console.error("Error getting learning progress:", error);
      throw error;
    }
  }

  /**
   * Get regime-specific insights
   * Returns which regimes the system performs best in
   */
  static async getRegimeInsights(userId) {
    try {
      const params = await LearnedParameters.findOne({ userId }).exec();
      if (!params) return null;

      const regimes = params.regime_statistics;
      const best_regime = Object.entries(regimes).reduce(
        (best, [name, stats]) =>
          stats.win_rate > best.win_rate ? { name, ...stats } : best,
        { name: "none", win_rate: 0 },
      );

      const worst_regime = Object.entries(regimes).reduce(
        (worst, [name, stats]) =>
          stats.win_rate < worst.win_rate ? { name, ...stats } : worst,
        { name: "none", win_rate: 1 },
      );

      return {
        best_performing_regime: best_regime,
        worst_performing_regime: worst_regime,
        all_regimes: Object.entries(regimes).map(([name, stats]) => ({
          regime: name,
          ...stats,
        })),
      };
    } catch (error) {
      console.error("Error getting regime insights:", error);
      throw error;
    }
  }
}

module.exports = LearningEngine;
