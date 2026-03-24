# 🚀 Reinforcement Learning (RL) Implementation Guide for ARBITRIX

## Overview

The ARBITRIX platform now features a **complete Reinforcement Learning decision pipeline** that learns from trade outcomes and continuously improves trading performance.

### RL Pipeline Architecture

```
Market Data
    ↓
Feature Engineering (Technical Analysis)
    ↓
State Vector Builder (Normalized inputs)
    ↓
PIEC (Entropy) + RLFS (Drift) + S-ADR(Position Size)
    ↓
RL POLICY NETWORK (TensorFlow.js)
    ↓
Action Selection (Epsilon-Greedy)
    ↓
Trade Decision: BUY / SELL / HOLD
    ↓
S-ADR Position Sizing (0-100%)
    ↓
Trade Execution (Paper Trading)
    ↓
Outcome & Reward Calculation
    ↓
Experience Storage (Replay Buffer)
    ↓
Policy Training (Every N trades)
    ↓
Better Next Decision
```

---

## 🧩 Core Components

### 1. **State Vector Builder** (`src/lib/stateBuilder.js`)

**Builds normalized state vectors from market data:**

```
STATE = [
  RSI (0-1),
  MACD (-1 to 1),
  Bollinger Position (0-1),
  EMA Spread (-1 to 1),
  Volume Ratio (0-1),
  Entropy (0-1),
  RLFS Score (0-1),
  Drift (0-1),
  Volatility (0-1),
  Sentiment (-1 to 1),
  Position Flag (0 or 1),
  Unrealized P&L (-1 to 1)
]
```

**Normalization ensures:**

- ✅ Consistent input ranges
- ✅ No NaN values
- ✅ Stable network training
- ✅ Robust error handling

### 2. **Policy Model** (`server/rl/policyModel.js`)

**TensorFlow.js neural network:**

```
Input (12)
    ↓
Dense(64, ReLU) + Dropout(0.2)
    ↓
Dense(32, ReLU) + Dropout(0.2)
    ↓
Dense(3, Softmax)  → [P_BUY, P_SELL, P_HOLD]
```

**Features:**

- ✅ Learns optimal action probabilities
- ✅ Dropout for regularization
- ✅ Adam optimizer (lr=0.001)
- ✅ Save/load checkpoints
- ✅ Training history tracking

### 3. **Action Selector** (`server/rl/actionSelector.js`)

**Epsilon-greedy exploration:**

```javascript
With probability ε: random action (explore)
With probability 1-ε: policy action (exploit)

ε decays: ε_t = max(ε_min, ε_0 × decay_rate^t)
```

**Configuration:**

- Initial ε = 0.1 (10% exploration)
- Decay = 0.995 (per step)
- Min ε = 0.01 (1% minimum exploration)

### 4. **Reward Engine** (`server/rl/rewardEngine.js`)

**Calculates rewards based on trade outcomes:**

```
REWARD = Profit
       - λ₁ × Drawdown
       - λ₂ × Entropy_Penalty
       - λ₃ × Drift_Penalty
       + Bonus (correct direction)
       + Confidence_Bonus (calibration)

λ₁ = 0.5  (drawdown penalty)
λ₂ = 0.3  (entropy penalty)
λ₃ = 0.2  (drift penalty)
```

**Reward Breakdown:**

- Base Profit: Tanh-scaled to [-100, 100]
- Direction Bonus: +10 for correct, -5 for wrong
- Entropy Penalty: Higher in chaotic markets
- Drift Penalty: Higher when signals unreliable
- Confidence Bonus: ±5-10 based on calibration

### 5. **Replay Buffer** (`server/rl/replayBuffer.js`)

**Experience storage for training:**

```
Experience = {
  state: [array of 12],
  action: "BUY" | "SELL" | "HOLD",
  reward: number,
  nextState: [array of 12],
  done: boolean
}
```

**Features:**

