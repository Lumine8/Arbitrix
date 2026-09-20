# ARBITRIX Architecture

## System Overview

ARBITRIX is a paper-trading platform with a React frontend and Node.js/Express backend.

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React 18 + Vite + Recharts                     │
│                                                  │
│  App.jsx                                         │
│    ├── Setup.jsx         (welcome/mode select)   │
│    ├── WatchlistPanel.jsx (stock list + signals) │
│    ├── TradingPanel.jsx  (chart + indicators)    │
│    ├── HoldingsPanel.jsx (positions + P&L)       │
│    ├── PriceChart.jsx    (Recharts viz)          │
│    ├── SettingsPanel.jsx (config toggles)        │
│    └── ConfirmModal.jsx  (trade confirmation)    │
└──────────────────────┬──────────────────────────┘
                       │ Vite proxy (/api → :5000)
┌──────────────────────▼──────────────────────────┐
│                   BACKEND                        │
│  Express.js + MongoDB                            │
│                                                  │
│  index.js              (server + API routes)     │
│  decisionEngine.js     (logging + evaluation)    │
│  learningEngine.js     (weight adaptation)       │
│  reportEngine.js       (context + reports)       │
│  models.js             (Mongoose schemas)        │
└──────────────────────────────────────────────────┘
```

## Data Flow

```
1. Yahoo Finance API
   ↓
2. Backend proxy (/api/stock/:symbol)
   ↓
3. Frontend: ta.js calculates indicators
   ↓ RSI, MACD, EMA, Bollinger, Volume, ATR
4. Frontend: analyze.js produces composite signal
   ↓ Weighted sum of indicator scores
5. Trading logic decides: BUY / SELL / HOLD
   ↓ Based on confidence threshold
6. Execution (auto or manual based on mode)
   ↓
7. Backend: log decision → evaluate → adapt weights
```

## Core Modules

### Frontend (`src/lib/`)

| Module | Purpose |
|--------|---------|
| `constants.js` | Stock watchlist, indicator params, trading config |
| `ta.js` | Pure technical analysis functions (EMA, RSI, MACD, BB, ATR) |
| `analyze.js` | Combines indicators into composite signal with confidence |
| `fetch.js` | Fetches stock data from Yahoo Finance via backend proxy |
| `trading.js` | Trading modes, backend API calls, decision logging |

### Backend (`server/`)

| Module | Purpose |
|--------|---------|
| `index.js` | Express server, all API routes, Yahoo Finance proxy |
| `decisionEngine.js` | DecisionLogger, TradeEvaluator, PaperTradingEngine |
| `learningEngine.js` | Adaptive parameter learning from trade outcomes |
| `reportEngine.js` | ContextEngine (market context), ReportGenerator |
| `models.js` | Mongoose schemas for all collections |

## Database Collections

- **decision_logs** — Every trading decision with full context
- **trade_evaluations** — Post-trade accuracy assessments
- **learned_parameters** — Adapted indicator weights per user
- **paper_trades** — Simulated trades with P&L
- **portfolio_snapshots** — Daily portfolio state
- **system_reports** — Generated reports

## Trading Modes

| Mode | Auto-Execute | Confirmation | Use Case |
|------|-------------|-------------|----------|
| **FULL-AI** | Yes | No | Autonomous trading |
| **SEMI-AI** | No | Yes | AI suggests, user approves |
| **MANUAL** | No | No | Analysis only |

## Signal Pipeline

```
Stock price data
    ↓
RSI(14)        → score ∈ [-1, +1]
MACD(12,26,9)  → score ∈ [-1, +1]
EMA crossover   → score ∈ [-1, +1]
Bollinger Band  → score ∈ [-1, +1]
Volume          → score ∈ [-1, +1]
    ↓
composite = Σ(weight_i × score_i)
    ↓
composite > threshold  → BUY
composite < -threshold → SELL
else                   → HOLD
```
