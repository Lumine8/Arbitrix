# ARBITRIX Self-Learning Trading System - Implementation Guide

## 🎯 Overview

This document outlines the comprehensive self-learning, regime-aware trading system implementation for Arbitrix. The system combines real-time market analysis, decision logging, post-trade evaluation, and adaptive learning to create an explainable autonomous trading platform.

---

## 📋 Architecture Overview

### Core Components

1. **Paper Trading Engine** - Simulates all trades with realistic slippage and costs
2. **Decision Logging System** - Captures every trade decision with full context
3. **Post-Trade Evaluation Engine** - Evaluates prediction accuracy after execution
4. **Self-Learning Adaptation Layer** - Learns from past mistakes and adapts parameters
5. **Explainability Engine** - PIEC interpretation and decision reasoning
6. **Report Generation** - Creates downloadable HTML and JSON reports
7. **Market Context Engine** - Detects volatility spikes and macro sentiment
8. **Control Modes** - FULL-AI, SEMI-AI, MANUAL trading modes

---

## 🗄️ Database Schema (MongoDB)

### Collections

#### 1. `decision_logs`

Logs every trading decision with complete context.

```javascript
{
  userId: String,
  sessionId: String,
  timestamp: Date,
  stock: String,

  // Technical indicators
  features: {
    RSI, MACD, EMA_9, EMA_21, EMA_50,
    BB_position, volume_ratio, ATR, volatility
  },

  // System state
  piec: { entropy, regime, signal_attenuation },
  rlfs: { drift, score, stability_regime },
  sadr: { omega, decision_zone },

  // Decision & reasoning
  decision: "BUY|SELL|HOLD",
  reasonsing: String,
  confidence: Number,

  // Predictions
  predicted_price_10d: Number,
  predicted_direction: "UP|DOWN|NEUTRAL"
}
```

#### 2. `trade_evaluations`

Records prediction accuracy after market moves.

```javascript
{
  userId: String,
  decisionLogId: ObjectId,

  // Outcome metrics
  direction_correct: Boolean,
  price_error_pct: Number,
  confidence_vs_result: "HIGH_CORRECT|HIGH_WRONG|LOW_CORRECT|LOW_WRONG",

  // Learning signals
  should_increase_weight: [String],  // Indicator names
  should_decrease_weight: [String]
}
```

#### 3. `learned_parameters`

Stores system-learned adaptations.

```javascript
{
  userId: String,

  indicator_weights: {
    EMA_TREND_WEIGHT: { value, iterations, performance },
    RSI_WEIGHT: { ... },
    // ... other indicators
  },

  confidence_scaling: {
    base_multiplier: Number,
    entropy_penalty: Number,
    drift_penalty: Number
  },

  regime_statistics: {
    high_entropy: { win_rate, avg_accuracy },
    low_entropy: { ... },
    high_drift: { ... },
    stable: { ... }
  },

  performance_history: [{
    iteration: Number,
    accuracy: Number,
    win_rate: Number
  }]
}
```

#### 4. `paper_trades`

Simulated trades with P&L tracking.

```javascript
{
  userId: String,
  tradeId: String,

  type: "BUY|SELL",
  stock: String,
  qty: Number,
  entry_price: Number,
  exit_price: Number,

  // Slippage & costs
  slippage_amount: Number,
  transaction_cost: Number,

  // P&L
  net_pnl: Number,
  pnl_pct: Number,
  status: "OPEN|CLOSED"
}
```

#### 5. `portfolio_snapshots`

Daily snapshots of portfolio state.

```javascript
{
  userId: String,
  timestamp: Date,

  total_capital: Number,
  current_cash: Number,
  total_pnl: Number,

  // Risk metrics
  max_drawdown: Number,
  sharpe_ratio: Number,
  win_rate: Number,

  holdings: [{
    symbol: String,
    qty: Number,
    current_value: Number,
    unrealized_pnl: Number
  }]
}
```

#### 6. `system_reports`

Generated reports (HTML + JSON).

```javascript
{
  userId: String,
  reportId: String,
  report_type: "DAILY|WEEKLY|MONTHLY|SESSION|TRADE",

  period_start: Date,
  period_end: Date,

  summary: {
    total_trades: Number,
    win_rate_pct: Number,
    net_pnl: Number,
    sharpe_ratio: Number
  },

  content: {
    html: String,
    json: Object,
    summary_text: String
  }
}
```

---

## 🔌 Backend API Endpoints

### Decision Logging