- ✅ FIFO buffer (circular)
- ✅ Max size: 10,000 experiences
- ✅ Random sampling for training batches
- ✅ Statistics tracking (avg reward, distribution)

### 6. **Training Engine** (`server/rl/trainer.js`)

**Orchestrates training loop:**

```
Every N trades:
  1. Sample batch from replay buffer
  2. Forward pass through policy network
  3. Compute loss (categorical cross-entropy)
  4. Backward pass (gradient descent)
  5. Update weights (Adam optimizer)
  6. Track training metrics
```

**Configuration:**

- Train interval: 20 trades
- Batch size: 32
- Min buffer size: 50

### 7. **Main RL Engine** (`server/rl/index.js`)

**Orchestrates all components:**

```javascript
const engine = new RLEngine({
  enabled: true,
  epsilon: 0.1,
  trainInterval: 20,
  batchSize: 32,
  bufferSize: 10000,
});

// Get decision
const decision = await engine.decideAction(analysis, state);

// Process outcome and train
await engine.processOutcome(outcome, nextState);

// Save trained model
await engine.saveModel("trained_model_v1");
```

---

## 🔌 Integration Points

### 1. **With analyze.js**

The RL policy can be integrated as an alternative/complement to traditional signal logic:

```javascript
// In rlIntegration.js
const enhancedAnalysis = await enhanceAnalysisWithRL(
  analysisResult,
  rlEngine,
  portfolio,
  (useRL = true),
);

// Returns: {...analysisResult, rl: {...}, signal: RL_action}
```

### 2. **With Decision Logging**

Extended decision logs include RL data:

```json
{
  "rl_enabled": true,
  "rl_action": "BUY",
  "rl_confidence": 78.5,
  "rl_action_probs": [0.70, 0.15, 0.15],
  "rl_is_exploration": false,
  "rl_epsilon": 0.095,
  "state_vector": [...],
  "blend_strategy": "confidence_weighted"
}
```

### 3. **With Trade Evaluation**

After trade closes:

```javascript
const outcome = {
  actualPnL: 150,
  predictedDirection: "BUY",
  actualDirection: "BUY",
  entropy: 0.35,
  rlfsScore: 0.92,
  confidence: 0.78,
};

await rlEngine.processOutcome(outcome, nextState);
// Automatically: calculates reward, trains network
```

---

## 🎯 Backend REST APIs

### RL Decision Endpoints

#### `POST /api/rl/decide` – Get RL action

```json
Request:
{
  "state": [0.5, 0.3, ..., 0.6],
  "analysisResult": {...},
  "portfolio": {...},
  "useRL": true
}

Response:
{
  "action": "BUY",
  "confidence": 75.3,
  "probs": [0.65, 0.20, 0.15],
  "isExploration": false,
  "epsilon": 0.098
}
```

#### `POST /api/rl/process-outcome` – Learn from outcome

```json
Request:
{
  "tradeOutcome": {
    "actualPnL": 100,
    "predictedDirection": "BUY",
    "actualDirection": "BUY",
    ...
  },
  "nextState": [...]
}

Response:
{
  "processed": true,
  "reward": 32.4,
  "trained": true,
  "trainingResult": {...}
}
```

#### `GET /api/rl/stats` – Get statistics

```json
Response:
{
  "enabled": true,
  "decisions": 150,
  "policyModel": {
    "trained": true,
    "trainingIterations": 8
  },
  "rewardStats": {
    "count": 150,
    "avgReward": 18.3,
    "trend": "improving"
  },
  "training": {
    "cycles": 8,
    "recentAvgLoss": 0.342,
    "recentAvgAccuracy": 0.68
  }
}
```

#### `GET /api/rl/learning-curve` – Get training progress

```json
Response:
{
  "curve": [
    {"cycle": 1, "loss": 1.892, "accuracy": 0.42},
    {"cycle": 2, "loss": 1.234, "accuracy": 0.55},
    ...,
    {"cycle": 8, "loss": 0.342, "accuracy": 0.68}
  ]
}
```

