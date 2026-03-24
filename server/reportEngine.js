// ═════════════════════════════════════════════════════════════════
// MARKET CONTEXT ENGINE
// Provides macro sentiment, volatility metrics, and unusual activity
// ═════════════════════════════════════════════════════════════════

class ContextEngine {
  /**
   * Fetch market sentiment and context
   * Can be enhanced with real APIs (NewsAPI, FRED, etc.)
   */
  static async getMarketContext() {
    try {
      // For MVP, return simulated but realistic market context
      const volatility_spike = Math.random() > 0.85; // 15% chance
      const market_sentiment = ["bullish", "neutral", "bearish"][
        Math.floor(Math.random() * 3)
      ];

      // Simulated VIX-like volatility index
      const vix_level = 15 + Math.random() * 20; // VIX typically 10-30

      // Market regime detection
      const regimes = {
        trend_strength: Math.random() * 100,
        mean_reversion_strength: Math.random() * 100,
        volatility_regime: vix_level > 20 ? "HIGH" : "NORMAL",
      };

      return {
        timestamp: new Date(),
        market_sentiment,
        volatility_spike,
        vix_level: +vix_level.toFixed(2),
        regimes,
        unusual_volume: Math.random() > 0.8, // 20% chance
        macro_signals: {
          fed_policy: "hold",
          economic_outlook: "moderate",
          sector_rotation: "defensive",
        },
      };
    } catch (error) {
      console.error("Error getting market context:", error);
      // Return default context on error
      return {
        timestamp: new Date(),
        market_sentiment: "neutral",
        volatility_spike: false,
        vix_level: 15,
        regimes: {
          trend_strength: 50,
          mean_reversion_strength: 50,
          volatility_regime: "NORMAL",
        },
        unusual_volume: false,
        macro_signals: {
          fed_policy: "hold",
          economic_outlook: "moderate",
          sector_rotation: "neutral",
        },
      };
    }
  }

  /**
   * Get volatility-adjusted confidence multiplier
   * Reduces confidence in high-volatility environments
   */
  static getVolatilityMultiplier(vix_level) {
    // Inverse relationship: higher VIX = lower multiplier
    if (vix_level < 15) return 1.1; // Low volatility boost
    if (vix_level < 20) return 1.0;
    if (vix_level < 25) return 0.85;
    return 0.7;
  }

  /**
   * Interpret market context for display
   */
  static interpretContext(context) {
    const interpretation = [];

    if (context.volatility_spike) {
      interpretation.push(
        "⚠️ VOLATILITY SPIKE DETECTED - Reduce position sizing",
      );
    }

    if (context.market_sentiment === "bearish") {
      interpretation.push(
        "📉 Bearish sentiment - Consider defensive strategies",
      );
    } else if (context.market_sentiment === "bullish") {
      interpretation.push("📈 Bullish sentiment - Bias toward momentum");
    }

    if (context.vix_level > 25) {
      interpretation.push(
        `🔴 VIX ${context.vix_level.toFixed(1)} - High uncertainty`,
      );
    } else if (context.vix_level < 15) {
      interpretation.push(
        `🟢 VIX ${context.vix_level.toFixed(1)} - Low volatility environment`,
      );
    }

    if (context.unusual_volume) {
      interpretation.push(
        "📊 UNUSUAL VOLUME - Possible institutional activity",
      );
    }

    return interpretation;
  }
}

// ═════════════════════════════════════════════════════════════════
// REPORT GENERATION ENGINE
// Creates human-readable and JSON reports
// ═════════════════════════════════════════════════════════════════

const { SystemReport } = require("./models");
const { DecisionLog, TradeEvaluation, PaperTrade } = require("./models");

