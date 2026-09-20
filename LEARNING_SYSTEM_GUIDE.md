# ARBITRIX Learning System Guide

## Overview

ARBITRIX includes an adaptive learning system that adjusts technical indicator weights based on trade outcomes. This document covers the learning engine, decision logging, and trade evaluation systems.

---

## Architecture

### Core Components

1. **Paper Trading Engine** — Simulates trades with realistic slippage
2. **Decision Logging** — Records every trade decision with full context
3. **Trade Evaluation** — Assesses prediction accuracy after execution
4. **Learning Engine** — Adapts indicator weights based on outcomes
5. **Market Context Engine** — Detects volatility and market conditions
6. **Report Generator** — Creates trade and session reports

---

## Database Collections

### decision_logs
```javascript
{
  userId: String,
  sessionId: String,
  timestamp: Date,
  stock: String,
  features: { RSI, MACD, EMA_9, EMA_21, EMA_50, BB_position, volume_ratio, ATR },
  decision: "BUY|SELL|HOLD",
  confidence: Number,
  reasoning: String
}
```

### trade_evaluations
```javascript
{
  userId: String,
  decisionLogId: ObjectId,
  direction_correct: Boolean,
  price_error_pct: Number,
  should_increase_weight: [String],
  should_decrease_weight: [String]
}
```

### learned_parameters
```javascript
{
  userId: String,
  indicator_weights: {
    EMA_TREND_WEIGHT: { value, iterations, performance },
    RSI_WEIGHT: { value, iterations, performance },
    MACD_WEIGHT: { value, iterations, performance },
    BB_WEIGHT: { value, iterations, performance },
    VOL_WEIGHT: { value, iterations, performance }
  }
}
```

### paper_trades
```javascript
{
  userId: String,
  tradeId: String,
  type: "BUY|SELL",
  stock: String,
  qty: Number,
  entry_price: Number,
  exit_price: Number,
  net_pnl: Number,
  status: "OPEN|CLOSED"
}
```

---

## API Endpoints

### Decision Logging
```
POST /api/decisions/log
GET  /api/decisions/history/:userId/:sessionId
```

### Trade Evaluation
```
POST /api/trades/evaluate
GET  /api/trades/accuracy/:userId/:sessionId
```

### Paper Trading
```
POST /api/trades/execute
POST /api/trades/close/:tradeId
GET  /api/trades/history/:userId/:sessionId
GET  /api/trades/metrics/:userId/:sessionId
```

### Learning
```
POST /api/learning/initialize/:userId
POST /api/learning/adapt/:userId
GET  /api/learning/parameters/:userId
GET  /api/learning/progress/:userId
```

### Market Context
```
GET  /api/context/market
GET  /api/context/volatility-multiplier/:vixLevel
POST /api/context/interpret
```

### Reports
```
POST /api/reports/trade
POST /api/reports/session
GET  /api/reports/:reportId
```

---

## Learning Process

### Adaptation Cycle

1. **Collect** — Log every trade decision with indicator values
2. **Evaluate** — After N candles, check if direction was correct
3. **Score** — Determine which indicators helped vs. hurt
4. **Adjust** — Increase weight of accurate indicators, decrease others
5. **Persist** — Store updated weights in MongoDB

### Example Flow

```javascript
// 1. Initialize learning for a user
await POST /api/learning/initialize/:userId

// 2. Log a decision
await POST /api/decisions/log {
  stock: "RELIANCE.NS",
  decision: "BUY",
  confidence: 72,
  features: { RSI: 65, MACD: 2.1, ... }
}

// 3. Execute paper trade
await POST /api/trades/execute {
  type: "BUY", stock: "RELIANCE.NS", qty: 10, price: 2500
}

// 4. After outcome is known, evaluate
await POST /api/trades/evaluate {
  decisionLogId: "...",
  direction_correct: true,
  price_error_pct: 1.2
}

// 5. Run adaptation
await POST /api/learning/adapt/:userId { lookbackWindow: 20 }

// 6. Check progress
await GET /api/learning/progress/:userId
```

---

## Trading Modes

| Mode | Behavior |
|------|----------|
| **FULL-AI** | Automatic execution, no confirmation |
| **SEMI-AI** | AI suggests, user confirms each trade |
| **MANUAL** | Analysis only, user decides everything |

---

## Risk Management

- **Stop-Loss** — Configurable auto-sell at loss threshold (default -5%)
- **Position Limits** — Max 30% of portfolio per trade
- **Confidence Threshold** — Only trades when composite signal exceeds threshold

---

## Monitoring

### Key Metrics
- **Win Rate** — % of profitable trades
- **Directional Accuracy** — % of correct UP/DOWN predictions
- **Sharpe Ratio** — Risk-adjusted returns
- **Max Drawdown** — Largest peak-to-trough decline

### Dashboard
- Watchlist panel shows live signals
- Holdings panel tracks P&L
- Trade history shows past decisions

---

**Version:** 2.0  
**Last Updated:** September 2026