```
POST /api/decisions/log
Body: { userId, sessionId, stock, features, piec, rlfs, sadr, decision, confidence, reasoning, ... }
Response: { success: true, decisionId: String }
```

```
GET /api/decisions/history/:userId/:sessionId?limit=100
Response: { success: true, data: [DecisionLog, ...] }
```

### Trade Evaluation

```
POST /api/trades/evaluate
Body: { userId, sessionId, decisionLogId, actual_price_at_eval, predicted_direction, ... }
Response: { success: true, evaluationId: String }
```

```
GET /api/trades/accuracy/:userId/:sessionId
Response: { success: true, data: { directional_accuracy: Number, magnitude_accuracy: Number, ... } }
```

### Paper Trading

```
POST /api/trades/execute
Body: { userId, sessionId, type, stock, qty, price, execution_mode, ... }
Response: { success: true, tradeId: String, data: PaperTrade }
```

```
POST /api/trades/close/:tradeId
Body: { exit_price: Number }
Response: { success: true, data: PaperTrade }
```

```
GET /api/trades/history/:userId/:sessionId
Response: { success: true, data: [PaperTrade, ...] }
```

```
GET /api/trades/metrics/:userId/:sessionId
Response: { success: true, data: { total_pnl, win_rate, profit_factor, ... } }
```

### Learning & Adaptation

```
POST /api/learning/initialize/:userId
Body: { sessionId: String }
Response: { success: true, data: LearnedParameters }
```

```
POST /api/learning/adapt/:userId
Body: { sessionId: String, lookbackWindow: 20 }
Response: { success: true, data: LearnedParameters }
```

```
GET /api/learning/parameters/:userId
Response: { success: true, data: LearnedParameters }
```

```
GET /api/learning/progress/:userId
Response: { success: true, data: { learning_iterations, performance_history, ... } }
```

```
GET /api/learning/regime-insights/:userId
Response: { success: true, data: { best_performing_regime, worst_performing_regime, ... } }
```

### Market Context

```
GET /api/context/market
Response: { success: true, data: { market_sentiment, volatility_spike, vix_level, ... } }
```

```
GET /api/context/volatility-multiplier/:vixLevel
Response: { success: true, multiplier: Number }
```

```
POST /api/context/interpret
Body: { context: Object }
Response: { success: true, interpretation: [String, ...] }
```

### Report Generation

```
POST /api/reports/trade
Body: { userId, sessionId, decisionLogId: String }
Response: { success: true, reportId: String, data: SystemReport }
```

```
POST /api/reports/session
Body: { userId, sessionId: String }
Response: { success: true, reportId: String, data: SystemReport }
```

```
GET /api/reports/:reportId
Response: { success: true, data: SystemReport }
```

---

## 🎛️ Trading Modes

### FULL-AI Mode 🤖

- **Description**: Automatic execution without confirmation
- **Use case**: Backtesting, live autonomous trading
- **Feature**: Trades execute immediately if confidence > threshold
- **Risk**: Higher due to no manual review

```javascript
const mode = TRADING_MODES.FULL_AI;
// Trade executes automatically
await executeTrade(userId, sessionId, {
  type: "BUY",
  stock: "RELIANCE.NS",
  qty: 10,
  price: 2500,
  execution_mode: "AUTO",
});
```

### SEMI-AI Mode 👁️

- **Description**: AI suggests, user confirms each trade
- **Use case**: Live trading with risk management oversight
- **Feature**: Shows decision reasoning before execution
- **Risk**: Lower due to manual confirmation

```javascript
const mode = TRADING_MODES.SEMI_AI;
// Shows decision modal, user clicks "Confirm" or "Reject"
const pending = {
  symbol: "TCS.NS",
  signal: "BUY",
  confidence: 72,
  reasoning: "Strong EMA trend + positive MACD",
  decision_id: "...",
};
// After user confirmation:
await executeTrade(userId, sessionId, tradeData);
```

### MANUAL Mode 👋

- **Description**: No auto trades, analysis only
- **Use case**: Paper trading, learning, conservative approach
- **Feature**: Only shows recommendations, user decides everything
- **Risk**: Depends entirely on user skill

```javascript
const mode = TRADING_MODES.MANUAL;
// System shows analysis but user must manually create orders
const analysis = await analyzeStock(...);
// User may or may not trade based on analysis
```

---

## 🧠 Learning System

### Adaptation Cycle