#### `POST /api/rl/save-model` – Save trained model

```json
Request:
{
  "modelName": "trained_model_v2"
}

Response:
{
  "success": true
}
```

#### `POST /api/rl/load-model` – Load saved model

```json
Request:
{
  "modelName": "trained_model_v2"
}

Response:
{
  "success": true
}
```

#### `GET /api/rl/models` – List available models

```json
Response:
{
  "models": ["trained_model_v1", "trained_model_v2", "policy_model"]
}
```

#### `POST /api/rl/reset` – Reset RL engine

```json
Response:
{
  "success": true
}
```

---

## 🧪 Testing

Run the test suite:

```bash
cd server
npm install
node tests/rlTests.js
```

**Test Coverage:**

- ✅ ActionSelector (exploration, decay, forced actions)
- ✅ RewardEngine (profit, penalties, bonuses)
- ✅ ReplayBuffer (FIFO, sampling, statistics)
- ✅ PolicyModel (predictions, training)
- ✅ RLEngine (orchestration, stats)
- ✅ Full pipeline (decision → outcome → training)
- ✅ Error handling (invalid inputs, edge cases)

---

## 📊 Configuration

Edit constants in `src/lib/constants.js`:

```javascript
export const RL_CONFIG = {
  RL_ENABLED: true,

  // Exploration
  EPSILON: 0.1,
  EPSILON_DECAY: 0.995,
  MIN_EPSILON: 0.01,

  // Training
  TRAIN_INTERVAL: 20,
  BATCH_SIZE: 32,
  MIN_BUFFER_SIZE: 50,
  BUFFER_SIZE: 10000,

  // Reward parameters
  DRAWDOWN_PENALTY: 0.5,
  ENTROPY_PENALTY: 0.3,
  DRIFT_PENALTY: 0.2,
  DIRECTION_BONUS: 10,

  // Model
  INPUT_SIZE: 12,
  HIDDEN_SIZE_1: 64,
  HIDDEN_SIZE_2: 32,
  OUTPUT_SIZE: 3,

  // Storage
  MODEL_DIR: "./models",
  SAVE_INTERVAL: 100,
};
```

---

## 🚀 Quick Start

### 1. **Setup Dependencies**

```bash
cd server
npm install
# Installs TensorFlow.js + required packages
```

### 2. **Start Backend**

```bash
npm start
# RL Engine initializes on first request
```

### 3. **Example Flow** (Frontend)

```javascript
import { buildStateVector } from './stateBuilder'
import * as API from './trading'

// 1. Analyze stock
const analysis = analyzeStock(priceHistory)

// 2. Build state
const state = buildStateVector(analysis, portfolio)

// 3. Get RL decision
const decision = await API.rlDecide(state, analysis)
// decision = {action: "BUY", confidence: 75, ...}

// 4. Execute trade
const trade = await API.executeTrade(decision)

// 5. Later: evaluate and learn
const outcome = {
  actualPnL: 150,
  predictedDirection: "BUY",
  actualDirection: "BUY",
  entropy: 0.35,
  ...
}
await API.rlProcessOutcome(outcome, nextState)
// Network trains automatically!

// 6. Monitor learning
const stats = await API.rlGetStats()
console.log(stats.training.recentAvgLoss)  // Decreasing = learning!
```

---

## 📈 Expected Behavior

### Training Phases

**Phase 1: Exploration (First ~50 trades)**

- Random actions mixed with policy
- High reward variance
- Network learning fundamentals

**Phase 2: Early Learning (50-200 trades)**

- Ε decreasing (less random)
- Better action selection
- Loss: 0.8→0.5

**Phase 3: Refinement (200+ trades)**

- Low ε (mostly exploitation)
- Specialized decisions per regime
- Loss: 0.5→0.3
- Accuracy: 40%→60%+

