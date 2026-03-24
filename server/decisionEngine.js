const {
  DecisionLog,
  TradeEvaluation,
  PaperTrade,
  LearnedParameters,
} = require("./models");

// ═════════════════════════════════════════════════════════════════
// DECISION LOGGING SERVICE
// Logs every trade decision with complete context
// ═════════════════════════════════════════════════════════════════

class DecisionLogger {
  /**
   * Log a trade decision with full context
   * @param {Object} params - Decision parameters
   */
  static async logDecision(params) {
    try {
      const {
        userId,
        sessionId,
        stock,
        stockName,
        features,
        piec,
        rlfs,
        sadr,
        decision,
        confidence,
        composite_score,
        signal_components,
        reasoning,
        market_context,
        regime_interpretation,
        predicted_direction,
        predicted_strength,
        predicted_price_10d,
        predicted_price_targets,
        executed,
        execution_type,
        execution_price,
        execution_qty,
      } = params;

      const decisionLog = new DecisionLog({
        userId,
        sessionId,
        timestamp: new Date(),
        stock,
        stockName,
        features,
        piec,
        rlfs,
        sadr,
        decision,
        confidence,
        composite_score,
        signal_components,
        reasoning,
        market_context,
        regime_interpretation,
        predicted_direction,
        predicted_strength,
        predicted_price_10d,
        predicted_price_targets,
        executed: !!executed,
        execution_type: execution_type || "UNKNOWN",
        execution_price,
        execution_qty,
      });

      const saved = await decisionLog.save();
      console.log(`✓ Decision logged for ${stock}: ${decision}`);
      return saved;
    } catch (error) {
      console.error("Error logging decision:", error);
      throw error;
    }
  }