1. **Collect Trade Data** - Log decisions and outcomes
2. **Evaluate Accuracy** - Assess prediction correctness
3. **Analyze Signals** - Determine which indicators helped/hurt
4. **Adjust Weights** - Increase weight of accurate indicators
5. **Update Parameters** - Store new learned weights in DB
6. **Persist History** - Track adaptation iterations

### Regime-Specific Learning

System learns separately for different market regimes:

- **High Entropy** - Reduces weight of trend-following signals
- **Low Entropy** - Increases weight of momentum signals
- **High Drift** - Scales down all signals
- **Stable** - Uses full signal weights

### Example Adaptation Flow

```javascript
// 1. Initialize learning
const params = await initializeLearning(userId, sessionId);

// 2. Trade and evaluate (happens continuously)
await logDecision(userId, sessionId, decisionData);
await evaluateTrade(userId, sessionId, evalData);

// 3. Run adaptation cycle (e.g., after 20 trades)
const updated = await runAdaptation(userId, sessionId, (lookbackWindow = 20));

// 4. Check what improved
const progress = await getLearningProgress(userId);
console.log(progress.performance_history);
// [{ iteration: 1, accuracy: 0.52, win_rate: 52 },
//  { iteration: 2, accuracy: 0.58, win_rate: 58 }]

// 5. Get regime insights
const insights = await getRegimeInsights(userId);
// { best_performing_regime: { name: 'stable', win_rate: 0.72 }, ... }
```

---

## 📊 PIEC Explainability

### Entropy (Market Regime)

```
Entropy Score | Interpretation | Signal Reliability | Strategy
< 0.3         | Strong Trend   | ↑↑ Very High       | Follow trend aggressively
0.3 - 0.5     | Transitional   | ↑ Moderate         | Be selective
0.5 - 0.7     | Mean Revert    | ↓ Low              | Fade extremes
> 0.7         | Chaotic        | ↓↓ Very Low        | Wait or hedge
```

### RLFS (Feature Stability)

```
Drift Score | Status      | Signal Trust | Position Sizing
< 0.3       | Stable      | 100%         | Full (100%)
0.3 - 0.5   | Degraded    | 70%          | Reduced (50-70%)
> 0.5       | Rejected    | 30%          | Minimal (0-30%)
```

### S-ADR (Adaptive Position Sizing)

```
Tier    | Position Size | Risk Management      | Use Case
STABLE  | 100% omega    | Standard stops       | Trend following
DEGRADED| Scaled omega  | Tighter stops, lower | Cautious entry
REJECTED| 0% (no trade) | Avoid trading        | Wait for stability
```

---

## 📈 Decision Logging Flow

```
1. Market data fetched
   ↓
2. Technical indicators calculated
   ↓
3. PIEC/RLFS/S-ADR analysis performed
   ↓
4. Signal generated (BUY/SELL/HOLD)
   ↓
5. Decision LOGGED with full context
   ├─ Features, indicators, PIEC metrics
   ├─ Reasoning and market context
   ├─ Predictions and confidence
   └─ Execution metadata
   ↓
6. Trade executed (if mode allows)
   ├─ Paper trade recorded
   ├─ Slippage simulated
   └─ P&L tracked
   ↓
7. Outcome monitored
   ├─ Price updates tracked
   └─ P&L updated in real-time
   ↓
8. Trade EVALUATED after N candles
   ├─ Directional accuracy checked
   ├─ Price error calculated
   ├─ Confidence vs result compared
   └─ Learning signals generated
   ↓
9. Learning adapted
   ├─ Indicator weights adjusted
   ├─ Regime statistics updated
   └─ Parameters re-trained
   ↓
10. Report generated
    ├─ HTML downloadable
    ├─ JSON exportable
    └─ Insights shared
```

---

## 💾 Setup & Configuration

### Environment Variables

```bash
# .env file in server/
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/arbitrix
PORT=5000
JWT_SECRET=your_jwt_secret
ANTHROPIC_API_KEY=sk-ant-...
```

### Initialize MongoDB

```bash
# Ensure MongoDB is running
mongod

# Create indexes (optional but recommended)
# This is done automatically by Mongoose
```

### Start Backend

```bash
cd server
npm install
npm start
# Server will run on http://localhost:5000
```

### Start Frontend

```bash
npm install
npm run dev
# Frontend will run on http://localhost:5173 (or similar)
```

---

## 🚀 Usage Examples

### Example 1: Full-AI Trading Session

