const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Import trading engines
const {
  DecisionLogger,
  TradeEvaluator,
  PaperTradingEngine,
} = require("./decisionEngine");
const LearningEngine = require("./learningEngine");
const { ContextEngine, ReportGenerator } = require("./reportEngine");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ═════════════════════════════════════════════════════════════════
// MONGODB CONNECTION
// ═════════════════════════════════════════════════════════════════
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/arbitrix";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✓ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

// In-memory user store (for demo purposes)
let users = [];

// Helper to find user by email
const findUserByEmail = (email) => users.find((user) => user.email === email);

// Helper to find user by username
const findUserByUsername = (username) =>
  users.find((user) => user.username === username);

// Yahoo Finance proxy endpoint
app.get("/api/stock/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Yahoo Finance API error: ${response.status}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

// Claude AI proxy endpoint
app.post("/api/ai", async (req, res) => {
  try {
    const { system, user, maxTokens } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens || 800,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: `Claude API error: ${errorData.error?.message || "Unknown error"}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error calling Claude API:", error);
    res.status(500).json({ error: "Failed to call Claude API" });
  }
});

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, capital } = req.body;

    // Check if user already exists
    if (findUserByEmail(email) || findUserByUsername(username)) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      capital: capital || 0,
      createdAt: new Date(),
    };

    users.push(newUser);

    const payload = {
      user: {
        id: newUser.id,
      },
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" },
    );
    res.json({ token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" },
    );
    res.json({ token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.get("/api/auth/me", async (req, res) => {
  // For demo, we'll get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );
    const user = users.find((u) => u.id === decoded.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

// ═════════════════════════════════════════════════════════════════
// DECISION LOGGING ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/**
 * POST /api/decisions/log
 * Log a trade decision with full context
 */
app.post("/api/decisions/log", async (req, res) => {
  try {
    const { userId, sessionId, ...decisionData } = req.body;
    if (!userId || !sessionId) {
      return res.status(400).json({ error: "Missing userId or sessionId" });
    }

    const logged = await DecisionLogger.logDecision({
      userId,
      sessionId,
      ...decisionData,
    });

    res.json({ success: true, decisionId: logged._id });
  } catch (error) {
    console.error("Error logging decision:", error);
    res.status(500).json({ error: "Failed to log decision" });
  }
});

/**
 * GET /api/decisions/history/:userId/:sessionId
 * Get decision history
 */
app.get("/api/decisions/history/:userId/:sessionId", async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { limit } = req.query;
    const history = await DecisionLogger.getDecisionHistory(
      userId,
      sessionId,
      parseInt(limit) || 100,
    );
    res.json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching decision history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ═════════════════════════════════════════════════════════════════
// TRADE EVALUATION ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/**
 * POST /api/trades/evaluate
 * Evaluate a completed trade
 */
app.post("/api/trades/evaluate", async (req, res) => {
  try {
    const { userId, sessionId, ...evalData } = req.body;
    if (!userId || !sessionId) {
      return res.status(400).json({ error: "Missing userId or sessionId" });
    }

    const evaluation = await TradeEvaluator.evaluateTrade({
      userId,
      sessionId,
      ...evalData,
    });

    res.json({ success: true, evaluationId: evaluation._id });
  } catch (error) {
    console.error("Error evaluating trade:", error);
    res.status(500).json({ error: "Failed to evaluate trade" });
  }
});

/**
 * GET /api/trades/accuracy/:userId/:sessionId
 * Get accuracy statistics
 */
app.get("/api/trades/accuracy/:userId/:sessionId", async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const stats = await TradeEvaluator.getAccuracyStats(userId, sessionId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching accuracy stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ═════════════════════════════════════════════════════════════════
// PAPER TRADING ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/**
 * POST /api/trades/execute
 * Execute a simulated trade
 */
app.post("/api/trades/execute", async (req, res) => {
  try {
    const { userId, sessionId, ...tradeData } = req.body;
    if (!userId || !sessionId) {
      return res.status(400).json({ error: "Missing userId or sessionId" });
    }

    const trade = await PaperTradingEngine.executeTrade({
      userId,
      sessionId,
      ...tradeData,
    });

    res.json({ success: true, tradeId: trade.tradeId, data: trade });
  } catch (error) {
    console.error("Error executing trade:", error);
    res.status(500).json({ error: "Failed to execute trade" });
  }
});

/**
 * POST /api/trades/close/:tradeId
 * Close a trade and calculate P&L
 */
app.post("/api/trades/close/:tradeId", async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { exit_price } = req.body;
    if (!exit_price) {
      return res.status(400).json({ error: "Missing exit_price" });
    }

    const trade = await PaperTradingEngine.closeTrade(tradeId, exit_price);
    res.json({ success: true, data: trade });
  } catch (error) {
    console.error("Error closing trade:", error);
    res.status(500).json({ error: "Failed to close trade" });
  }
});

/**
 * GET /api/trades/history/:userId/:sessionId
 * Get trade history
 */
app.get("/api/trades/history/:userId/:sessionId", async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const history = await PaperTradingEngine.getTradeHistory(userId, sessionId);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching trade history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

/**
 * GET /api/trades/metrics/:userId/:sessionId
 * Get portfolio metrics
 */
app.get("/api/trades/metrics/:userId/:sessionId", async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const metrics = await PaperTradingEngine.calculatePortfolioMetrics(
      userId,
      sessionId,
    );
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error("Error calculating metrics:", error);
    res.status(500).json({ error: "Failed to calculate metrics" });
  }
});

// ═════════════════════════════════════════════════════════════════
// LEARNING & ADAPTATION ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/**
 * POST /api/learning/initialize/:userId
 * Initialize learning parameters
 */
app.post("/api/learning/initialize/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const params = await LearningEngine.initializeParameters(userId, sessionId);
    res.json({ success: true, data: params });
  } catch (error) {
    console.error("Error initializing learning:", error);
    res.status(500).json({ error: "Failed to initialize learning" });
  }
});

/**
 * POST /api/learning/adapt/:userId
 * Run adaptation cycle to learn from past trades
 */
app.post("/api/learning/adapt/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId, lookbackWindow } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const updated = await LearningEngine.runAdaptationCycle(
      userId,
      sessionId,
      lookbackWindow || 20,
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error running adaptation:", error);
    res.status(500).json({ error: "Failed to run adaptation" });
  }
});

/**
 * GET /api/learning/parameters/:userId
 * Get current learned parameters
 */
app.get("/api/learning/parameters/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const params = await LearningEngine.getParameters(userId);
    res.json({ success: true, data: params });
  } catch (error) {
    console.error("Error fetching parameters:", error);
    res.status(500).json({ error: "Failed to fetch parameters" });
  }
});

/**
 * GET /api/learning/progress/:userId
 * Get learning progress
 */
app.get("/api/learning/progress/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await LearningEngine.getLearningProgress(userId);
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

/**
 * GET /api/learning/regime-insights/:userId
 * Get regime-specific performance insights
 */
app.get("/api/learning/regime-insights/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const insights = await LearningEngine.getRegimeInsights(userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    console.error("Error fetching regime insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

// ═════════════════════════════════════════════════════════════════
// MARKET CONTEXT ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/**
 * GET /api/context/market
 * Get current market context
 */
app.get("/api/context/market", async (req, res) => {
  try {
    const context = await ContextEngine.getMarketContext();
    res.json({ success: true, data: context });
  } catch (error) {
    console.error("Error fetching market context:", error);
    res.status(500).json({ error: "Failed to fetch context" });
  }
});

/**
 * GET /api/context/volatility-multiplier/:vixLevel
 * Get volatility-adjusted confidence multiplier
 */
app.get("/api/context/volatility-multiplier/:vixLevel", (req, res) => {
  try {
    const { vixLevel } = req.params;
    const multiplier = ContextEngine.getVolatilityMultiplier(
      parseFloat(vixLevel),
    );
    res.json({ success: true, multiplier });
  } catch (error) {
    console.error("Error calculating multiplier:", error);
    res.status(500).json({ error: "Failed to calculate multiplier" });
  }
});

/**
 * POST /api/context/interpret
 * Interpret market context
 */
app.post("/api/context/interpret", (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ error: "Missing context" });
    }
    const interpretation = ContextEngine.interpretContext(context);
    res.json({ success: true, interpretation });
  } catch (error) {
    console.error("Error interpreting context:", error);
    res.status(500).json({ error: "Failed to interpret context" });
  }
});

// ═════════════════════════════════════════════════════════════════
// REPORT GENERATION ENDPOINTS
// ═════════════════════════════════════════════════════════════════

/**
 * POST /api/reports/trade
 * Generate a trade report
 */
app.post("/api/reports/trade", async (req, res) => {
  try {
    const { userId, sessionId, decisionLogId } = req.body;
    if (!userId || !sessionId || !decisionLogId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const report = await ReportGenerator.generateTradeReport(
      userId,
      sessionId,
      decisionLogId,
    );
    res.json({ success: true, reportId: report.reportId, data: report });
  } catch (error) {
    console.error("Error generating trade report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

/**
 * POST /api/reports/session
 * Generate a session report
 */
app.post("/api/reports/session", async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    if (!userId || !sessionId) {
      return res.status(400).json({ error: "Missing userId or sessionId" });
    }

    const report = await ReportGenerator.generateSessionReport(
      userId,
      sessionId,
    );
    res.json({ success: true, reportId: report.reportId, data: report });
  } catch (error) {
    console.error("Error generating session report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

/**
 * GET /api/reports/:reportId
 * Get a specific report
 */
app.get("/api/reports/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { SystemReport } = require("./models");
    const report = await SystemReport.findOne({ reportId }).exec();
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

// ═════════════════════════════════════════════════════════════════
// REINFORCEMENT LEARNING ENDPOINTS
// ═════════════════════════════════════════════════════════════════

// Initialize global RL engine (will be lazy-loaded)
let rlEngine = null;

function initializeRLEngine() {
  if (!rlEngine) {
    try {
      const RLEngine = require("./rl/index");
      rlEngine = new RLEngine({
        enabled: true,
        epsilon: 0.1,
        trainInterval: 20,
        batchSize: 32,
        bufferSize: 10000,
        drawdownPenalty: 0.5,
        entropyPenalty: 0.3,
        driftPenalty: 0.2,
      });
      console.log("✓ RL Engine initialized");
    } catch (e) {
      console.warn("⚠️ RL Engine initialization failed:", e.message);
      return null;
    }
  }
  return rlEngine;
}

/**
 * POST /api/rl/decide
 * Get RL decision for given state
 */
app.post("/api/rl/decide", async (req, res) => {
  try {
    const engine = initializeRLEngine();
    if (!engine) {
      return res.status(503).json({ error: "RL Engine not available" });
    }

    const { state, analysisResult, portfolio, useRL } = req.body;

    if (!state || !Array.isArray(state)) {
      return res.status(400).json({ error: "Invalid state vector" });
    }

    const decision = await engine.decideAction(analysisResult || {}, state, {
      useRL: useRL !== false,
      portfolio: portfolio || {},
    });

    res.json(decision);
  } catch (error) {
    console.error("RL Decision error:", error);
    res.status(500).json({ error: "Failed to make RL decision" });
  }
});

/**
 * POST /api/rl/process-outcome
 * Process trade outcome for learning
 */
app.post("/api/rl/process-outcome", async (req, res) => {
  try {
    const engine = initializeRLEngine();
    if (!engine) {
      return res.status(503).json({ error: "RL Engine not available" });
    }

    const { tradeOutcome, nextState } = req.body;

    if (!tradeOutcome) {
      return res.status(400).json({ error: "Missing trade outcome" });
    }

    const result = await engine.processOutcome(tradeOutcome, nextState);

    res.json(result);
  } catch (error) {
    console.error("Outcome processing error:", error);
    res.status(500).json({ error: "Failed to process outcome" });
  }
});

/**
 * GET /api/rl/stats
 * Get RL engine statistics
 */
app.get("/api/rl/stats", (req, res) => {
  try {
    const engine = initializeRLEngine();
    if (!engine) {
      return res.json({ enabled: false });
    }

    const stats = engine.getStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting RL stats:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

/**
 * GET /api/rl/learning-curve
 * Get learning curve data
 */
app.get("/api/rl/learning-curve", (req, res) => {
  try {
    const engine = initializeRLEngine();
    if (!engine || !engine.enabled) {
      return res.json({ curve: [], message: "RL not enabled" });
    }

    const curve = engine.getLearningCurve();
    res.json({ curve });
  } catch (error) {
    console.error("Error getting learning curve:", error);
    res.status(500).json({ error: "Failed to get learning curve" });
  }
});

/**
 * POST /api/rl/save-model
 * Save trained model
 */
app.post("/api/rl/save-model", async (req, res) => {
  try {
    const engine = initializeRLEngine();
    if (!engine) {
      return res.status(503).json({ error: "RL Engine not available" });
    }

    const { modelName } = req.body;
    const success = await engine.saveModel(modelName || "policy_model");

    res.json({ success });
  } catch (error) {
    console.error("Model save error:", error);
    res.status(500).json({ error: "Failed to save model" });
  }
});

/**
 * POST /api/rl/load-model
 * Load previously trained model
 */
app.post("/api/rl/load-model", async (req, res) => {
  try {
    const engine = initializeRLEngine();
    if (!engine) {
      return res.status(503).json({ error: "RL Engine not available" });
    }

    const { modelName } = req.body;
    const success = await engine.loadModel(modelName || "policy_model");

    res.json({ success });
  } catch (error) {
    console.error("Model load error:", error);
    res.status(500).json({ error: "Failed to load model" });
  }
});

/**
 * GET /api/rl/models
 * List available models
 */
app.get("/api/rl/models", (req, res) => {
  try {
    const engine = initializeRLEngine();
    if (!engine) {
      return res.json({ models: [] });
    }

    const models = engine.listModels();
    res.json({ models });
  } catch (error) {
    console.error("Model listing error:", error);
    res.status(500).json({ error: "Failed to list models" });
  }
});

/**
 * POST /api/rl/reset
 * Reset RL engine
 */
app.post("/api/rl/reset", (req, res) => {
  try {
    const engine = initializeRLEngine();
    if (!engine) {
      return res.status(503).json({ error: "RL Engine not available" });
    }

    engine.reset();
    res.json({ success: true });
  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({ error: "Failed to reset RL engine" });
  }
});

// ═════════════════════════════════════════════════════════════════
// HEALTH CHECK & SERVER
// ═════════════════════════════════════════════════════════════════

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n ═════════════════════════════════════════════════════════ `);
  console.log(`  ARBITRIX BACKEND SERVER`);
  console.log(`  🚀 Server running on port ${PORT}`);
  console.log(`  📊 Learning engine: ENABLED`);
  console.log(`  📈 Decision logging: ENABLED`);
  console.log(`  🧠 Adaptive trading: ENABLED`);
  console.log(`  🤖 Reinforcement Learning: ENABLED`);
  console.log(`  📦 Model storage: ./models`);
  console.log(` ═════════════════════════════════════════════════════════\n`);
});