  /**
   * Get decision history for analysis
   */
  static async getDecisionHistory(userId, sessionId, limit = 100) {
    return await DecisionLog.find({ userId, sessionId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get recent decisions for a specific stock
   */
  static async getStockDecisions(userId, stock, limit = 20) {
    return await DecisionLog.find({ userId, stock })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
}

// ═════════════════════════════════════════════════════════════════
// TRADE EVALUATION SERVICE
// Evaluates prediction accuracy after trades
// ═════════════════════════════════════════════════════════════════

class TradeEvaluator {
  /**
   * Evaluate a completed trade
   */
  static async evaluateTrade(params) {
    try {
      const {
        userId,
        sessionId,
        decisionLogId,
        stock,
        decision,
        decision_time,
        decision_price,
        executed,
        execution_price,
        execution_qty,
        execution_time,
        evaluation_time,
        actual_price_at_eval,
        predicted_direction,
        predicted_price,
        predicted_strength,
        confidence_level,
        entropy_at_trade,
        feature_drift_at_trade,
      } = params;

      // Calculate accuracy metrics
      const price_change_pct =
        ((actual_price_at_eval - decision_price) / decision_price) * 100;
      const actual_direction =
        actual_price_at_eval > decision_price ? "UP" : "DOWN";
      const direction_correct = predicted_direction === actual_direction;

      const price_error = Math.abs(actual_price_at_eval - predicted_price);
      const price_error_pct = (price_error / predicted_price) * 100;

      // Expected profit vs actual
      const expected_profit =
        (predicted_price - decision_price) * execution_qty;
      const actual_profit =
        (actual_price_at_eval - decision_price) * execution_qty;
      const profit_deviation = expected_profit - actual_profit;

      // Confidence vs result assessment
      let confidence_vs_result = "NEUTRAL";
      if (direction_correct && confidence_level > 60)
        confidence_vs_result = "HIGH_CORRECT";
      if (direction_correct && confidence_level <= 60)
        confidence_vs_result = "LOW_CORRECT";
      if (!direction_correct && confidence_level > 60)
        confidence_vs_result = "HIGH_WRONG";
      if (!direction_correct && confidence_level <= 60)
        confidence_vs_result = "LOW_WRONG";

      // Determine which signals should have higher/lower weight
      const should_increase_weight = direction_correct
        ? ["EMA_TREND", "RSI", "MACD", "BOLLINGER"] // Arbitrarily selected for demo
        : [];
      const should_decrease_weight = !direction_correct
        ? ["EMA_TREND", "RSI", "MACD", "BOLLINGER"]
        : [];

      const evaluation = new TradeEvaluation({
        userId,
        sessionId,
        decisionLogId,
        stock,
        decision,
        decision_time,
        decision_price,
        executed,
        execution_price,
        execution_qty,
        execution_time,
        evaluation_time,
        actual_price_at_eval,
        price_change_pct,
        predicted_direction,
        actual_direction,
        direction_correct,
        predicted_price,
        actual_price: actual_price_at_eval,
        price_error,
        price_error_pct,
        predicted_strength,
        expected_profit,
        actual_profit,
        profit_deviation,
        confidence_level,
        confidence_vs_result,
        feature_drift_at_trade,
        entropy_at_trade,
        should_increase_weight,
        should_decrease_weight,
      });

      const saved = await evaluation.save();
      console.log(
        `✓ Trade evaluated for ${stock}: direction=${direction_correct ? "CORRECT" : "WRONG"}`,
      );
      return saved;
    } catch (error) {
      console.error("Error evaluating trade:", error);
      throw error;
    }
  }

  /**
   * Get accuracy statistics for a user
   */
  static async getAccuracyStats(userId, sessionId) {
    const evals = await TradeEvaluation.find({ userId, sessionId }).exec();

    if (evals.length === 0) {
      return {
        total_evaluations: 0,
        directional_accuracy: 0,
        magnitude_accuracy: 0,
        confidence_calibration: 0,
      };
    }

    const directional_correct = evals.filter((e) => e.direction_correct).length;
    const directional_accuracy = (directional_correct / evals.length) * 100;

    const avg_price_error =
      evals.reduce((sum, e) => sum + (e.price_error_pct || 0), 0) /
      evals.length;
    const magnitude_accuracy = Math.max(0, 100 - avg_price_error);

    // Confidence calibration: how well does confidence match correctness?
    const high_conf_trades = evals.filter((e) => e.confidence_level > 60);
    const high_conf_accuracy =
      high_conf_trades.length > 0
        ? (high_conf_trades.filter((e) => e.direction_correct).length /
            high_conf_trades.length) *
          100
        : 50;
    const confidence_calibration = high_conf_accuracy;

    return {
      total_evaluations: evals.length,
      directional_accuracy: +directional_accuracy.toFixed(2),
      magnitude_accuracy: +magnitude_accuracy.toFixed(2),
      confidence_calibration: +confidence_calibration.toFixed(2),
      avg_price_error_pct: +avg_price_error.toFixed(2),
      regime_stats: {
        high_entropy: evals.filter((e) => e.entropy_at_trade > 0.6).length,
        low_entropy: evals.filter((e) => e.entropy_at_trade <= 0.6).length,
        high_drift: evals.filter((e) => e.feature_drift_at_trade > 0.4).length,
      },
    };
  }
}

// ═════════════════════════════════════════════════════════════════
// PAPER TRADING ENGINE
// Simulates trades with realistic slippage and costs
// ═════════════════════════════════════════════════════════════════

class PaperTradingEngine {
  /**
   * Execute a simulated trade
   */
  static async executeTrade(params) {
    try {
      const {
        userId,
        sessionId,
        type,
        stock,
        qty,
        price,
        decisionLogId,
        decision_confidence,
        decision_tier,
        execution_mode,
      } = params;

      // Simulate slippage (0.1% - 0.3% depending on market conditions)
      const slippage_pct = (Math.random() * 0.2 + 0.1) / 100;
      const slippage_amount = price * qty * slippage_pct;

      // Transaction costs (0.05% fixed)
      const transaction_cost = price * qty * 0.0005;

      const entry_total = price * qty;
      const actual_price =
        type === "BUY"
          ? price * (1 + slippage_pct)
          : price * (1 - slippage_pct);

      const trade = new PaperTrade({
        userId,
        sessionId,
        tradeId: `${userId}-${sessionId}-${Date.now()}`,
        type,
        stock,
        qty,
        entry_price: actual_price,
        entry_time: new Date(),
        slippage_pct,
        slippage_amount,
        transaction_cost,
        entry_total,
        decisionLogId,
        decision_confidence,
        decision_tier,
        execution_mode,
        status: "OPEN",
      });

      const saved = await trade.save();
      console.log(
        `✓ ${type} trade executed: ${qty}×${stock} @ ${actual_price.toFixed(2)}`,
      );
      return saved;
    } catch (error) {
      console.error("Error executing trade:", error);
      throw error;
    }
  }

  /**
   * Close a trade and calculate P&L
   */
  static async closeTrade(tradeId, exit_price) {
    try {
      const trade = await PaperTrade.findOne({ tradeId }).exec();
      if (!trade) throw new Error("Trade not found");

      // Apply slippage on exit
      const slippage_pct = (Math.random() * 0.2 + 0.1) / 100;
      const actual_exit_price =
        trade.type === "SELL"
          ? exit_price * (1 + slippage_pct)
          : exit_price * (1 - slippage_pct);

      const exit_total = actual_exit_price * trade.qty;
      const gross_pnl = exit_total - trade.entry_total;
      const net_pnl = gross_pnl - trade.transaction_cost;
      const pnl_pct = (net_pnl / trade.entry_total) * 100;

      trade.exit_price = actual_exit_price;
      trade.exit_time = new Date();
      trade.exit_total = exit_total;
      trade.gross_pnl = gross_pnl;
      trade.net_pnl = net_pnl;
      trade.pnl_pct = pnl_pct;
      trade.status = "CLOSED";

      const updated = await trade.save();
      console.log(
        `✓ Trade closed: P&L = ${net_pnl.toFixed(2)} (${pnl_pct.toFixed(2)}%)`,
      );
      return updated;
    } catch (error) {
      console.error("Error closing trade:", error);
      throw error;
    }
  }

  /**
   * Get trade history
   */
  static async getTradeHistory(userId, sessionId, limit = 50) {
    return await PaperTrade.find({ userId, sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Calculate portfolio P&L
   */
  static async calculatePortfolioMetrics(userId, sessionId) {
    const trades = await PaperTrade.find({
      userId,
      sessionId,
      status: "CLOSED",
    }).exec();

    if (trades.length === 0) {
      return {
        total_pnl: 0,
        realized_pnl: 0,
        win_rate: 0,
        avg_win: 0,
        avg_loss: 0,
      };
    }

    const wins = trades.filter((t) => t.net_pnl > 0);
    const losses = trades.filter((t) => t.net_pnl < 0);
    const total_pnl = trades.reduce((sum, t) => sum + t.net_pnl, 0);
    const avg_win =
      wins.length > 0
        ? wins.reduce((sum, t) => sum + t.net_pnl, 0) / wins.length
        : 0;
    const avg_loss =
      losses.length > 0
        ? losses.reduce((sum, t) => sum + t.net_pnl, 0) / losses.length
        : 0;
    const profit_factor = avg_loss === 0 ? 0 : Math.abs(avg_win / avg_loss);

    return {
      total_trades: trades.length,
      total_pnl: +total_pnl.toFixed(2),
      realized_pnl: +total_pnl.toFixed(2),
      win_rate: +((wins.length / trades.length) * 100).toFixed(2),
      avg_win: +avg_win.toFixed(2),
      avg_loss: +avg_loss.toFixed(2),
      profit_factor: +profit_factor.toFixed(2),
      winning_trades: wins.length,
      losing_trades: losses.length,
    };
  }
}

module.exports = {
  DecisionLogger,
  TradeEvaluator,
  PaperTradingEngine,
};
