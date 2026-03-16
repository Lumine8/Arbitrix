# ARBITRIX — NSE AI Trader
### PIEC · RLFS · S-ADR Auto-Trading System

---

## What is ARBITRIX?

ARBITRIX is a paper-trading simulator for NSE (Indian) stocks, powered by three proprietary algorithms:

- **PIEC** (Physical Integrity Entropy Consensus) — measures market entropy (how directional vs random price moves are) and uses it to attenuate signal strength in chaotic regimes
- **RLFS** (Representation Learning Feature Stability) — tracks drift in the indicator feature vector over time; detects when your signals have shifted regime before you lose money
- **S-ADR** (Stability-Adaptive Degradation Response) — maps RLFS drift to position sizing (ω): full size in STABLE regime, scaled down in DEGRADED, no trade in REJECTED

Combined with RSI, MACD, EMA trend, Bollinger Bands, and volume analysis — plus Claude AI explanations for every trade.

---

## Project Structure

```
arbitrix/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx          # React entry point
    ├── App.jsx           # Main app: state, auto-scan engine, wiring
    ├── lib/
    │   ├── constants.js  # Design tokens, stock universe, helpers
    │   ├── ta.js         # Technical analysis: EMA, RSI, MACD, Bollinger, ATR
    │   ├── piec.js       # PIEC entropy + RLFS monitor + S-ADR
    │   ├── analyze.js    # Full stock analysis combining TA + PIEC
    │   ├── fetch.js      # Yahoo Finance data fetcher (with mock fallback)
    │   └── ai.js         # Claude API integration for trade reasoning
    └── components/
        ├── Setup.jsx         # Launch screen
        ├── WatchlistPanel.jsx # Left column: stock list + scan status
        ├── TradingPanel.jsx   # Centre: chart, signals, PIEC tab, buy/sell
        ├── HoldingsPanel.jsx  # Right: holdings + trade log
        ├── PriceChart.jsx     # Recharts price + EMA + Bollinger + forecast
        ├── ConfirmModal.jsx   # Auto-trade confirmation with AI reasoning
        ├── SettingsPanel.jsx  # Settings toggles
        └── UI.jsx             # Shared: badges, bars, toasts, spinners
```

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Build for production
```bash
npm run build
# Output in /dist — serve with any static host
```

---

## Features

| Feature | Description |
|---------|-------------|
| Auto BUY/SELL | Scans every 30s, queues trades based on PIEC signals |
| Confirm dialog | Full PIEC breakdown + AI reasoning before each trade |
| Full auto mode | Disable confirmations with ⚡ AUTO ALL |
| Per-direction toggles | Confirm buys but auto-sell (or vice versa) |
| Stop-loss auto | Sells any position that drops 5% below avg buy price |
| AI pick reasoning | Claude explains why these stocks suit your budget |
| AI trade notes | Every manual trade gets a 3-sentence coaching note |
| PIEC tab | Live entropy gauge, RLFS score, drift, ω sizing, return distribution |
| Signals tab | Component breakdown with weights |
| Price chart | Historical + EMA21/50 + Bollinger + 10-day forecast |
| Real NSE data | Yahoo Finance via CORS proxy (mock fallback if blocked) |
| Toast notifications | Bottom-right trade alerts |
| Portfolio analytics | Holdings P&L, unrealised returns, stop-loss warnings |

---

## Settings

Access via ⚙ in the top bar:

- **Auto-Trading Engine** — on/off master switch
- **Confirm Before BUY** — popup before each auto-buy
- **Confirm Before SELL** — popup before each auto-sell  
- **Show AI Reasoning** — calls Claude API for "why this stock"
- **Auto Stop-Loss (−5%)** — auto-sell at 5% loss
- **Toast Notifications** — bottom-right alerts

---

## PIEC Algorithm Notes

### Entropy Calculation
Shannon entropy over K=8 directional bins of 30-day returns, normalised to [0, 1].
- Entropy = 0 → pure trend (all moves in one direction) → full signal weight
- Entropy = 1 → pure chaos (uniform distribution) → 40% signal attenuation

### RLFS Monitor
Feature vector: `[RSI_norm, MACD_norm, BB_position, EMA_spread, Volume_ratio]`
- EWMA drift with β=1.2, γ=0.25
- RLFS score = exp(−β × drift)

### S-ADR Thresholds
- drift ≤ 0.25 → STABLE, ω = 1.0 (full position)
- 0.25 < drift < 0.65 → DEGRADED, ω = linear interpolation
- drift ≥ 0.65 → REJECTED, no trade

---

## Disclaimer

**Paper trades only. Not financial advice. Educational use.**

This system uses algorithmic signals that are not guaranteed to be profitable. The 10-day price prediction is an ensemble of technical indicators — not a crystal ball. Never trade real money based solely on algorithmic signals without understanding the risks.

---

*Built with React + Recharts + Vite + Claude AI*