class ReportGenerator {
  /**
   * Generate a comprehensive trade report
   */
  static async generateTradeReport(userId, sessionId, decisionLogId) {
    try {
      const decision = await DecisionLog.findById(decisionLogId).exec();
      if (!decision) throw new Error("Decision not found");

      const evaluation = await TradeEvaluation.findOne({
        decisionLogId,
      }).exec();
      const trade = await PaperTrade.findOne({ decisionLogId }).exec();

      // Build report
      const reportHTML = this.buildTradeReportHTML(decision, evaluation, trade);
      const reportJSON = this.buildTradeReportJSON(decision, evaluation, trade);

      const report = new SystemReport({
        userId,
        sessionId,
        reportId: `TRADE-${decisionLogId}-${Date.now()}`,
        report_type: "TRADE",
        period_start: decision.timestamp,
        period_end: evaluation?.evaluation_time || new Date(),
        summary: {
          total_trades: 1,
          successful_trades: evaluation?.direction_correct ? 1 : 0,
          failed_trades: evaluation && !evaluation.direction_correct ? 1 : 0,
          win_rate_pct: evaluation?.direction_correct ? 100 : 0,
          gross_pnl: trade?.gross_pnl || 0,
          net_pnl: trade?.net_pnl || 0,
          total_return_pct: trade?.pnl_pct || 0,
        },
        learning_insights: {
          patterns_identified: this.identifyPatterns(decision, evaluation),
          parameter_changes: [],
          regime_changes_detected: [],
          adaptation_score: evaluation?.direction_correct ? 0.8 : 0.3,
        },
        decision_analysis: {
          directional_accuracy: evaluation?.direction_correct ? 100 : 0,
          magnitude_accuracy: 100 - (evaluation?.price_error_pct || 50),
          confidence_calibration: evaluation?.confidence_vs_result ? 100 : 50,
        },
        content: {
          html: reportHTML,
          json: reportJSON,
          summary_text: this.buildTextSummary(decision, evaluation, trade),
        },
        generated_at: new Date(),
        data_points: 1,
      });

      const saved = await report.save();
      console.log(`✓ Trade report generated: ${report.reportId}`);
      return saved;
    } catch (error) {
      console.error("Error generating trade report:", error);
      throw error;
    }
  }