### Metrics to Watch

| Metric          | Phase 1 | Phase 2 | Phase 3 |
| --------------- | ------- | ------- | ------- |
| Loss            | 1.2-1.8 | 0.7-1.0 | 0.2-0.5 |
| Win Rate        | 45-50%  | 50-55%  | 55-65%  |
| Avg Accuracy    | Varies  | 50-55%  | 60-70%  |
| Trades/Decision | 20-30   | 15-25   | 10-20   |

---

## ⚠️ Safety & Fallbacks

### If RL Model Fails:

1. Returns error response
2. Frontend falls back to traditional signal
3. No automatic execution
4. User confirmation required

### If Buffer Insufficient:

1. Waits for min buffer (50 experiences)
2. Uses random actions (exploration)
3. Accumulates data silently

### If Training Error:

1. Logs error
2. Continues collecting experiences
3. Retries next interval
4. Never crashes trading loop

---

## 📚 Advanced Topics

### Model Persistence

```javascript
// Save after training session
await engine.saveModel("trained_model_session_final");

// Load for next session
await engine.loadModel("trained_model_session_final");

// Export for deployment
engine.exportModel("trained_model_v1", "./deployment");
```

### Custom Reward Function

```javascript
const engine = new RLEngine({
  drawdownPenalty: 0.7, // More conservative
  entropyPenalty: 0.5, // Penalize chaotic trades more
  driftPenalty: 0.1, // Less penalty for drift
  directionBonus: 15, // Higher bonus
});
```

### Multi-Regime Learning

The RL system naturally learns regime-specific policies:

- **Trending markets**: BUY/SELL more often
- **Choppy markets**: HOLD more often
- **High volatility**: Smaller positions

This emerges from the reward function without explicit configuration!

---

## 🔧 Troubleshooting

### Q: Loss not decreasing?

A: May need more training cycles, adjust learning rate, or check reward signal

### Q: Accuracy stuck at 50%?

A: Increase model complexity, adjust reward coefficients, verify state vector quality

### Q: Memory issues?

A: Reduce BUFFER_SIZE, reduce BATCH_SIZE, enable model checkpointing

### Q: Slow training?

A: Use TensorFlow.js-GPU (requires CUDA), increase TRAIN_INTERVAL, reduce model size

---

## 📖 Files Reference

| File                          | Purpose                    |
| ----------------------------- | -------------------------- |
| `src/lib/stateBuilder.js`     | State vector normalization |
| `server/rl/policyModel.js`    | TensorFlow.js network      |
| `server/rl/actionSelector.js` | Epsilon-greedy selection   |
| `server/rl/rewardEngine.js`   | Reward calculation         |
| `server/rl/replayBuffer.js`   | Experience storage         |
| `server/rl/trainer.js`        | Training orchestration     |
| `server/rl/modelStorage.js`   | Save/load models           |
| `server/rl/index.js`          | Main RL engine             |
| `src/lib/rlIntegration.js`    | Integration helpers        |
| `server/index.js`             | REST API endpoints         |
| `tests/rlTests.js`            | Test suite                 |

---

## 🎓 Learning Resources

- **TensorFlow.js**: https://www.tensorflow.org/js
- **Reinforcement Learning**: https://en.wikipedia.org/wiki/Reinforcement_learning
- **Policy Gradient**: https://spinningup.openai.com/
- **Epsilon-Greedy**: https://en.wikipedia.org/wiki/Multi-armed_bandit

---

## ✨ Next Steps

1. ✅ Deploy and run initial trading session
2. ✅ Collect 50+ experiences
3. ✅ Monitor training metrics
4. ✅ Save trained model
5. ✅ Compare RL vs traditional performance
6. ✅ Fine-tune reward function
7. ✅ Deploy to production

---

**Status: 🚀 Production Ready**

The RL system is fully integrated, tested, and ready for live trading!
