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
10. [API Documentation](#api-documentation)
11. [Usage Guide](#usage-guide)
12. [Troubleshooting](#troubleshooting)
13. [Security](#security)

---

## What is ARBITRIX?

**ARBITRIX** is a paper-trading simulator for NSE (Indian) stocks that combines multiple technical indicators into a composite signal to generate automated BUY/SELL recommendations.

### How it works:

1. **Data ingestion** — Fetches OHLCV candles from Yahoo Finance via a backend proxy
2. **Technical analysis** — Calculates RSI, MACD, EMA trends, Bollinger Bands, Stochastic, Volume, and ATR
3. **Signal generation** — Weighted composite score from all indicators
4. **Trade execution** — Paper trades executed in three modes: Full-AI, Semi-AI, or Manual
5. **Learning** — Adapts indicator weights based on trade outcomes

---

## Key Features

### Trading

- **Paper Trading** — Simulate trades without real capital
- **Auto-Scanning** — Continuously scan 50+ NSE stocks
- **Three Trading Modes:**
  - **FULL-AI** — Automatic execution, no confirmation needed
  - **SEMI-AI** — AI suggests, you confirm each trade
  - **MANUAL** — Analysis only, you decide everything
- **Stop-Loss** — Auto-sell at configurable loss threshold (default -5%)
- **Real-time Charts** — Interactive price charts with EMA, Bollinger Bands, and signals

### Intelligence

- **6 Standard Indicators** — RSI, MACD, EMA (9/21/50), Bollinger Bands, Stochastic, Volume
- **Weighted Composite** — Each indicator scored and weighted for a single confidence score
- **Confidence Thresholds** — Only trades when composite signal exceeds threshold
- **Adaptive Learning** — Indicator weights adjusted based on trade outcomes

### Dashboard

- **Watchlist Panel** — Stock list with live prices and signal badges
- **Chart Panel** — Price visualization with overlays
- **Holdings Panel** — Positions, P&L, and trade history
- **Settings Panel** — Toggle auto-trading, confirmations, stop-loss
- **Toast Notifications** — Bottom-right trade alerts

---

## Technology Stack

### Frontend

- **React 18** — UI framework
- **Vite** — Build tool and dev server
- **Recharts** — Interactive charting

### Backend

- **Node.js 18+** — Runtime
- **Express.js** — Web framework
- **MongoDB** — Database (users, trades, logs)
- **Mongoose** — MongoDB ODM
- **JWT** — Authentication
- **bcryptjs** — Password hashing

### Data

- **Yahoo Finance API** — Stock price data (via backend proxy)

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
JWT_SECRET=your-secret-key
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

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
│   ├── index.js              ← Express server + API routes
│   ├── package.json
│   ├── .env
│   ├── validate.js           ← Module validation script
│   ├── models.js             ← MongoDB schemas
│   ├── decisionEngine.js     ← Decision logging & trade evaluation
│   ├── learningEngine.js     ← Adaptive weight learning
│   └── reportEngine.js       ← Market context & report generation
│
└── src/
    ├── main.jsx
    ├── App.jsx
    │
    ├── lib/
    │   ├── constants.js      ← Config: stocks, indicators, params
    │   ├── ta.js             ← Technical analysis (EMA, RSI, MACD, BB, Stochastic)
    │   ├── analyze.js        ← Composite signal engine
    │   ├── fetch.js          ← Yahoo Finance data fetching
    │   └── trading.js        ← Trading modes & API integration
    │
    └── components/
        ├── UI.jsx
        ├── Setup.jsx
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

- **composite > threshold** → BUY
- **composite < -threshold** → SELL
- **otherwise** → HOLD

### Adaptive Learning

The system tracks trade outcomes per indicator and adjusts weights:

- Indicators that predicted winners → weight increases
- Indicators that predicted losers → weight decreases
- Weights are normalized and clamped to prevent extreme values

---

## API Documentation

### Stock Data

```
GET /api/stock/:symbol
→ Yahoo Finance chart data
```

### Auth

```
POST /api/auth/register    { username, email, password, capital }
POST /api/auth/login       { email, password }
GET  /api/auth/me          (Bearer token)
```

### Decision Logging

```
POST /api/decisions/log              Log a trade decision
GET  /api/decisions/history/:uid/:sid  Get decision history
```

### Trade Evaluation

```
POST /api/trades/evaluate            Evaluate a completed trade
GET  /api/trades/accuracy/:uid/:sid  Get accuracy stats
```

### Paper Trading

```
POST /api/trades/execute             Execute a paper trade
POST /api/trades/close/:tradeId      Close a trade
GET  /api/trades/history/:uid/:sid   Get trade history
GET  /api/trades/metrics/:uid/:sid   Get portfolio metrics
```

### Learning

```
POST /api/learning/initialize/:uid   Initialize learning params
POST /api/learning/adapt/:uid        Run adaptation cycle
GET  /api/learning/parameters/:uid   Get current params
GET  /api/learning/progress/:uid     Get learning progress
```

### Market Context

```
GET  /api/context/market             Get market context
GET  /api/context/volatility-multiplier/:vix
POST /api/context/interpret          Interpret context
```

### Reports

```
POST /api/reports/trade              Generate trade report
POST /api/reports/session            Generate session report
GET  /api/reports/:reportId          Get a report
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
- Verify `MONGODB_URI` in `.env`
- Ensure MongoDB is running

**Frontend won't start:**
- Run `npm install` in root
- Check port 3000 isn't in use

**Stocks not loading:**
- Yahoo Finance may be rate-limited
- Check backend logs for fetch errors

---

## Security

- `.env` files are gitignored (never commit secrets)
- JWT authentication for all protected endpoints
- bcrypt password hashing
- CORS enabled for local development
- No API keys required for core functionality

---

## Disclaimer

**Paper trades only. Not financial advice. Educational use.**

This system uses algorithmic signals that are not guaranteed to be profitable. Never trade real money based solely on algorithmic signals.

---

**Version:** 3.0.0  
**Last Updated:** September 2026