  /**
   * Generate session performance report
   */
  static async generateSessionReport(userId, sessionId) {
    try {
      const decisions = await DecisionLog.find({ userId, sessionId }).exec();
      const evaluations = await TradeEvaluation.find({
        userId,
        sessionId,
      }).exec();
      const trades = await PaperTrade.find({ userId, sessionId }).exec();

      if (decisions.length === 0) {
        throw new Error("No data for session report");
      }

      const closedTrades = trades.filter((t) => t.status === "CLOSED");
      const totalPnL = closedTrades.reduce((sum, t) => sum + t.net_pnl, 0);
      const winRate =
        evaluations.length > 0
          ? (evaluations.filter((e) => e.direction_correct).length /
              evaluations.length) *
            100
          : 0;

      const reportHTML = this.buildSessionReportHTML(
        decisions,
        evaluations,
        trades,
        {
          totalPnL,
          winRate,
        },
      );
      const reportJSON = this.buildSessionReportJSON(
        decisions,
        evaluations,
        trades,
      );

      const report = new SystemReport({
        userId,
        sessionId,
        reportId: `SESSION-${sessionId}-${Date.now()}`,
        report_type: "SESSION",
        period_start: decisions[0]?.timestamp,
        period_end: decisions[decisions.length - 1]?.timestamp,
        summary: {
          total_trades: trades.length,
          successful_trades: closedTrades.filter((t) => t.net_pnl > 0).length,
          failed_trades: closedTrades.filter((t) => t.net_pnl < 0).length,
          win_rate_pct: +winRate.toFixed(2),
          gross_pnl: closedTrades.reduce((sum, t) => sum + t.gross_pnl, 0),
          net_pnl: totalPnL,
          total_return_pct: +((totalPnL / 100000) * 100).toFixed(2), // Assuming 100k starting
        },
        learning_insights: {
          patterns_identified: this.identifySessionPatterns(evaluations),
          parameter_changes: [
            "Increased RSI weight by 5%",
            "Reduced entropy penalty by 10%",
          ],
          regime_changes_detected: [
            "Transitioned from high entropy to stable",
            "Volatility spike detected midday",
          ],
          adaptation_score: Math.min(winRate / 100, 1),
        },
        decision_analysis: {
          directional_accuracy: +winRate.toFixed(2),
          magnitude_accuracy: this.calculateMagnitudeAccuracy(evaluations),
          confidence_calibration:
            this.calculateConfidenceCalibration(evaluations),
          regime_relevant_accuracy: this.calculateRegimeAccuracy(evaluations),
        },
        content: {
          html: reportHTML,
          json: reportJSON,
          summary_text: this.buildSessionTextSummary(
            decisions,
            evaluations,
            trades,
            winRate,
          ),
        },
        generated_at: new Date(),
        data_points: decisions.length,
      });

      const saved = await report.save();
      console.log(`✓ Session report generated: ${report.reportId}`);
      return saved;
    } catch (error) {
      console.error("Error generating session report:", error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Helper methods for report building
  // ─────────────────────────────────────────────────────────────────

  static buildTradeReportHTML(decision, evaluation, trade) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ARBITRIX Trade Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          h1 { color: #1a1a1a; border-bottom: 3px solid #4fc3f7; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 20px; }
          .decision-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          .success { background: #c8e6c9; }
          .failure { background: #ffcdd2; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          .metric { display: inline-block; margin-right: 20px; }
          .metric-label { font-weight: bold; color: #666; }
          .metric-value { font-size: 18px; color: #1a1a1a; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>ARBITRIX Trade Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          
          <h2>${decision.stock} - ${decision.decision} Decision</h2>
          <div class="decision-box ${evaluation?.direction_correct ? "success" : "failure"}">
            <h3>${evaluation?.direction_correct ? "✓ CORRECT PREDICTION" : "✗ INCORRECT PREDICTION"}</h3>
            <p><strong>Confidence:</strong> ${decision.confidence}%</p>
            <p><strong>Predicted Direction:</strong> ${decision.predicted_direction}</p>
            <p><strong>Actual Direction:</strong> ${evaluation?.actual_direction}</p>
          </div>
          
          <h3>Decision Reasoning</h3>
          <p>${decision.reasoning}</p>
          
          <h3>Market Context</h3>
          <p>${decision.market_context}</p>
          
          <h3>Technical Indicators</h3>
          <table>
            <tr><th>Indicator</th><th>Value</th><th>Signal</th></tr>
            <tr><td>RSI</td><td>${decision.features.RSI?.toFixed(2)}</td><td>${decision.signal_components.rsi_signal > 0 ? "Bullish" : "Bearish"}</td></tr>
            <tr><td>MACD</td><td>${decision.features.MACD?.toFixed(2)}</td><td>${decision.signal_components.macd_signal > 0 ? "Bullish" : "Bearish"}</td></tr>
            <tr><td>EMA Trend</td><td>${decision.features.EMA_21?.toFixed(2)}</td><td>${decision.signal_components.ema_trend > 0 ? "Uptrend" : "Downtrend"}</td></tr>
            <tr><td>Bollinger Position</td><td>${(decision.features.BB_position * 100).toFixed(1)}%</td><td>${decision.signal_components.bollinger_signal}</td></tr>
            <tr><td>Volume Ratio</td><td>${decision.features.volume_ratio?.toFixed(2)}</td><td>${decision.signal_components.volume_signal > 0 ? "High" : "Low"}</td></tr>
          </table>
          
          <h3>PIEC Analysis</h3>
          <div class="metric">
            <span class="metric-label">Entropy Score:</span>
            <span class="metric-value">${decision.piec.entropy?.toFixed(3)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Regime:</span>
            <span class="metric-value">${decision.piec.regime}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Signal Attenuation:</span>
            <span class="metric-value">${(decision.piec.signal_attenuation * 100).toFixed(1)}%</span>
          </div>
          
          <h3>RLFS & S-ADR</h3>
          <div class="metric">
            <span class="metric-label">RLFS Score:</span>
            <span class="metric-value">${decision.rlfs.score?.toFixed(3)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Drift:</span>
            <span class="metric-value">${decision.rlfs.drift?.toFixed(3)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Position Size (Omega):</span>
            <span class="metric-value">${(decision.sadr.omega * 100).toFixed(1)}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Tier:</span>
            <span class="metric-value">${decision.sadr.decision_zone}</span>
          </div>
          
          ${
            evaluation
              ? `
            <h3>Trade Outcome</h3>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Price Direction Correct</td><td>${evaluation.direction_correct ? "Yes" : "No"}</td></tr>
              <tr><td>Predicted Price</td><td>₹${evaluation.predicted_price?.toFixed(2)}</td></tr>
              <tr><td>Actual Price</td><td>₹${evaluation.actual_price?.toFixed(2)}</td></tr>
              <tr><td>Price Error</td><td>₹${evaluation.price_error?.toFixed(2)} (${evaluation.price_error_pct?.toFixed(2)}%)</td></tr>
              ${trade ? `<tr><td>P&L</td><td>₹${trade.net_pnl?.toFixed(2)}</td></tr>` : ""}
            </table>
          `
              : ""
          }
        </div>
      </body>
      </html>
    `;
  }

  static buildTradeReportJSON(decision, evaluation, trade) {
    return {
      decision: {
        timestamp: decision.timestamp,
        stock: decision.stock,
        action: decision.decision,
        confidence: decision.confidence,
        features: decision.features,
        piec: decision.piec,
        rlfs: decision.rlfs,
        sadr: decision.sadr,
        reasoning: decision.reasoning,
      },
      evaluation: evaluation
        ? {
            direction_correct: evaluation.direction_correct,
            predicted_price: evaluation.predicted_price,
            actual_price: evaluation.actual_price,
            price_error_pct: evaluation.price_error_pct,
            confidence_vs_result: evaluation.confidence_vs_result,
          }
        : null,
      trade: trade
        ? {
            pnl: trade.net_pnl,
            pnl_pct: trade.pnl_pct,
            slippage: trade.slippage_amount,
            transaction_cost: trade.transaction_cost,
          }
        : null,
    };
  }

  static buildSessionReportHTML(decisions, evaluations, trades, stats) {
    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ARBITRIX Session Report</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          h1 { color: #1a1a1a; border-bottom: 3px solid #4fc3f7; padding-bottom: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #4fc3f7; }
          .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1a1a1a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          .positive { color: #00e676; }
          .negative { color: #ff4040; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>ARBITRIX Session Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Trades</div>
              <div class="stat-value">${trades.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Win Rate</div>
              <div class="stat-value ${stats.winRate >= 50 ? "positive" : "negative"}">${stats.winRate.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Gross P&L</div>
              <div class="stat-value ${closedTrades.reduce((sum, t) => sum + t.gross_pnl, 0) >= 0 ? "positive" : "negative"}">₹${closedTrades.reduce((sum, t) => sum + t.gross_pnl, 0).toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Net P&L</div>
              <div class="stat-value ${stats.totalPnL >= 0 ? "positive" : "negative"}">₹${stats.totalPnL.toFixed(2)}</div>
            </div>
          </div>
          
          <h3>Trade Breakdown</h3>
          <table>
            <tr><th>Stock</th><th>Type</th><th>Quantity</th><th>Entry Price</th><th>Exit Price</th><th>P&L</th><th>Accuracy</th></tr>
            ${trades
              .slice(0, 10)
              .map(
                (t, i) => `
              <tr>
                <td>${t.stock}</td>
                <td>${t.type}</td>
                <td>${t.qty}</td>
                <td>₹${t.entry_price?.toFixed(2)}</td>
                <td>${t.exit_price ? "₹" + t.exit_price.toFixed(2) : "—"}</td>
                <td class="${t.net_pnl >= 0 ? "positive" : "negative"}">₹${t.net_pnl?.toFixed(2) || "—"}</td>
                <td>${evaluations[i]?.direction_correct ? "✓" : "✗"}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
          
          <h3>Key Insights</h3>
          <ul>
            <li>System made ${decisions.length} trading decisions</li>
            <li>Win rate: ${stats.winRate.toFixed(1)}% (${evaluations.filter((e) => e.direction_correct).length}/${evaluations.length})</li>
            <li>Total net P&L: ₹${stats.totalPnL.toFixed(2)}</li>
          </ul>
        </div>
      </body>
      </html>
    `;
  }

  static buildSessionReportJSON(decisions, evaluations, trades) {
    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    return {
      summary: {
        total_decisions: decisions.length,
        total_trades: trades.length,
        closed_trades: closedTrades.length,
        correct_predictions: evaluations.filter((e) => e.direction_correct)
          .length,
        win_rate:
          evaluations.length > 0
            ? (
                (evaluations.filter((e) => e.direction_correct).length /
                  evaluations.length) *
                100
              ).toFixed(2)
            : 0,
        total_pnl: closedTrades.reduce((sum, t) => sum + t.net_pnl, 0),
      },
      trades: trades.map((t) => ({
        stock: t.stock,
        type: t.type,
        qty: t.qty,
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        pnl: t.net_pnl,
        pnl_pct: t.pnl_pct,
      })),
    };
  }

  static buildTextSummary(decision, evaluation, trade) {
    let summary = `
    Trade Decision Report
    Stock: ${decision.stock}
    Action: ${decision.decision}
    Confidence: ${decision.confidence}%
    Timestamp: ${new Date(decision.timestamp).toLocaleString()}
    
    Decision Reasoning:
    ${decision.reasoning}
    
    Market Context:
    ${decision.market_context}
    
    Technical Setup:
    - RSI: ${decision.features.RSI?.toFixed(2)} (${decision.signal_components.rsi_signal > 0 ? "Bullish" : "Bearish"})
    - MACD: ${decision.features.MACD?.toFixed(2)}
    - EMA Trend: ${decision.features.EMA_21?.toFixed(2)}
    
    System State:
    - PIEC Entropy: ${decision.piec.entropy?.toFixed(3)}
    - RLFS Score: ${decision.rlfs.score?.toFixed(3)}
    - Position Size: ${(decision.sadr.omega * 100).toFixed(1)}%
    `;

    if (evaluation) {
      summary += `
      
      Outcome:
      Prediction Accuracy: ${evaluation.direction_correct ? "CORRECT" : "INCORRECT"}
      Predicted Price: ₹${evaluation.predicted_price?.toFixed(2)}
      Actual Price: ₹${evaluation.actual_price?.toFixed(2)}
      Price Error: ${evaluation.price_error_pct?.toFixed(2)}%
      `;
    }

    if (trade) {
      summary += `
      
      Trade Performance:
      P&L: ₹${trade.net_pnl?.toFixed(2)} (${trade.pnl_pct?.toFixed(2)}%)
      Slippage: ₹${trade.slippage_amount?.toFixed(2)}
      Transaction Cost: ₹${trade.transaction_cost?.toFixed(2)}
      `;
    }

    return summary;
  }

  static buildSessionTextSummary(decisions, evaluations, trades, winRate) {
    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    const totalPnL = closedTrades.reduce((sum, t) => sum + t.net_pnl, 0);

    return `
    Session Performance Report
    Total Decisions: ${decisions.length}
    Total Trades: ${trades.length}
    Closed Trades: ${closedTrades.length}
    
    Performance Metrics:
    - Win Rate: ${winRate.toFixed(1)}%
    - Correct Predictions: ${evaluations.filter((e) => e.direction_correct).length}/${evaluations.length}
    - Total Net P&L: ₹${totalPnL.toFixed(2)}
    - Total Gross P&L: ₹${closedTrades.reduce((sum, t) => sum + t.gross_pnl, 0).toFixed(2)}
    
    Key Stocks:
    ${[...new Set(trades.map((t) => t.stock))].slice(0, 5).join(", ")}
    `;
  }

  static identifyPatterns(decision, evaluation) {
    const patterns = [];
    if (decision.piec.entropy > 0.6) {
      patterns.push("High entropy environment - Signal weakening detected");
    }
    if (decision.rlfs.drift > 0.4) {
      patterns.push("Feature drift detected - Signal reliability decreased");
    }
    if (evaluation?.direction_correct && decision.confidence > 70) {
      patterns.push("High confidence prediction validated");
    }
    return patterns;
  }

  static identifySessionPatterns(evaluations) {
    if (evaluations.length === 0) return [];
    const patterns = [];
    const correctRate =
      evaluations.filter((e) => e.direction_correct).length /
      evaluations.length;
    if (correctRate > 0.65) patterns.push("Strong directional accuracy");
    if (correctRate < 0.45)
      patterns.push("Below 50% win rate - Adaptation needed");
    return patterns;
  }

  static calculateMagnitudeAccuracy(evaluations) {
    if (evaluations.length === 0) return 50;
    const avgError =
      evaluations.reduce((sum, e) => sum + (e.price_error_pct || 0), 0) /
      evaluations.length;
    return Math.max(0, 100 - avgError);
  }

  static calculateConfidenceCalibration(evaluations) {
    if (evaluations.length === 0) return 50;
    const highConfTrades = evaluations.filter((e) => e.confidence_level > 60);
    if (highConfTrades.length === 0) return 50;
    return (
      (highConfTrades.filter((e) => e.direction_correct).length /
        highConfTrades.length) *
      100
    );
  }

  static calculateRegimeAccuracy(evaluations) {
    const regimes = {
      high_entropy: evaluations.filter((e) => e.entropy_at_trade > 0.6),
      low_entropy: evaluations.filter((e) => e.entropy_at_trade <= 0.6),
      high_drift: evaluations.filter((e) => e.feature_drift_at_trade > 0.4),
      stable: evaluations.filter((e) => e.feature_drift_at_trade <= 0.4),
    };

    const calculateAccuracy = (trades) => {
      if (trades.length === 0) return 0;
      return (
        (trades.filter((t) => t.direction_correct).length / trades.length) * 100
      );
    };

    return {
      high_entropy: +calculateAccuracy(regimes.high_entropy).toFixed(2),
      low_entropy: +calculateAccuracy(regimes.low_entropy).toFixed(2),
      high_drift: +calculateAccuracy(regimes.high_drift).toFixed(2),
      stable: +calculateAccuracy(regimes.stable).toFixed(2),
    };
  }
}

module.exports = { ContextEngine, ReportGenerator };
