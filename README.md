# ARBITRIX — AI-Powered Reinforcement Learning Auto-Trading System

![logo of the project](./public/logo.png)

### 🤖 Next-Gen Paper Trading with Self-Learning AI | PIEC · RLFS · S-ADR · RL

---

## 📋 Table of Contents

1. [What is ARBITRIX?](#what-is-arbitrix)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Prerequisites](#prerequisites)
6. [Installation](#installation)
7. [Configuration](#configuration)
8. [Running the Application](#running-the-application)
9. [Project Structure](#project-structure)
10. [Core Algorithms](#core-algorithms)
11. [Reinforcement Learning System](#reinforcement-learning-system)
12. [API Documentation](#api-documentation)
13. [Usage Guide](#usage-guide)
14. [Troubleshooting](#troubleshooting)
15. [Performance & Monitoring](#performance--monitoring)
16. [Document Index](#document-index)

---

## 🎯 What is ARBITRIX?

**ARBITRIX** is an advanced paper-trading simulator for NSE (Indian) stocks, combining traditional technical analysis with **proprietary algorithmic intelligence** and **self-learning Reinforcement Learning**:

### Core AI Systems:

1. **PIEC** (Physical Integrity Entropy Consensus)  
   → Measures market chaos level and attenuates signals in random/unstable periods

2. **RLFS** (Representation Learning Feature Stability)  
   → Detects when your trading signals have drifted into a new market regime

3. **S-ADR** (Stability-Adaptive Degradation Response)  
   → Adjusts position sizing automatically based on RLFS drift signals

4. **🆕 RL Engine** (Reinforcement Learning)  
   → Self-learning neural network that improves trading decisions over time, trained on real outcomes

### Integration:

- RSI, MACD, EMA Trends, Bollinger Bands, Volume Analysis
- Claude AI explanations for every trade decision
- Real-time learning based on actual trade outcomes
- Model persistence (save/load trained weights)

---

## ✨ Key Features

### Trading Features

✅ **Paper Trading** — Simulate trades without real capital  
✅ **Auto-Scanning** — Continuously scan 50+ NSE stocks  
✅ **Manual Override** — Take control when you want  
✅ **Real-time Charts** — Interactive price charts with technical indicators  
✅ **Holdings Dashboard** — Track positions, P&L, and trade history  
✅ **Multi-Mode Trading:**

- **FULL-AI** — Let the system trade automatically
- **SEMI-AI** — Get suggestions, approve manually
- **MANUAL** — You decide everything

### Intelligence Features

✅ **Technical Analysis** — 5 standard indicators pre-calculated  
✅ **Entropy Detection** — PIEC identifies market chaos  
✅ **Drift Detection** — RLFS warns of regime changes  
✅ **Adaptive Positioning** — S-ADR scales position size intelligently  
✅ **AI Reasoning** — Claude explains every trade decision

### Learning Features (NEW!)

✅ **Neural Network Policy** — TensorFlow.js-powered decision maker  
✅ **Epsilon-Greedy Exploration** — Balances trying new strategies vs proven ones  
✅ **Reward Engine** — Multi-component reward for effective learning signals  
✅ **Experience Replay** — Learns from past trades (10K trade history buffer)  
✅ **Auto-Training** — Trains on every 20 trades  
✅ **Model Persistence** — Save trained weights and resume learning  
✅ **Learning Curve Tracking** — Monitor loss decrease over time

### Safety & Reliability

✅ **Graceful Fallback** — Reverts to traditional signals if RL fails  
✅ **Input Validation** — All data sanitized before processing  
✅ **Error Handling** — Comprehensive logging and recovery  
✅ **NaN Protection** — Handles invalid/missing data cleanly  
✅ **Circuit Breaker** — Stops trading if signals become unreliable

---

## 💻 Technology Stack

### Frontend

- **React 18** — UI framework
- **Vite** — Lightning-fast build tool
- **Recharts** — Interactive charting
- **TensorFlow.js** — In-browser model inference (optional)

### Backend

- **Node.js 18+** — JavaScript runtime
- **Express.js** — Web framework
- **MongoDB** — NoSQL database (users, trades, models)
- **Mongoose** — MongoDB ODM
- **TensorFlow.js** — Neural network training & inference
- **TensorFlow.js-node** — GPU acceleration support
- **JWT** — Authentication
- **bcryptjs** — Password hashing

### Data Sources

- **Yahoo Finance API** — Stock price data via Vite proxy
- **Anthropic Claude API** — AI trade reasoning

### Development

- **Nodemon** — Auto-restart backend on changes
- **Dotenv** — Environment configuration

---

## 🏗️ System Architecture

### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      ARBITRIX TRADING PIPELINE              │
└─────────────────────────────────────────────────────────────┘

1. DATA INGESTION
   ├─ Yahoo Finance API (via proxy)
   └─ Returns: OHLCV candles (Open, High, Low, Close, Volume)

2. TECHNICAL ANALYSIS
   ├─ RSI (Relative Strength Index)
   ├─ MACD (Moving Average Convergence Divergence)
   ├─ EMA (Exponential Moving Average)
   ├─ Bollinger Bands
   └─ Volume & ATR

3. STATE VECTOR CREATION (12 elements)
   ├─ RSI value (normalized)
   ├─ MACD value (normalized)
   ├─ Bollinger Band position
   ├─ EMA spread
   ├─ Volume magnitude
   ├─ Market entropy (PIEC)
   ├─ Feature stability (RLFS)
   ├─ Signal drift
   ├─ Volatility
   ├─ Sentiment (AI)
   ├─ Current position
   └─ Unrealized P&L

4. SIGNAL GENERATION
   ├─ Traditional: TA + PIEC + RLFS + S-ADR
   └─ RL: Neural network policy (12 inputs → 3 actions)

5. ACTION SELECTION
   ├─ Blend traditional confidence with RL confidence
   ├─ Epsilon-greedy: explore vs exploit
   └─ S-ADR position sizing: 100%, 50%, 0%, or opposite

6. TRADE EXECUTION
   ├─ Paper trade on simulated holdings
   ├─ Record to MongoDB
   └─ AI explains reasoning

7. LEARNING FEEDBACK
   ├─ Calculate multi-component reward
   ├─ Store in experience replay buffer
   ├─ Train every 20 trades
   ├─ Update neural network weights
   └─ Persist model every 100 training cycles

8. MONITORING & METRICS
   ├─ Learning curve (loss, accuracy)
   ├─ Win rate and P&L
   ├─ Exploration decay tracking
   └─ Signal reliability scores
```

---

## 📦 Prerequisites

### Required

- **Node.js 18+** ([Download here](https://nodejs.org))
- **npm 8+** (comes with Node.js)
- **Git** (for version control)

### Optional

- **MongoDB Server** (local) OR **MongoDB Atlas** (cloud—recommended for beginners)
- **Anthropic API Key** ([Get free credits](https://console.anthropic.com))
- **Visual Studio Code** (recommended editor)
- **Postman** (for testing API endpoints)

### System Requirements

- **RAM**: 2GB minimum, 4GB+ recommended
- **Disk**: 500MB free space
- **Network**: Stable internet connection

### Verify Installation

```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 8.0.0 or higher
```

---

## 🚀 Installation

### Step 1: Clone or Download Repository

```bash
# If using git
git clone <repository-url>
cd arbitrix

# Or manually download and extract ZIP file
cd arbitrix
```

### Step 2: Install Frontend Dependencies

```bash
# Install React, Vite, and other frontend packages
npm install

# This installs from root package.json:
# - react@18.2.0
# - react-dom@18.2.0
# - recharts (charting)
# - vite (build tool)
# - @vitejs/plugin-react
```

### Step 3: Install Backend Dependencies

```bash
# Navigate to server directory
cd server

# Install Node.js packages
npm install

# This installs:
# - express (web server)
# - mongoose (MongoDB connection)
# - @tensorflow/tfjs (RL neural network)
# - @tensorflow/tfjs-node (GPU acceleration)
# - bcryptjs (password hashing)
# - jsonwebtoken (JWT auth)
# - dotenv (environment variables)
# - nodemon (dev auto-refresh)

# Return to root
cd ..
```

### Step 4: Verify Installation

```bash
# Check all packages installed correctly
npm list --depth=0
cd server && npm list --depth=0 && cd ..
```

---

## ⚙️ Configuration

### Step 1: Create Environment File

Create `server/.env` file with your configuration:

```bash
# In the server/ directory:
touch .env

# OR on Windows:
# echo. > .env
```

### Step 2: Add Configuration Variables

```env
# ─────────────────────────────────────────────────────────────
# SERVER CONFIGURATION
# ─────────────────────────────────────────────────────────────

PORT=5000                          # Backend server port
NODE_ENV=development              # development or production

# ─────────────────────────────────────────────────────────────
# DATABASE CONFIGURATION
# ─────────────────────────────────────────────────────────────

# Option A: Local MongoDB (if installed)
MONGODB_URI=mongodb://localhost:27017/arbitrix

# Option B: MongoDB Atlas Cloud (RECOMMENDED)
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create free account
# 3. Create cluster named "arbitrix"
# 4. Copy connection string and replace below
# Keep: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/arbitrix?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/arbitrix?retryWrites=true&w=majority

# ─────────────────────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────────────────────

JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRATION=7d                # Token expiration time

# ─────────────────────────────────────────────────────────────
# ANTHROPIC API (for AI trade explanations)
# ─────────────────────────────────────────────────────────────

# 1. Go to https://console.anthropic.com
# 2. Sign up free
# 3. Create API key
# 4. Copy and paste below
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# ─────────────────────────────────────────────────────────────
# RL CONFIGURATION
# ─────────────────────────────────────────────────────────────

RL_ENABLED=true                   # Enable/disable RL system
RL_TRAINING_INTERVAL=20           # Train after every N trades
RL_BUFFER_SIZE=10000              # Max experiences to remember
RL_BATCH_SIZE=32                  # Trades per training batch
```

### Step 3: Database Setup

#### Option A: MongoDB Atlas (Cloud - Recommended)

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Click "Create a Database"
4. Choose "Shared" (free tier)
5. Select region closest to you
6. Click "Create Cluster"
7. Go to "Database Access" → "Add New Database User"
8. Set username/password
9. Go to "Network Access" → Add your IP (or 0.0.0.0/0 for anywhere)
10. Click "Connect" → "Drivers" → Copy connection string
11. Replace `<username>` and `<password>` in `.env`

#### Option B: Local MongoDB

```bash
# macOS (with Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Windows (Download installer)
# https://www.mongodb.com/try/download/community
# Run installer and follow prompts

# Linux (Ubuntu/Debian)
sudo apt-get install -y mongodb

# Verify MongoDB running
mongo --version
```

---

## ▶️ Running the Application

### Option 1: Quick Start (Easiest)

#### Windows Users:

```bash
# Run automated deployment script
.\DEPLOY.bat

# Follow prompts to create .env and start servers
```

#### Mac/Linux Users:

```bash
# Run automated deployment script
bash DEPLOY.sh

# Follow prompts to create .env and start servers
```

### Option 2: Manual Startup (Step by Step)

#### Terminal 1: Start Backend Server

```bash
cd server

# Development mode (auto-restart on changes)
npm run dev

# OR production mode (faster)
npm start

# You should see:
# ┌─────────────────────────────────────┐
# │ 🚀 ARBITRIX Backend Started         │
# │ 📍 Port: 5000                       │
# │ 🤖 RL Engine: ENABLED               │
# │ 📦 Database: Connected              │
# └─────────────────────────────────────┘
```

✅ **Backend is ready when:**

- No errors in console
- Message says "Database: Connected"
- RL Engine shows as ENABLED

#### Terminal 2: Start Frontend (New Terminal!)

```bash
# Stay in root directory (NOT server/)
npm run dev

# You should see:
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

✅ **Frontend is ready when:**

- Shows local URL (usually http://localhost:5173)
- No red errors in console

#### Terminal 3: Open Application

```bash
# Option 1: Click the URL from Terminal 2
# http://localhost:5173/

# Option 2: Manually open in browser
# 1. Open browser
# 2. Go to http://localhost:5173/
# 3. You should see ARBITRIX dashboard
```

---

## 📁 Project Structure

```
arbitrix/
│
├── 📄 README.md                         ← You are here!
├── 📄 package.json                      ← Frontend dependencies & scripts
├── 📄 vite.config.js                    ← Vite build configuration
├── 📄 index.html                        ← HTML entry point
├── 📄 DEPLOY.bat / DEPLOY.sh            ← Automated setup scripts
├── 📄 RL_IMPLEMENTATION_GUIDE.md        ← RL system technical docs
├── 📄 RL_USAGE_EXAMPLES.js              ← RL code examples
├── 📄 RL_COMPLETION_SUMMARY.md          ← RL project summary
│
├── 📁 public/
│   ├── logo.png                         ← ARBITRIX logo
│   └── index.css                        ← Global styles
│
├── 📁 server/                           ← BACKEND
│   ├── 📄 index.js                      ← Main server (Express)
│   ├── 📄 package.json                  ← Backend dependencies
│   ├── 📄 .env                          ← Environment (create this!)
│   ├── 📄 validate.js                   ← Module validation script
│   ├── 📄 models.js                     ← MongoDB schemas
│   │
│   ├── 📁 rl/                           ← REINFORCEMENT LEARNING ENGINE
│   │   ├── index.js                     ← RLEngine main orchestrator
│   │   ├── policyModel.js               ← Neural network (TensorFlow.js)
│   │   ├── actionSelector.js            ← Epsilon-greedy exploration
│   │   ├── rewardEngine.js              ← Multi-component reward calc
│   │   ├── replayBuffer.js              ← Experience replay (10K buffer)
│   │   ├── trainer.js                   ← Training orchestration
│   │   └── modelStorage.js              ← Save/load trained weights
│   │
│   └── 📁 models/                       ← Saved RL model checkpoints
│       └── (auto-created on first save)
│
└── 📁 src/                              ← FRONTEND
    ├── 📄 main.jsx                      ← React entry point
    ├── 📄 App.jsx                       ← Main app component
    │
    ├── 📁 lib/                          ← BUSINESS LOGIC & ALGORITHMS
    │   ├── constants.js                 ← Config: stocks, indicators, RL params
    │   ├── ta.js                        ← Technical Analysis (EMA, RSI, MACD, etc)
    │   ├── piec.js                      ← Entropy detection (PIEC algorithm)
    │   ├── analyze.js                   ← Full trade analysis engine
    │   ├── fetch.js                     ← Data fetching from Yahoo Finance
    │   ├── ai.js                        ← Claude API integration
    │   ├── stateBuilder.js              ← RL state vector creation
    │   └── rlIntegration.js             ← RL blending with traditional signals
    │
    └── 📁 components/                   ← UI COMPONENTS (React)
        ├── UI.jsx                       ← Shared components (badges, buttons)
        ├── Setup.jsx                    ← Launch/welcome screen
        ├── WatchlistPanel.jsx           ← Left: stock list + scan status
        ├── TradingPanel.jsx             ← Center: chart & signals
        ├── HoldingsPanel.jsx            ← Right: positions & history
        ├── PriceChart.jsx               ← Recharts price visualization
        ├── SettingsPanel.jsx            ← Configuration toggles
        ├── ConfirmModal.jsx             ← Trade confirmation dialog
        └── TradingPanel.jsx             ← Main trading interface

📊 Total Size: ~15MB (after npm install: ~400MB with node_modules)
```

---

## 🧠 Core Algorithms

### 1. Technical Analysis (TA.js)

**Standard indicators** calculated for each stock:

| Indicator           | Purpose                         | Input                     | Output             |
| ------------------- | ------------------------------- | ------------------------- | ------------------ |
| **EMA**             | Trend direction                 | Close prices, period      | Moving average     |
| **RSI**             | Momentum/overbought-oversold    | Close prices, period (14) | 0-100 scale        |
| **MACD**            | Momentum reversal signals       | Close prices              | MACD line + Signal |
| **Bollinger Bands** | Volatility & support/resistance | Close, SMA, std dev       | Upper/Middle/Lower |
| **ATR**             | Volatility measure              | High/Low/Close            | Average True Range |
| **Volume**          | Strength of price action        | Volume data               | Normalized         |

```javascript
// From ta.js
const ema = calculateEMA(closes, 12); // 12-period EMA for short-term
const rsi = calculateRSI(closes, 14); // 14-period RSI
const macd = calculateMACD(closes); // MACD histogram
const bollingerBands = calculateBB(closes); // 3 bands for volatility
const atr = calculateATR(data); // For stop-loss sizing
```

### 2. PIEC - Physical Integrity Entropy Consensus

**Purpose:** Detect market chaos and reduce signal strength during random/unstable periods

**How it works:**

```
1. Calculate price entropy over last 20 candles
   → High entropy = Random, chaotic movement
   → Low entropy = Directional, organized movement

2. Create "consensus score"
   → How much do all indicators agree?
   → If RSI says buy but MACD says sell = low consensus

3. Attenuate signals
   → In high entropy: reduce trade confidence by 30-50%
   → Only trade when market is organized + indicators agree
```

**Output:** Signal confidence multiplier (0.5 to 1.0)

### 3. RLFS - Representation Learning Feature Stability

**Purpose:** Detect when indicator values have shifted into a new regime (drift detection)

**How it works:**

```
1. Track all indicator values over time
2. Calculate KL divergence (statistical distance) between:
   → Current indicators vs historical distribution
3. If distance exceeds threshold = regime change detected
4. Set degradation flag = position sizes reduced
```

**Output:** Drift score (0 to 1), Regime status

### 4. S-ADR - Stability-Adaptive Degradation Response

**Purpose:** Adjust position sizing based on drift signals

**Formula:**

```
If RLFS drift < 0.3:        ω = 1.0  (STABLE - full position)
If 0.3 < drift < 0.6:       ω = 0.5  (DEGRADED - half position)
If drift > 0.6:             ω = 0.0  (REJECTED - no trade)
If trade reverses early:    ω = -1.0 (OPPOSITE - short instead)
```

**Output:** Position sizing multiplier (ω)

---

## 🤖 Reinforcement Learning System (NEW!)

### Overview

The RL Engine is a **self-learning neural network** that improves trading decisions based on actual trade outcomes. It works alongside traditional signals to discover patterns humans might miss.

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              REINFORCEMENT LEARNING PIPELINE                 │
└──────────────────────────────────────────────────────────────┘

MARKET DATA
    ↓
STATE BUILDER (stateBuilder.js)
    ↓ Normalizes 12 features to [-1, 1] range
    ├─ RSI, MACD, Bollinger Bands
    ├─ EMA spread, Volume
    ├─ Entropy (PIEC), Drift (RLFS)
    ├─ Volatility, Sentiment
    ├─ Current position, Unrealized P&L
    ↓
POLICY NETWORK (policyModel.js)
    ├─ Input: 12-element state vector
    ├─ Layer 1: Dense(64, ReLU, Dropout 20%)
    ├─ Layer 2: Dense(32, ReLU, Dropout 20%)
    ├─ Output: 3 actions with confidence scores
    │  ├─ Action 0: BUY  (confidence %)
    │  ├─ Action 1: HOLD (confidence %)
    │  └─ Action 2: SELL (confidence %)
    ↓
ACTION SELECTOR (actionSelector.js)
    ├─ Epsilon-Greedy:
    │  ├─ 90% pick best action
    │  └─ 10% pick random (exploration)
    ├─ Epsilon decays: 0.1 → 0.01 over time
    ↓
S-ADR INTEGRATION
    ├─ RL action × Omega (stability multiplier)
    └─ Example: RL says "SELL" but Omega=0.5 → "SELL half"
    ↓
TRADE EXECUTION
    ↓
OUTCOME LOGGING
    ├─ Trade profit/loss
    ├─ Market movement
    ├─ Execution quality
    ↓
REWARD CALCULATION (rewardEngine.js)
    ├─ Base reward = profit
    ├─ Penalties:
    │  ├─ Drawdown penalty (-0.5 × max loss)
    │  ├─ Entropy penalty (-0.3 × chaos level)
    │  └─ Drift penalty (-0.2 × signal drift)
    ├─ Bonuses:
    │  ├─ Direction bonus (+10 if right direction)
    │  └─ Confidence bonus (if high confidence was right)
    └─ FINAL: Reward = Profit - Penalties + Bonuses
    ↓
EXPERIENCE REPLAY (replayBuffer.js)
    ├─ Store: {state, action, reward, nextState, done}
    ├─ Capacity: 10,000 experiences
    ├─ Strategy: FIFO (oldest experiences deleted when full)
    ↓
TRAINING LOGIC (trainer.js)
    ├─ Trigger: After every 20 trades
    ├─ Process:
    │  1. Sample random batch (32 experiences)
    │  2. Forward pass through network
    │  3. Calculate loss (categorical cross-entropy)
    │  4. Backpropagation (Adam optimizer)
    │  5. Update weights
    │  6. Calculate accuracy
    ├─ Logging: Track loss & accuracy history
    ↓
MODEL STORAGE (modelStorage.js)
    ├─ Checkpoint every 100 training cycles
    ├─ Save: Weights + metadata (timestamp, performance)
    ├─ Load: Resume training from checkpoint
    ├─ Export: Share trained models
    ↓
LEARNING CURVE TRACKING
    ├─ Loss should decrease: 1.2 → 0.8 → 0.5 → ...
    ├─ Accuracy increases: 30% → 45% → 55% → ...
    └─ Indicates: Network learning to predict better actions
```

### Training Process (Step-by-Step)

**Cycle 1: First Trade**

```
1. Build state vector (12 features)
2. RL predicts: [0.7, 0.2, 0.1] → 70% BUY confidence
3. S-ADR checks: "We're stable (Omega=1.0)" → Execute BUY
4. Later: Trade closes with +2% profit
5. Calculate reward: +2% - penalties = +0.8 reward
6. Store in replay buffer: {state₁, BUY, +0.8, state₂, false}
```

**Cycle 20: Trigger Training**

```
1. Accumulate 20 trades and outcomes
2. Create batch: 32 random experiences from 10K buffer
3. Train network:
   - Input 32 states
   - Network predicts actions
   - Compare to actual outcomes
   - Calculate loss: how far were predictions?
   - Backprop: adjust weights to reduce loss
4. Update weights (Adam optimizer, lr=0.001)
5. Track: Loss went from 1.2 → 1.15 (improving!)
```

**Cycle 100: Save Checkpoint**

```
1. After 5 training cycles
2. Save: weights.bin + metadata.json
3. File: ./models/arbitrix_20240324_1234/
4. Later: Can load and resume training
```

**Cycle 500+ (Playing Out)**

```
1. Network now predicts better actions
2. Confidence: Actions become more confident (0.85+ vs 0.7)
3. Performance: Win rate increases, drawdowns decrease
4. Exploration: Epsilon still exploring (1%) to find new strategies
5. Result: System "learns" what works in this market regime
```

### Key Features

| Feature            | Value          | Why                                        |
| ------------------ | -------------- | ------------------------------------------ |
| **Input Size**     | 12             | Market state: indicators + position + risk |
| **Hidden Layers**  | 64→32 neurons  | Sufficient for learning complex patterns   |
| **Output Size**    | 3 actions      | BUY, HOLD, SELL                            |
| **Activation**     | ReLU           | Fast learning                              |
| **Dropout**        | 20%            | Prevents overfitting                       |
| **Optimizer**      | Adam           | Adaptive learning rate                     |
| **Learning Rate**  | 0.001          | Stable training                            |
| **Loss Function**  | Categorical CE | For 3-class classification                 |
| **Epsilon Start**  | 0.1 (10%)      | Lots of exploration                        |
| **Epsilon End**    | 0.01 (1%)      | Mostly exploitation                        |
| **Buffer Size**    | 10,000         | Remember last 10K trades                   |
| **Batch Size**     | 32             | Train on 32 experiences at once            |
| **Train Interval** | 20 trades      | Train frequently enough to learn           |

### Fallback Mechanisms

If RL fails (invalid state, NaN prediction, network error):

```
Auto-Fallback → Use traditional signals (PIEC + RLFS + S-ADR)
Log Error → Record what went wrong for debugging
Continue Trading → No disruption to live system
```

### Viewing Learning Progress

**Dashboard Metrics:**

- **Training Cycles:** How many times network trained (increments by 1 per 20 trades)
- **Current Loss:** How far predictions are from reality (lower = better)
- **Accuracy:** % of actions that were profitable (higher = better)
- **Epsilon:** Current exploration rate (0.1 → 0.01 over time)

**API Endpoints:**

```javascript
// Get current RL stats
GET /api/rl/stats
→ {
    training_cycles: 25,
    current_loss: 0.87,
    accuracy: 62%,
    epsilon: 0.045,
    buffer_size: 520,
    models_saved: 2
  }

// Get learning curve (loss over time)
GET /api/rl/learning-curve
→ [
    { cycle: 1, loss: 1.2, accuracy: 35 },
    { cycle: 2, loss: 1.15, accuracy: 38 },
    { cycle: 3, loss: 1.08, accuracy: 41 },
    ...
  ]

// Save trained model
POST /api/rl/save-model
→ { success: true, model_id: "arbitrix_20240324_1234" }

// Load previous model
POST /api/rl/load-model
{ model_id: "arbitrix_20240324_1234" }
→ { success: true, training_cycles_resumed: 43 }
```

---

## 📡 API Documentation

### Trading APIs

#### Get Stock Analysis

```javascript
POST /api/analyze
Content-Type: application/json

Request:
{
  "symbol": "TCS",
  "interval": "1d"
}

Response:
{
  "symbol": "TCS",
  "price": 3450.50,
  "signals": {
    "rsi": 65,
    "macd": {
      "signal": 45.2,
      "histogram": 2.1
    },
    "ema": 3425.10
  },
  "tradeSignal": "BUY",
  "confidence": 0.78,
  "reason": "RSI > 60 and MACD bullish crossover"
}
```

#### Execute Trade

```javascript
POST /api/trade
Content-Type: application/json

Request:
{
  "symbol": "TCS",
  "action": "BUY",
  "quantity": 5,
  "price": 3450.50
}

Response:
{
  "tradeId": "TRADE_123456",
  "status": "executed",
  "symbol": "TCS",
  "quantity": 5,
  "entryPrice": 3450.50,
  "timestamp": "2024-03-24T10:30:00Z",
  "aiReasoning": "Strong RSI signal + MACD confirmation"
}
```

### RL Engine APIs (NEW!)

#### Get RL Decision

```javascript
POST /api/rl/decide
Content-Type: application/json

Request:
{
  "analysis": {
    // Standard analysis output
  },
  "symbol": "TCS"
}

Response:
{
  "action": 0,              // 0=BUY, 1=HOLD, 2=SELL
  "confidence": [0.72, 0.18, 0.10],  // Probabilities
  "epsilon": 0.047,
  "source": "RL",
  "blended_confidence": 0.78
}
```

#### Process Trade Outcome

```javascript
POST /api/rl/process-outcome
Content-Type: application/json

Request:
{
  "outcome": {
    "profit": 45.50,
    "drawdown": 15.20,
    "duration_minutes": 30,
    "direction_correct": true
  },
  "nextState": { /* 12-element state vector */ }
}

Response:
{
  "reward": 32.45,
  "trained": true,
  "training_cycle": 25,
  "loss": 0.87,
  "accuracy": 0.62
}
```

#### Get RL Statistics

```javascript
GET /api/rl/stats

Response:
{
  "training_cycles": 25,
  "current_loss": 0.87,
  "accuracy": 0.62,
  "epsilon": 0.047,
  "buffer_size": 520,
  "models_saved": 2,
  "avg_reward": 8.3,
  "win_rate": 0.64
}
```

#### Get Learning Curve

```javascript
GET /api/rl/learning-curve?limit=100

Response:
[
  { cycle: 1, loss: 1.2, accuracy: 0.35 },
  { cycle: 2, loss: 1.15, accuracy: 0.38 },
  { cycle: 3, loss: 1.08, accuracy: 0.41 },
  ...
  { cycle: 25, loss: 0.87, accuracy: 0.62 }
]
```

#### Save RL Model

```javascript
POST /api/rl/save-model
Content-Type: application/json

Request:
{
  "model_name": "arbitrix_v1_best_run"
}

Response:
{
  "success": true,
  "model_id": "arbitrix_v1_best_run_20240324",
  "training_cycles": 25,
  "accuracy": 0.62,
  "saved_at": "2024-03-24T14:30:00Z"
}
```

#### Load RL Model

```javascript
POST /api/rl/load-model
Content-Type: application/json

Request:
{
  "model_id": "arbitrix_v1_best_run_20240324"
}

Response:
{
  "success": true,
  "model_id": "arbitrix_v1_best_run_20240324",
  "training_cycles_resumed": 25,
  "accuracy": 0.62,
  "loaded_at": "2024-03-24T14:31:00Z"
}
```

#### List Saved Models

```javascript
GET / api / rl / models;

Response: [
  {
    model_id: "arbitrix_v1_best_run_20240324",
    created_at: "2024-03-24T14:30:00Z",
    training_cycles: 25,
    accuracy: 0.62,
    file_size: "1.2MB",
  },
  {
    model_id: "arbitrix_v2_fresh_20240325",
    created_at: "2024-03-25T09:15:00Z",
    training_cycles: 12,
    accuracy: 0.54,
    file_size: "1.2MB",
  },
];
```

#### Reset RL Engine

```javascript
POST /api/rl/reset

Response:
{
  "success": true,
  "message": "RL Engine reset to initial state",
  "buffer_cleared": true,
  "model_reset": true
}
```

---

## 📖 Usage Guide

### Scenario 1: Paper Trading (Auto-Mode)

1. **Open Dashboard**
   - Go to http://localhost:5173
   - Click "Setup" → Choose "FULL-AI"

2. **Start Auto-Scan**
   - Click "Start Scan"
   - System scans 50 NSE stocks
   - Each stock: analyzes technicals + RL predictions
   - On signal: executes trade automatically

3. **Watch Learning**
   - Open "RL Stats" tab
   - Watch metrics:
     - Trading Cycles (increments after 20 trades)
     - Loss (should decrease)
     - Win Rate (should increase)

4. **Save Trained Model**
   - After 100+ trades:
     - Click "Save Model"
     - Name it: "arbitrix_best_run_1"
   - Weights saved to disk

5. **Monitor P&L**
   - Right panel shows holdings
   - Bottom shows trade history
   - Unrealized gains/losses updated real-time

### Scenario 2: Semi-Auto (Manual Approval)

1. Choose "SEMI-AI" mode
2. System suggests trades (shows reasoning)
3. Click "Approve" or "Reject"
4. Trades execute only when YOU say so
5. RL still learns from same outcomes

### Scenario 3: Manual Mode

1. Choose "MANUAL" mode
2. You pick stocks and entry/exit prices
3. Execute trades manually
4. RL still learns from outcomes
5. Useful for testing your own strategies

---

## 🔧 Troubleshooting

### ❌ Backend Won't Start

**Problem:** `npm start` gives error

**Solutions:**

```bash
# Check Node version
node --version        # Should be v18+

# Check MongoDB connection
# In .env, make sure MONGODB_URI is correct
# Test with MongoDB Compass (GUI tool)

# Check port 5000 is free
# Or change PORT=5000 to PORT=5001 in .env

# Clear npm cache
npm cache clean --force
cd server && npm install && cd ..

# Try dev mode
cd server && npm run dev    # Shows more errors
```

### ❌ Frontend Won't Start

**Problem:** `npm run dev` gives error or shows blank page

**Solutions:**

```bash
# Check Vite config
cat vite.config.js

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev

# Check if port 5173 is free
# Or Vite will use 5174, 5175, etc.

# Check browser console for errors
# Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
# Look for red errors → screenshot → search online
```

### ❌ Database Connection Failed

**Problem:** `MongooseError: Cannot connect to MongoDB`

**Solutions:**

```bash
# Option 1: MongoDB Atlas (Cloud)
# 1. Open https://www.mongodb.com/cloud/atlas
# 2. Check if cluster is running (green circle)
# 3. Check credentials are correct in .env
# 4. Check IP whitelist (add 0.0.0.0/0 for testing)

# Option 2: Local MongoDB
# 1. Check if mongod is running
#    Mac: brew services list | grep mongodb
#    Windows: Services app → look for MongoDB
# 2. Restart: brew services restart mongodb-community
# 3. Verify: mongo --version

# Option 3: Test connection
node -e "require('mongoose').connect(process.env.MONGODB_URI)"
# If it works, no error shown
```

### ❌ RL Model Not Training

**Problem:** Training cycles stay at 0, no learning

**Solutions:**

```bash
# Check backend logs
# Should see: "Training RL model..." after 20 trades

# Verify /api/rl/stats shows training_cycles > 0
curl http://localhost:5000/api/rl/stats

# Check error logs in server console
# Look for: "RL Error" or "Training Failed"

# If errors:
cd server
node validate.js    # Check all RL modules load correctly

# Restart backend
npm start
```

### ❌ Missing API Key

**Problem:** "Invalid API key" error when trying AI explanations

**Solutions:**

```bash
# 1. Get free Anthropic API key
#    https://console.anthropic.com
#    Sign up free ($5 credits)

# 2. Create API key
#    Click "API Keys" → "Create Key" → Copy

# 3. Add to server/.env
#    ANTHROPIC_API_KEY=sk-ant-xxxxx

# 4. Restart backend
#    npm start

# 5. Test:
#    curl -H "Authorization: Bearer sk-ant-xxxxx" \
#    https://api.anthropic.com/v1/messages
```

### ❌ Stocks Not Loading

**Problem:** Watchlist appears empty or loading forever

**Solutions:**

```bash
# Check Yahoo Finance working
# Try fetching manual price
curl "http://localhost:5000/api/price?symbol=TCS"

# If fails, Yahoo Finance API may be blocked
# Solution: Use alternative: AlphaVantage, Polygon, etc.

# Edit src/lib/fetch.js
# Change data source to working API

# Restart frontend
npm run dev
```

---

## 📊 Performance & Monitoring

### Key Metrics to Track

| Metric         | Good Range | Warning | Critical |
| -------------- | ---------- | ------- | -------- |
| **Loss**       | < 0.8      | 0.8-1.2 | > 1.2    |
| **Accuracy**   | > 60%      | 40-60%  | < 40%    |
| **Win Rate**   | > 55%      | 45-55%  | < 45%    |
| **Epsilon**    | Decaying   | Stuck   | N/A      |
| **Avg Reward** | > 0        | -5 to 0 | < -5     |
| **Drawdown**   | < 10%      | 10-20%  | > 20%    |

### Expected Learning Timeline

```
Trades 1-50:        Network explores randomly
                    Loss: 1.2 → 1.0
                    Accuracy: 30% → 40%

Trades 51-150:      Signal emerges
                    Loss: 1.0 → 0.7
                    Accuracy: 40% → 55%

Trades 151-300:     Specialization
                    Loss: 0.7 → 0.5
                    Accuracy: 55% → 65%

Trades 300+:        Refinement
                    Loss: 0.5 → 0.3
                    Accuracy: 65% → 75%
                    System highly adapted
```

### Monitoring Dashboard

View in browser at http://localhost:5173:

- **Left Panel:** Stock list + scan status
- **Center:** Real-time price chart + signals
- **Right Panel:** Holdings + trade P&L
- **Bottom Tabs:**
  - "RL Stats" → Training progress
  - "Learning Curve" → Loss/accuracy graph
  - "Settings" → Configuration toggles

---

## 📚 Document Index

| Document                       | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| **README.md**                  | You are here! Complete guide to everything |
| **RL_IMPLEMENTATION_GUIDE.md** | Deep technical dive into RL architecture   |
| **RL_USAGE_EXAMPLES.js**       | 6 copy-paste code examples                 |
| **RL_COMPLETION_SUMMARY.md**   | Project completion report                  |
| **ARCHITECTURE.md**            | System design & data flow                  |
| **TECH_STACK.md**              | Technology recommendations                 |
| **DEPLOY.bat / DEPLOY.sh**     | Automated setup scripts                    |

---

## 🎓 Learning Resources

### Understanding the Algorithms

- **Entropy & PIEC:** [Information Entropy Explained](<https://en.wikipedia.org/wiki/Entropy_(information_theory)>)
- **Reinforcement Learning:** [Deep Reinforcement Learning (David Silver)](https://www.deepmind.com/learning-resources/deep-reinforcement-learning)
- **Neural Networks:** [3Blue1Brown: Neural Networks Explained](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_LFPM5gQo)
- **Stock Trading Signals:** [Investopedia: Technical Analysis](https://www.investopedia.com/terms/t/technicalanalysis.asp)

### Hands-On Tutorials

1. Try "SEMI-AI" mode first (you control approvals)
2. Watch RL Stats tab during first 50 trades
3. Save model after 100 trades
4. Compare RL vs traditional signals
5. Adjust RL_CONFIG parameters → observe impact

---

## 🤝 Contributing

### Reporting Issues

Found a bug? Create GitHub issue with:

1. Error message (from console)
2. Steps to reproduce
3. Your OS & Node version
4. Screenshots if relevant

### Suggesting Features

1. Open GitHub Discussions
2. Describe desired feature
3. Explain use case
4. Proposed implementation

### Code Improvements

1. Fork repository
2. Create feature branch: `git checkout -b feature/my-improvement`
3. Commit changes: `git commit -m "Add feature"`
4. Push: `git push origin feature/my-improvement`
5. Create Pull Request

---

## 📄 License

This project is provided as-is for educational purposes.

---

## ❓ FAQ

**Q: Can I use real money?**  
A: No, this is paper trading only. No real trades executed, no capital at risk.

**Q: How often should I retrain the model?**  
A: Automatically every 20 trades. Manual retraining via /api/rl/train.

**Q: What if RL predictions are wrong?**  
A: System automatically falls back to traditional signals (PIEC/RLFS/S-ADR). No disruption.

**Q: Can I use this on US stocks?**  
A: Currently NSE only. US stocks support coming soon.

**Q: How do I know if the system is learning?**  
A: Check /api/rl/learning-curve. Loss should decrease over time. Win rate should increase.

**Q: Can I export my trades?**  
A: Yes, via /api/trades endpoint or dashboard export button.

**Q: How do I update to latest version?**  
A: `git pull` in root directory, then `npm install && cd server && npm install && cd ..`

---

## 🚀 Next Steps

1. ✅ **Install** (follow Installation section above)
2. ✅ **Configure** .env file with your API keys
3. ✅ **Start Backend** (`cd server && npm start`)
4. ✅ **Start Frontend** (`npm run dev`)
5. **Open** http://localhost:5173
6. **Choose** FULL-AI mode
7. **Start** auto-scan
8. **Watch** system learn!

---

## 👋 Support

- 📧 **Email:** support@arbitrix.dev
- 💬 **Discord:** [Community](https://discord.gg/arbitrix)
- 📖 **Docs:** [Full Documentation](https://docs.arbitrix.dev)
- 🐛 **Issues:** [GitHub Issues](https://github.com/arbitrix/arbitrix/issues)

---

**Last Updated:** March 24, 2026  
**Version:** 2.0.0 (RL Edition)  
**Status:** ✅ Production Ready

Happy Trading! 🎯📈

| Feature                   | Description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| Auto BUY/SELL             | Scans every 30s, queues trades based on PIEC signals                 |
| Confirm dialog            | Full PIEC breakdown + AI reasoning before each trade                 |
| Full auto mode            | Disable confirmations with ⚡ AUTO ALL                               |
| Per-direction toggles     | Confirm buys but auto-sell (or vice versa)                           |
| Stop-loss auto            | Sells any position that drops 5% below avg buy price                 |
| AI pick reasoning         | Claude explains why these stocks suit your budget                    |
| AI trade notes            | Every manual trade gets a 3-sentence coaching note                   |
| PIEC tab                  | Live entropy gauge, RLFS score, drift, ω sizing, return distribution |
| Signals tab               | Component breakdown with weights                                     |
| Price chart               | Historical + EMA21/50 + Bollinger + 10-day forecast                  |
| Real NSE data             | Yahoo Finance via backend proxy (mock fallback if blocked)           |
| Toast notifications       | Bottom-right trade alerts                                            |
| Portfolio analytics       | Holdings P&L, unrealised returns, stop-loss warnings                 |
| User Authentication       | Register, login, secure sessions with JWT                            |
| AI Control Modes          | Full AI control, Semi-AI control, Manual control                     |
| Dynamic Stock Suggestions | AI suggests stocks based on available capital                        |
| Strategy Monitoring       | RLFS+S-ADR to monitor strategy reliability and user behavior         |

---

## Settings

Access via ⚙ in the top bar:

- **Auto-Trading Engine** — on/off master switch
- **Confirm Before BUY** — popup before each auto-buy
- **Confirm Before SELL** — popup before each auto-sell
- **Show AI Reasoning** — calls Claude API for "why this stock"
- **Auto Stop-Loss (−5%)** — auto-sell at 5% loss
- **Toast Notifications** — bottom-right alerts
- **AI Control Mode** — Select: Full AI, Semi-AI, or Manual

---

## AI Control Modes

1. **Full AI Control** — The AI makes all trading decisions automatically (subject to risk limits)
2. **Semi-AI Control** — The AI suggests trades, and you confirm or reject each one
3. **Manual Control** — You make all trading decisions; AI provides analysis and suggestions only

Each AI suggestion includes a detailed explanation of:

- Why the stock was selected based on your capital and risk profile
- The technical and fundamental analysis supporting the suggestion
- How the PIEC, RLFS, and S-ADR algorithms influenced the decision
- Risk factors and suggested position sizing

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

## Recent Improvements

The codebase has undergone significant refactoring to improve maintainability, configurability, and reliability:

1. **Backend Proxy Server** — Eliminates CORS issues by routing API requests through a Node.js/Express server
2. **User Authentication System** — Secure registration, login, and session management with JWT
3. **AI Control Modes** — Three levels of AI involvement in trading decisions
4. **Constants Management** — All magic numbers extracted to `src/lib/constants.js` for easy configuration
5. **Parameter Configuration** — RLFS and S-ADR parameters (BETA, GAMMA, STABLE_THRESHOLD, REJECTED_THRESHOLD) are now configurable via exported constants
6. **Code Refactoring** — Split large functions into smaller, focused helpers (e.g., `executeTrade` split into `executeBuy` and `executeSell`)
7. **Input Validation** — Added validation to key functions like `analyzeStock` to handle edge cases
8. **Data Fetching Reliability** — Enhanced the Yahoo Finance data fetcher with backend proxy first, then fallback mechanisms
9. **Code Quality** — Improved readability with better section headers, comments, and consistent naming conventions

These improvements make the codebase more maintainable, easier to configure, and more reliable while preserving all existing functionality.

---

## Disclaimer

**Paper trades only. Not financial advice. Educational use.**

This system uses algorithmic signals that are not guaranteed to be profitable. The 10-day price prediction is an ensemble of technical indicators — not a crystal ball. Never trade real money based solely on algorithmic signals without understanding the risks.

---

## Built with

React + Recharts + Vite (frontend)
Node.js + Express (backend)
MongoDB Atlas (database)

---

## Future Development

This platform provides a solid foundation for implementing a full trading system as specified in the requirements, including:

- Real-time market data layer for both Indian (NSE/BSE) and international (US) markets
- User payment and funding system (Razorpay/Stripe integration)
- Brokerage trading layer (Alpaca, Zerodha, etc.)
- AI Strategy Engine (RLFS, S-ADR, PIEc) with machine learning model training
- Risk Management System with advanced controls (VaR, stress testing, etc.)
- Backend Infrastructure with proper database, caching, and message queues
- Frontend Dashboard with advanced analytics, strategy performance tracking, and withdrawal functionality
- Deployment to cloud platforms (AWS, GCP, Azure) with monitoring and alerting
- Mobile application extension (React Native)
- Social trading features and community strategies

The current implementation serves as a proof-of-concept and learning tool that can be extended to a production-ready system supporting both retail and potentially institutional clients.
