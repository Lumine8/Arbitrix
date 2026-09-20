const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Import models and trading engines
const { User } = require("./models");
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

// Fail if JWT_SECRET is not set
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in environment. Exiting.");
  process.exit(1);
}

// ═════════════════════════════════════════════════════════════════
// MONGODB CONNECTION
// ═════════════════════════════════════════════════════════════════
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/arbitrix";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✓ MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Middleware
app.use(express.json({ limit: "1mb" }));

// CORS
app.use((req, res, next) => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:3000", "http://localhost:5173"];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ═════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═════════════════════════════════════════════════════════════════
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.user.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ═════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═════════════════════════════════════════════════════════════════
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, capital } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, and password are required" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ username, email, password, capital: capital || 0 });
    await user.save();

    const token = jwt.sign(
      { user: { id: user._id } },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.json({ token, user: user.toPublic() });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { user: { id: user._id } },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.json({ token, user: user.toPublic() });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

// ═════════════════════════════════════════════════════════════════
// STOCK DATA (public endpoint)
// ═════════════════════════════════════════════════════════════════
app.get("/api/stock/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance API error: ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

// ═════════════════════════════════════════════════════════════════
// DECISION LOGGING ENDPOINTS (protected)
// ═════════════════════════════════════════════════════════════════
app.post("/api/decisions/log", requireAuth, async (req, res) => {
  try {
    const { sessionId, ...decisionData } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const logged = await DecisionLogger.logDecision({
      userId: req.user.id,
      sessionId,
      ...decisionData,
    });

    res.json({ success: true, decisionId: logged._id });
  } catch (error) {
    console.error("Error logging decision:", error);
    res.status(500).json({ error: "Failed to log decision" });
  }
});

app.get("/api/decisions/history/:sessionId", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit } = req.query;
    const history = await DecisionLogger.getDecisionHistory(
      req.user.id,
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
// TRADE EVALUATION ENDPOINTS (protected)
// ═════════════════════════════════════════════════════════════════
app.post("/api/trades/evaluate", requireAuth, async (req, res) => {
  try {
    const { sessionId, ...evalData } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const evaluation = await TradeEvaluator.evaluateTrade({
      userId: req.user.id,
      sessionId,
      ...evalData,
    });

    res.json({ success: true, evaluationId: evaluation._id });
  } catch (error) {
    console.error("Error evaluating trade:", error);
    res.status(500).json({ error: "Failed to evaluate trade" });
  }
});

app.get("/api/trades/accuracy/:sessionId", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stats = await TradeEvaluator.getAccuracyStats(req.user.id, sessionId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching accuracy stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ═════════════════════════════════════════════════════════════════
// PAPER TRADING ENDPOINTS (protected)
// ═════════════════════════════════════════════════════════════════
app.post("/api/trades/execute", requireAuth, async (req, res) => {
  try {
    const { sessionId, ...tradeData } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const trade = await PaperTradingEngine.executeTrade({
      userId: req.user.id,
      sessionId,
      ...tradeData,
    });

    res.json({ success: true, tradeId: trade.tradeId, data: trade });
  } catch (error) {
    console.error("Error executing trade:", error);
    res.status(500).json({ error: "Failed to execute trade" });
  }
});

app.post("/api/trades/close/:tradeId", requireAuth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { exit_price } = req.body;
    if (!exit_price || isNaN(parseFloat(exit_price))) {
      return res.status(400).json({ error: "Valid exit_price is required" });
    }

    const trade = await PaperTradingEngine.closeTrade(
      tradeId,
      parseFloat(exit_price),
      req.user.id,
    );
    res.json({ success: true, data: trade });
  } catch (error) {
    console.error("Error closing trade:", error);
    res.status(500).json({ error: error.message || "Failed to close trade" });
  }
});

app.get("/api/trades/history/:sessionId", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await PaperTradingEngine.getTradeHistory(req.user.id, sessionId);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching trade history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.get("/api/trades/metrics/:sessionId", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const metrics = await PaperTradingEngine.calculatePortfolioMetrics(
      req.user.id,
      sessionId,
    );
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error("Error calculating metrics:", error);
    res.status(500).json({ error: "Failed to calculate metrics" });
  }
});

// ═════════════════════════════════════════════════════════════════
// LEARNING & ADAPTATION ENDPOINTS (protected)
// ═════════════════════════════════════════════════════════════════
app.post("/api/learning/initialize/:userId", requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const params = await LearningEngine.initializeParameters(req.user.id, sessionId);
    res.json({ success: true, data: params });
  } catch (error) {
    console.error("Error initializing learning:", error);
    res.status(500).json({ error: "Failed to initialize learning" });
  }
});

