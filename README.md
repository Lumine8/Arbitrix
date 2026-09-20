# ARBITRIX — Technical Analysis Auto-Trading System

![logo of the project](./public/logo.png)

### Algorithmic Paper Trading for NSE Stocks | EMA · RSI · MACD · Bollinger · Stochastic · Volume

---

## Table of Contents

1. [What is ARBITRIX?](#what-is-arbitrix)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Running the Application](#running-the-application)
8. [Project Structure](#project-structure)
9. [Core Algorithms](#core-algorithms)
10. [Accounting Model](#accounting-model)
11. [API Documentation](#api-documentation)
12. [Usage Guide](#usage-guide)
13. [Troubleshooting](#troubleshooting)
14. [Security](#security)

---

## What is ARBITRIX?

**ARBITRIX** is a paper-trading simulator for NSE (Indian) stocks that combines multiple technical indicators into a composite signal to generate automated BUY/SELL recommendations.

### How it works:

1. **Data ingestion** — Fetches OHLCV candles from Yahoo Finance via a backend proxy
2. **Technical analysis** — Calculates RSI, MACD, EMA trends, Bollinger Bands, Stochastic, Volume, and ATR
3. **Signal generation** — Weighted composite score from all indicators
4. **Trade execution** — Paper trades executed in three modes: Full-AI, Semi-AI, or Manual
5. **Ledger-based accounting** — Immutable fill records, weighted-average cost basis, append-only cash ledger
6. **Learning** — Adapts indicator weights based on trade outcomes (minimum 10 evaluations)

---

## Key Features

### Trading

- **Paper Trading** — Simulate trades without real capital, ledger-based accounting
- **Auto-Scanning** — Continuously scan 50+ NSE stocks
- **Three Trading Modes:**
  - **FULL-AI** — Automatic execution, no confirmation needed
  - **SEMI-AI** — AI suggests, you confirm each trade
  - **MANUAL** — Analysis only, you decide everything
- **Stop-Loss** — Auto-sell at configurable loss threshold (default -5%)
- **Real-time Charts** — Interactive price charts with EMA, Bollinger Bands, and signals
- **Idempotency Keys** — Duplicate order protection for concurrent requests

### Intelligence

- **6 Standard Indicators** — RSI, MACD, EMA (9/21/50), Bollinger Bands, Stochastic, Volume
- **Weighted Composite** — Each indicator scored and weighted for a single confidence score
- **Confidence Thresholds** — Only trades when composite signal exceeds threshold
- **Adaptive Learning** — Indicator weights adjusted based on trade outcomes with minimum sample threshold

### Dashboard

- **Watchlist Panel** — Stock list with live prices, signal badges, and SIM data indicator
- **Chart Panel** — Price visualization with overlays
- **Holdings Panel** — Positions, P&L, and trade history
- **Settings Panel** — Toggle auto-trading, confirmations, stop-loss
- **Toast Notifications** — Bottom-right trade alerts
- **Auth** — Login/register in Setup screen, JWT-based session persistence

---

## Technology Stack

### Frontend

- **React 18** — UI framework
- **Vite** — Build tool and dev server (code-split, lazy-loaded panels)
- **Recharts** — Interactive charting

### Backend

- **Node.js 18+** — Runtime
- **Express.js** — Web framework
- **MongoDB** — Database (users, orders, executions, positions, cash ledger)
- **Mongoose** — MongoDB ODM
- **JWT** — Authentication (required at startup)
- **bcryptjs** — Password hashing
- **Helmet** — Security headers

### Data

- **Yahoo Finance API** — Stock price data (via backend proxy, mock fallback flagged in UI)

---

## Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org))
- **npm 8+** (comes with Node.js)
- **Git**
- **MongoDB** (local or Atlas cloud)

---

## Installation

```bash
# Clone
git clone <repository-url>
cd arbitrix

# Install frontend
npm install

# Install backend
cd server
npm install
cd ..
```

---

## Configuration

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/arbitrix
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
```

- `JWT_SECRET` — **Required.** Server refuses to start without it.
- `CORS_ORIGIN` — Comma-separated allowed origins (defaults to `localhost:3000,localhost:5173`).
- For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

---

## Running the Application

**Terminal 1 — Backend:**

```bash
cd server
npm start
```

**Terminal 2 — Frontend:**

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Project Structure

```
arbitrix/
├── README.md
├── package.json
├── vite.config.js
├── index.html
├── DEPLOY.bat / DEPLOY.sh
│
├── public/
│   └── logo.png
│
├── server/
│   ├── index.js              ← Express server + API routes + auth + helmet
│   ├── package.json
│   ├── .env                  ← MONGODB_URI, JWT_SECRET, PORT, CORS_ORIGIN
│   ├── validate.js           ← Module validation script
│   ├── models.js             ← MongoDB schemas (10 models)
│   ├── decisionEngine.js     ← Decision logging, trade evaluation, paper trading engine
│   ├── learningEngine.js     ← Adaptive weight learning
│   └── reportEngine.js       ← Market context & report generation
│
└── src/
    ├── main.jsx
    ├── App.jsx               ← State management, refs sync, auto-trading engine
    │
    ├── lib/
    │   ├── constants.js      ← Config: stocks, indicators, params
    │   ├── ta.js             ← Technical analysis (EMA, RSI, MACD, BB, Stochastic, ATR)
    │   ├── analyze.js        ← Composite signal engine (accepts optional param overrides)
    │   ├── fetch.js          ← Yahoo Finance data fetching (with mock fallback)
    │   └── trading.js        ← Trading modes, auth API, backend integration
    │
    └── components/
        ├── UI.jsx
        ├── Setup.jsx         ← Launch screen with auth + capital input
        ├── WatchlistPanel.jsx
        ├── TradingPanel.jsx
        ├── HoldingsPanel.jsx
        ├── PriceChart.jsx
        ├── SettingsPanel.jsx
        └── ConfirmModal.jsx
```

---

## Core Algorithms

### Technical Indicators

| Indicator | Purpose | Period |
|-----------|---------|--------|
| **EMA** | Trend direction (9/21/50) | Short/Medium/Long |
| **RSI** | Momentum / overbought-oversold | 14 |
| **MACD** | Momentum reversal signals | 12/26/9 |
| **Bollinger Bands** | Volatility & support/resistance | 20, 2σ |
| **Stochastic** | Overbought/oversold + crossover | 14, 3 |
| **ATR** | Volatility measure | 14 |
| **Volume** | Strength of price action | Relative |

### Composite Signal

Each indicator produces a score from -1 (bearish) to +1 (bullish):

```
composite = 0.24 × trend_score
          + 0.17 × rsi_score
          + 0.20 × macd_score
          + 0.14 × bb_score
          + 0.10 × vol_score
          + 0.15 × stoch_score
```

- **composite > 0.10** → BUY
- **composite < -0.10** → SELL
- **otherwise** → HOLD

### Adaptive Learning

The system tracks trade outcomes per indicator and adjusts weights:

- Minimum 10 evaluations required before adaptation
- Indicators that contributed to winners → weight increases
- Indicators that contributed to losers → weight decreases
- Weight change clamped to ±0.05 per cycle
- Weights normalized to sum to 1.0 after each cycle
- Per-indicator attribution based on actual signal component scores

---

## Accounting Model

ARBITRIX uses a **ledger-based fill accounting** system for paper trading.

### Long-Only Positions

- `BUY` opens or increases a position (weighted-average cost basis)
- `SELL` reduces or closes an existing position
- SELL is rejected if position quantity is insufficient

### Core Entities

| Entity | Purpose |
|--------|---------|
| **Order** | User/strategy intent with idempotency key |
| **Execution** | Immutable fill record (source of truth) |
| **Position** | Aggregate position per user+symbol |
| **CashEntry** | Append-only cash ledger |

### Cost Basis

- **Buy commission** (0.05%) added to cost basis
- **Sell commission** (0.05%) subtracted from proceeds
- Slippage simulated at 0.1%-0.3% and stored in execution record

### Cash Balance

Derived from the append-only `cash_entries` collection. The last entry's `balanceAfter` is the current balance.

---

## API Documentation

All protected endpoints require `Authorization: Bearer <token>` header.
User ID is derived from the JWT token — never accepted from client input.

### Auth

```
POST /api/auth/register    { username, email, password, capital }
POST /api/auth/login       { email, password }
GET  /api/auth/me          (Bearer token)
```

### Stock Data

```
GET /api/stock/:symbol     → Yahoo Finance chart data (public)
```

### Paper Trading

```
POST /api/trades/init                { initialCash }           — Initialize account
POST /api/trades/execute             { sessionId, type, stock, qty, price, idempotencyKey? }
POST /api/trades/close/:tradeId      { exit_price }
GET  /api/trades/history/:sessionId  → Execution history
GET  /api/trades/metrics/:sessionId  → Portfolio metrics (cash, positions, P&L)
```

### Decision Logging

```
POST /api/decisions/log              { sessionId, ...decisionData }
GET  /api/decisions/history/:sessionId
```

### Trade Evaluation

```
POST /api/trades/evaluate            { sessionId, ...evalData }
GET  /api/trades/accuracy/:sessionId
```

### Learning

```
POST /api/learning/initialize/:userId   { sessionId }
POST /api/learning/adapt/:userId        { sessionId, lookbackWindow }
GET  /api/learning/parameters/:userId
GET  /api/learning/progress/:userId
GET  /api/learning/regime-insights/:userId
```

### Market Context

```
GET  /api/context/market
GET  /api/context/volatility-multiplier/:vix
POST /api/context/interpret          { context }
```

### Reports

```
POST /api/reports/trade              { sessionId, decisionLogId }
POST /api/reports/session            { sessionId }
GET  /api/reports/:reportId
```

---

## Usage Guide

### Full-AI Mode

1. Go to Settings → set AI Control Mode to "Full AI"
2. Click "Start Scan"
3. System scans stocks, generates signals, and executes trades automatically
4. Monitor holdings in the right panel

### Semi-AI Mode

1. Set mode to "Semi-AI"
2. System suggests trades with reasoning
3. Review the confirmation modal and click "Confirm" or "Skip"

### Manual Mode

1. Set mode to "Manual"
2. Browse the watchlist for signals
3. Manually decide which trades to take

---

## Troubleshooting

**Backend won't start:**
- Check `node --version` (needs 18+)
- Verify `JWT_SECRET` is set in `.env` (server refuses to start without it)
- Verify `MONGODB_URI` in `.env`
- Ensure MongoDB is running

**Frontend won't start:**
- Run `npm install` in root
- Check port 3000 isn't in use

**Stocks not loading:**
- Yahoo Finance may be rate-limited
- Check backend logs for fetch errors
- SIM badge on watchlist indicates mock data (auto-trading disabled for mock)

---

## Security

- `.env` files are gitignored (never commit secrets)
- `JWT_SECRET` required at startup — no fallback
- JWT authentication on all protected endpoints
- `requireAuth` middleware derives userId from token (never from client)
- bcrypt password hashing (pre-save hook)
- Helmet security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- CORS allowlist from environment variable
- Input validation on auth and trade endpoints
- Idempotency keys prevent duplicate trade executions
- Mock data flagged in UI, auto-execution blocked for mock data

---

## Disclaimer

**Paper trades only. Not financial advice. Educational use.**

This system uses algorithmic signals that are not guaranteed to be profitable. Never trade real money based solely on algorithmic signals.

---

**Version:** 4.1.0
**Last Updated:** September 2026
