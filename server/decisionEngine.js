const {
  DecisionLog,
  TradeEvaluation,
  PaperTrade,
  LearnedParameters,
  Order,
  Execution,
  Position,
  CashEntry,
} = require("./models");

const COMMISSION_RATE = 0.0005;
const SLIPPAGE_RANGE = { min: 0.001, max: 0.003 };

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
      // Based on actual component contributions from signal_components
      const components = params.signal_components || {};
      const threshold = 0.15; // Minimum score to count as "contributed"

      const signalMap = {
        EMA_TREND: components.ema_trend || 0,
        RSI: components.rsi_signal || 0,
        MACD: components.macd_signal || 0,
        BOLLINGER: components.bollinger_signal || 0,
        VOLUME: components.volume_signal || 0,
        STOCH: components.stoch_signal || 0,
      };

      const should_increase_weight = [];
      const should_decrease_weight = [];

      for (const [signal, score] of Object.entries(signalMap)) {
        if (Math.abs(score) < threshold) continue;
        // If trade was profitable and signal agreed with direction, increase
        if (direction_correct && ((score > 0 && predicted_direction === "UP") || (score < 0 && predicted_direction === "DOWN"))) {
          should_increase_weight.push(signal);
        }
        // If trade was wrong and signal disagreed with actual direction, decrease
        if (!direction_correct && ((score > 0 && actual_direction === "DOWN") || (score < 0 && actual_direction === "UP"))) {
          should_decrease_weight.push(signal);
        }
      }

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
   * Place and fill an order (long-only).
   * BUY opens/increases a position. SELL reduces/closes an existing position.
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
        idempotencyKey,
      } = params;

      if (!userId || !sessionId || !type || !stock || !qty || !price) {
        throw new Error("Missing required trade parameters");
      }
      if (!["BUY", "SELL"].includes(type)) {
        throw new Error("type must be BUY or SELL");
      }
      if (qty <= 0 || !Number.isInteger(qty)) {
        throw new Error("qty must be a positive integer");
      }
      if (price <= 0 || !Number.isFinite(price)) {
        throw new Error("price must be a positive number");
      }

      // Check idempotency
      if (idempotencyKey) {
        const existing = await Order.findOne({ idempotencyKey }).exec();
        if (existing) {
          const exec = await Execution.findOne({ orderId: existing._id }).exec();
          return { orderId: existing._id, tradeId: existing._id, fill: exec };
        }
      }

      // SELL validation: must have sufficient position
      if (type === "SELL") {
        const pos = await Position.findOne({ userId, symbol: stock }).exec();
        if (!pos || pos.quantity < qty) {
          const order = new Order({
            userId, sessionId, symbol: stock, side: "SELL", quantity: qty,
            status: "REJECTED", rejectReason: "Insufficient position",
            idempotencyKey,
          });
          await order.save();
          throw new Error("Insufficient position to sell");
        }
      }

      // BUY validation: check cash
      if (type === "BUY") {
        const cashBalance = await PaperTradingEngine.getCashBalance(userId);
        const slippagePct = (Math.random() * (SLIPPAGE_RANGE.max - SLIPPAGE_RANGE.min) + SLIPPAGE_RANGE.min);
        const estimatedFill = price * (1 + slippagePct);
        const estimatedCost = estimatedFill * qty;
        const estimatedCommission = estimatedCost * COMMISSION_RATE;
        if (estimatedCost + estimatedCommission > cashBalance) {
          const order = new Order({
            userId, sessionId, symbol: stock, side: "BUY", quantity: qty,
            status: "REJECTED", rejectReason: "Insufficient cash",
            idempotencyKey,
          });
          await order.save();
          throw new Error("Insufficient cash");
        }
      }

      // Create Order
      const order = new Order({
        userId, sessionId, symbol: stock, side: type, quantity: qty,
        status: "ACCEPTED", idempotencyKey, decisionId: decisionLogId,
      });
      await order.save();

      // Calculate fill with slippage (single random value for consistency)
      const slippagePct = (Math.random() * (SLIPPAGE_RANGE.max - SLIPPAGE_RANGE.min) + SLIPPAGE_RANGE.min);
      const fillPrice = type === "BUY"
        ? price * (1 + slippagePct)
        : price * (1 - slippagePct);

      const grossValue = fillPrice * qty;
      const commission = grossValue * COMMISSION_RATE;
      const slippageValue = Math.abs(fillPrice - price) * qty;

      // Create immutable Execution
      const execution = new Execution({
        orderId: order._id,
        userId, sessionId, symbol: stock, side: type,
        quantity: qty,
        requestedPrice: price,
        fillPrice,
        grossValue,
        commission,
        slippageValue,
      });
      await execution.save();

      // Update Order status
      order.status = "FILLED";
      await order.save();

      // Update Position
      let pos;
      if (type === "BUY") {
        const buyCost = grossValue + commission;
        pos = await Position.findOne({ userId, symbol: stock }).exec();
        if (pos) {
          const newTotalCost = pos.totalCost + buyCost;
          const newQuantity = pos.quantity + qty;
          pos.quantity = newQuantity;
          pos.totalCost = newTotalCost;
          pos.averageCost = newTotalCost / newQuantity;
          pos.updatedAt = new Date();
          await pos.save();
        } else {
          pos = new Position({
            userId, symbol: stock,
            quantity: qty,
            totalCost: grossValue + commission,
            averageCost: (grossValue + commission) / qty,
          });
          await pos.save();
        }
      } else {
        // SELL: atomic check-and-decrement
        pos = await Position.findOneAndUpdate(
          { userId, symbol: stock, quantity: { $gte: qty } },
          { $inc: { quantity: -qty } },
          { new: true }
        ).exec();
        if (!pos) {
          // Roll back the execution — position was insufficient
          await Execution.deleteOne({ _id: execution._id });
          await Order.updateOne({ _id: order._id }, { status: "REJECTED", rejectReason: "Insufficient position" });
          throw new Error("Insufficient position to sell");
        }
        const costBasis = pos.averageCost * qty;
        const netProceeds = grossValue - commission;
        pos.totalCost = pos.averageCost * pos.quantity;
        pos.realizedPnl += netProceeds - costBasis;
        if (pos.quantity === 0) {
          pos.totalCost = 0;
          pos.averageCost = 0;
        }
        pos.updatedAt = new Date();
        await pos.save();
      }

      // Record cash entry
      const prevBalance = await PaperTradingEngine.getCashBalance(userId);
      if (type === "BUY") {
        const totalCost = grossValue + commission;
        await new CashEntry({
          userId, executionId: execution._id,
          amount: -totalCost, reason: "BUY_SETTLEMENT",
          balanceAfter: prevBalance - totalCost,
        }).save();
      } else {
        const netProceeds = grossValue - commission;
        await new CashEntry({
          userId, executionId: execution._id,
          amount: netProceeds, reason: "SELL_SETTLEMENT",
          balanceAfter: prevBalance + netProceeds,
        }).save();
      }

      console.log(`✓ ${type} filled: ${qty}×${stock} @ ${fillPrice.toFixed(2)} (commission: ${commission.toFixed(2)})`);

      return {
        orderId: order._id,
        tradeId: order._id,
        fill: execution,
        position: pos ? { quantity: pos.quantity, averageCost: pos.averageCost } : null,
      };
    } catch (error) {
      console.error("Error executing trade:", error);
      throw error;
    }
  }

  /**
   * Get cash balance from cash entry ledger
   */
  static async getCashBalance(userId) {
    const lastEntry = await CashEntry.findOne({ userId })
      .sort({ createdAt: -1 })
      .exec();
    return lastEntry ? lastEntry.balanceAfter : 0;
  }

  /**
   * Initialize account with initial deposit
   */
  static async initializeAccount(userId, initialCash) {
    const existing = await CashEntry.findOne({ userId }).exec();
    if (!existing) {
      await new CashEntry({
        userId, amount: initialCash,
        reason: "INITIAL_DEPOSIT",
        balanceAfter: initialCash,
      }).save();
    }
  }

  /**
   * Close position (SELL entire holding)
   */
  static async closeTrade(tradeId, exit_price, userId) {
    try {
      // Find the original order to get the stock symbol
      const order = await Order.findById(tradeId).exec();
      if (!order) throw new Error("Trade not found");
      if (order.userId !== userId) throw new Error("Forbidden");

      const pos = await Position.findOne({ userId, symbol: order.symbol }).exec();
      if (!pos || pos.quantity <= 0) throw new Error("No open position");

      // Create a SELL order for the full position
      return await PaperTradingEngine.executeTrade({
        userId,
        sessionId: order.sessionId,
        type: "SELL",
        stock: order.symbol,
        qty: pos.quantity,
        price: exit_price,
        execution_mode: "MANUAL",
      });
    } catch (error) {
      console.error("Error closing trade:", error);
      throw error;
    }
  }

  /**
   * Get trade history (from executions)
   */
  static async getTradeHistory(userId, sessionId, limit = 50) {
    return await Execution.find({ userId, sessionId })
      .sort({ executedAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Calculate portfolio metrics from positions and cash ledger
   */
  static async calculatePortfolioMetrics(userId, sessionId) {
    const positions = await Position.find({ userId, quantity: { $gt: 0 } }).exec();
    const cashBalance = await PaperTradingEngine.getCashBalance(userId);
    const closedPositions = await Position.find({ userId, quantity: 0, realizedPnl: { $ne: 0 } }).exec();

    const totalRealizedPnl = closedPositions.reduce((sum, p) => sum + p.realizedPnl, 0);
    const wins = closedPositions.filter(p => p.realizedPnl > 0);
    const losses = closedPositions.filter(p => p.realizedPnl < 0);

    return {
      cash: +cashBalance.toFixed(2),
      openPositions: positions.length,
      positions: positions.map(p => ({
        symbol: p.symbol,
        quantity: p.quantity,
        averageCost: +p.averageCost.toFixed(2),
        totalCost: +p.totalCost.toFixed(2),
        realizedPnl: +p.realizedPnl.toFixed(2),
      })),
      realizedPnl: +totalRealizedPnl.toFixed(2),
      totalTrades: closedPositions.length + positions.filter(p => p.quantity > 0).length,
      winRate: closedPositions.length > 0
        ? +((wins.length / closedPositions.length) * 100).toFixed(2)
        : 0,
      avgWin: wins.length > 0
        ? +(wins.reduce((s, p) => s + p.realizedPnl, 0) / wins.length).toFixed(2)
        : 0,
      avgLoss: losses.length > 0
        ? +(losses.reduce((s, p) => s + p.realizedPnl, 0) / losses.length).toFixed(2)
        : 0,
      profitFactor: losses.length > 0 && losses.reduce((s, p) => s + Math.abs(p.realizedPnl), 0) > 0
        ? +(wins.reduce((s, p) => s + p.realizedPnl, 0) / losses.reduce((s, p) => s + Math.abs(p.realizedPnl), 0)).toFixed(2)
        : 0,
    };
  }
}

module.exports = {
  DecisionLogger,
  TradeEvaluator,
  PaperTradingEngine,
};