app.post("/api/learning/adapt/:userId", requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { sessionId, lookbackWindow } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const updated = await LearningEngine.runAdaptationCycle(
      req.user.id,
      sessionId,
      lookbackWindow || 20,
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error running adaptation:", error);
    res.status(500).json({ error: "Failed to run adaptation" });
  }
});

app.get("/api/learning/parameters/:userId", requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const params = await LearningEngine.getParameters(req.user.id);
    res.json({ success: true, data: params });
  } catch (error) {
    console.error("Error fetching parameters:", error);
    res.status(500).json({ error: "Failed to fetch parameters" });
  }
});

app.get("/api/learning/progress/:userId", requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const progress = await LearningEngine.getLearningProgress(req.user.id);
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

app.get("/api/learning/regime-insights/:userId", requireAuth, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const insights = await LearningEngine.getRegimeInsights(req.user.id);
    res.json({ success: true, data: insights });
  } catch (error) {
    console.error("Error fetching regime insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

// ═════════════════════════════════════════════════════════════════
// MARKET CONTEXT ENDPOINTS (public)
// ═════════════════════════════════════════════════════════════════
app.get("/api/context/market", async (req, res) => {
  try {
    const context = await ContextEngine.getMarketContext();
    res.json({ success: true, data: context });
  } catch (error) {
    console.error("Error fetching market context:", error);
    res.status(500).json({ error: "Failed to fetch context" });
  }
});

app.get("/api/context/volatility-multiplier/:vixLevel", (req, res) => {
  try {
    const { vixLevel } = req.params;
    const multiplier = ContextEngine.getVolatilityMultiplier(parseFloat(vixLevel));
    res.json({ success: true, multiplier });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate multiplier" });
  }
});

app.post("/api/context/interpret", (req, res) => {
  try {
    const { context } = req.body;
    if (!context) return res.status(400).json({ error: "Missing context" });
    const interpretation = ContextEngine.interpretContext(context);
    res.json({ success: true, interpretation });
  } catch (error) {
    res.status(500).json({ error: "Failed to interpret context" });
  }
});

// ═════════════════════════════════════════════════════════════════
// REPORT GENERATION ENDPOINTS (protected)
// ═════════════════════════════════════════════════════════════════
app.post("/api/reports/trade", requireAuth, async (req, res) => {
  try {
    const { sessionId, decisionLogId } = req.body;
    if (!sessionId || !decisionLogId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const report = await ReportGenerator.generateTradeReport(
      req.user.id,
      sessionId,
      decisionLogId,
    );
    res.json({ success: true, reportId: report.reportId, data: report });
  } catch (error) {
    console.error("Error generating trade report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

app.post("/api/reports/session", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const report = await ReportGenerator.generateSessionReport(
      req.user.id,
      sessionId,
    );
    res.json({ success: true, reportId: report.reportId, data: report });
  } catch (error) {
    console.error("Error generating session report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

app.get("/api/reports/:reportId", requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { SystemReport } = require("./models");
    const report = await SystemReport.findOne({ reportId, userId: req.user.id }).exec();
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
// HEALTH CHECK & SERVER
// ═════════════════════════════════════════════════════════════════
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.listen(PORT, () => {
  console.log(`\n ═════════════════════════════════════════════════════════ `);
  console.log(`  ARBITRIX BACKEND SERVER`);
  console.log(`  Server running on port ${PORT}`);
  console.log(`  Learning engine: ENABLED`);
  console.log(`  Decision logging: ENABLED`);
  console.log(`  Adaptive trading: ENABLED`);
  console.log(` ═════════════════════════════════════════════════════════\n`);
});