```javascript
import {
  logDecision,
  executeTrade,
  evaluateTrade,
  runAdaptation,
  generateSessionReport,
} from "./src/lib/trading";
import { analyzeStock } from "./src/lib/analyze";

const userId = "user_123";
const sessionId = "session_abc";

// 1. Analyze stock
const history = await fetchStock("INFY.NS");
const analysis = analyzeStock(history, rlfsMonitor);

// 2. Log decision
const decision = await logDecision(userId, sessionId, {
  stock: "INFY.NS",
  features: analysis.features,
  piec: analysis.piec,
  decision: analysis.signal,
  confidence: analysis.confidence,
  reasoning: "Strong EMA trend with positive RSI",
});

// 3. Execute trade (FULL-AI mode)
if (analysis.signal === "BUY") {
  const trade = await executeTrade(userId, sessionId, {
    type: "BUY",
    stock: "INFY.NS",
    qty: 10,
    price: analysis.last,
    execution_mode: "AUTO",
  });
}

// 4. After 5 candles, evaluate
const evaluation = await evaluateTrade(userId, sessionId, {
  decisionLogId: decision._id,
  actual_price_at_eval: 2650,
  predicted_price: 2670,
  direction_correct: true,
});

// 5. Run learning every 20 trades
if (tradeCount % 20 === 0) {
  const adapted = await runAdaptation(userId, sessionId, 20);
}

// 6. Generate report
const report = await generateSessionReport(userId, sessionId);
```

### Example 2: Semi-AI Trading with Confirmation

```javascript
// Mode set to SEMI-AI - requires user confirmation
const settings = { trainingMode: "SEMI_AI", confirmBuy: true };

// Decision logging still happens automatically
await logDecision(userId, sessionId, decisionData);

// But execution requires user confirmation via modal
const userConfirmed = await showConfirmationModal(decision);

if (userConfirmed) {
  await executeTrade(userId, sessionId, tradeData);
} else {
  // Log rejection for learning
  console.log("Trade rejected by user");
}
```

### Example 3: Regime Analysis

```javascript
import { analyzeStock } from "./src/lib/analyze";
import { generatePIECExplanation } from "./src/lib/explainability";

const history = await fetchStock("RELIANCE.NS");
const analysis = analyzeStock(history, rlfsMonitor);

// Get human-readable explanation
const explanation = generatePIECExplanation(analysis.piec);
console.log(explanation);

// Output:
// 📊 PIEC ANALYSIS:
//
// 🌍 MARKET ENTROPY: Strong Directional Trend
//    Entropy Score: 28.5% - Market is trending strongly...
//    Signal Reliability: 120%
//
// 🔍 RLFS (Feature Stability): Stable
//    Drift: 0.18% - Indicator features are consistent...
//    Signal Trust: 100%
//
// ⚖️ S-ADR (Position Sizing): Full Position Size
//    Position Size: 100.0%
//
// 🎯 OVERALL REGIME: STRONG_TREND
//    Trend is present and signals are stable
//    Trading Bias: Follow the trend aggressively
//    Strategy: Momentum trading, trend-following
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

- **Directional Accuracy**: % of correct UP/DOWN predictions
- **Magnitude Accuracy**: How close predictions are to actual prices
- **Confidence Calibration**: Do high-confidence trades perform better?
- **Win Rate**: % of profitable trades
- **Regime Performance**: Which market regimes yield best results?
- **Learning Curve**: Is accuracy improving over iterations?
- **Sharpe Ratio**: Risk-adjusted returns
- **Max Drawdown**: Largest peak-to-trough decline

### Example Dashboard Data

```javascript
const metrics = {
  total_decisions: 247,
  total_trades: 156,
  closed_trades: 142,
  directional_accuracy: 62.5,
  win_rate: 58.2,
  total_pnl: 24500,
  sharpe_ratio: 1.82,
  max_drawdown: -8.5,

  regime_performance: {
    high_entropy: { win_rate: 41, trades: 32 },
    low_entropy: { win_rate: 72, trades: 85 },
    high_drift: { win_rate: 35, trades: 15 },
    stable: { win_rate: 68, trades: 42 },
  },

  learning_progress: [
    { iteration: 1, accuracy: 54.2 },
    { iteration: 2, accuracy: 57.8 },
    { iteration: 3, accuracy: 61.1 },
    { iteration: 4, accuracy: 62.5 },
  ],
};
```

---

## ⚠️ Risk Management

### Position Sizing Limits

- **Max per trade**: 30% of portfolio
- **Max drawdown daily**: 5% of portfolio
- **Max drawdown monthly**: 15% of portfolio
- **Max concentration**: 3 stocks at 10% each

### Safety Mechanisms

1. **Circuit Breakers**
   - Stop trading if RLFS score drops below 0.3
   - Pause if entropy exceeds 0.8
   - Halt if daily loss > 5%

2. **Confirmation Requirements**
   - Always require confirmation for HIGH DRIFT trades
   - Always require for REJECTED regime
   - Optional for DEGRADED

3. **Auto-Stop Loss**
   - 5% stop loss on all trades by default
   - Can be adjusted per session

---

## 🔧 Development & Extensibility

### Adding Custom Indicators

```javascript
// In analyze.js, add custom indicator
export function customMA(prices, period) {
  // Your calculation
  return result;
}

// Then use in analysis
const custom = customMA(closes, 20);
const custom_signal = custom > customMA(closes, 50) ? 1 : -1;
const s6 = custom_signal * 0.15; // Add to composite
```

### Adding Custom Learning Rules

```javascript
// In learningEngine.js, extend adaptation logic
if (entropy > 0.6 && win_rate > 0.65) {
  // Entropy trades are actually profitable -
  // increase confidence in chaotic markets
  params.confidence_scaling.entropy_penalty *= 0.9;
}
```

### Custom Report Formats

```javascript
// In reportEngine.js, add new report type
static async generateCustomReport(userId, sessionId) {
  // Generate report in your format
  const report = new SystemReport({
    report_type: 'CUSTOM',
    // ... your data
  })
  return report.save()
}
```

---

## 📚 References

- **PIEC**: Physical Integrity Entropy Consensus - Measures market directional strength
- **RLFS**: Representation Learning Feature Stability - Detects indicator drift
- **S-ADR**: Sensitivity-Aware Adaptive Degradation Response - Maps drift to position sizing
- **MongoDB**: Document database for flexible data storage
- **Claude AI**: For trade reasoning and explanations

---

## 🎓 Theory & Background

### Why These Algorithms?

**PIEC** detects when the market is truly trending (low entropy) vs. chaotic/mean-reverting (high entropy). This helps the system avoid false signals in choppy markets.

**RLFS** detects when the statistical properties of indicators are shifting. When features drift, historical patterns become unreliable - the system should reduce confidence or stop trading.

**S-ADR** creates a continuous scaling function from drift → position size, avoiding binary decisions. The system doesn't just turn on/off; it gracefully degrades as confidence decreases.

### Learning Mechanism

1. Every trade is logged with its reasoning
2. After N trades, actual outcomes are evaluated
3. Indicators that picked winners get increased weight
4. Indicators that picked losers get decreased weight
5. Regime-specific weights are maintained
6. Over time, the system emphasizes what actually works

---

## 📝 Logging & Debugging

### Enable Verbose Logging

```javascript
// In constants.js
export const DEBUG_MODE = true;

// Then use throughout:
if (DEBUG_MODE) {
  console.log("Decision logic:", analysis);
  console.log("PIEC metrics:", analysis.piec);
}
```

### Monitor API Calls

Check browser console or server logs:

```
✓ Decision logged: 507f1f77bcf36cd799439011
✓ Trade executed: user_123-session_abc-1709845600000
✓ Trade evaluated: directional_accuracy=62.5%
✓ Adaptation cycle complete. Accuracy: 62.50%
```

---

## 🚢 Deployment Checklist

- [ ] MongoDB instance set up (MongoDB Atlas or local)
- [ ] Environment variables configured
- [ ] Backend server deployed
- [ ] Frontend build optimized
- [ ] API endpoints tested
- [ ] Database indexes created
- [ ] Logging configured
- [ ] Error handling verified
- [ ] Rate limiting implemented
- [ ] Security headers added

---

## 📞 Support & Troubleshooting

### Common Issues

**Q: MongoDB not connecting**

- Check MONGODB_URI in .env
- Ensure MongoDB service is running
- Verify IP whitelist on MongoDB Atlas

**Q: Decision logging showing errors**

- Ensure backend server is running
- Check userId and sessionId are valid
- Verify network connectivity

**Q: Learning not improving**

- Need sufficient trades (20+) for meaningful learning
- Check if regimes are changing too frequently
- Verify trade evaluations are being logged

**Q: Reports not generating**

- Need completed trades with evaluations
- Check decisionLogId exists
- Verify MongoDB connection

---

**Version**: 1.0  
**Last Updated**: March 2026  
**Author**: GitHub Copilot
