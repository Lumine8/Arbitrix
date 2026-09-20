const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ═════════════════════════════════════════════════════════════════
// USER SCHEMA
// Persistent user accounts with authentication
// ═════════════════════════════════════════════════════════════════
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    capital: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "users" },
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ═════════════════════════════════════════════════════════════════
// DECISION LOG SCHEMA
// Logs every trade decision with full reasoning chain
// ═════════════════════════════════════════════════════════════════
const DecisionLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },

    // Stock & Trade Info
    stock: { type: String, required: true },
    stockName: String,

    // Market Features at decision time
    features: {
      RSI: Number,
      MACD: Number,
      EMA_9: Number,
      EMA_21: Number,
      EMA_50: Number,
      BB_position: Number,
      BB_width: Number,
      volume_ratio: Number,
      ATR: Number,
      volatility: Number,
      Stoch_K: Number,
      Stoch_D: Number,
    },

    // Decision Components
    decision: { type: String, enum: ["BUY", "SELL", "HOLD"], required: true },
    confidence: Number,
    composite_score: Number,

    // Signal Component Breakdown
    signal_components: {
      ema_trend: Number,
      rsi_signal: Number,
      macd_signal: Number,
      bollinger_signal: Number,
      volume_signal: Number,
      stoch_signal: Number,
    },

    // Reasoning
    reasoning: String,
    market_context: String,
    regime_interpretation: String,

    // Predictions
    predicted_direction: String, // "UP", "DOWN", "NEUTRAL"
    predicted_strength: String, // "WEAK", "MEDIUM", "STRONG"
    predicted_price_10d: Number,
    predicted_price_targets: {
      upper: Number,
      lower: Number,
      middle: Number,
    },

    // Trade Execution Info
    executed: Boolean,
    execution_type: String, // "AUTO", "SEMI", "MANUAL", "REJECTED"
    execution_price: Number,
    execution_qty: Number,
    execution_time: Date,

    // Slippage & Costs
    expected_price: Number,
    actual_slippage: Number,
    transaction_cost: Number,
  },
  { timestamps: true, collection: "decision_logs" },
);

// ═════════════════════════════════════════════════════════════════
// POST-TRADE EVALUATION SCHEMA
// Logs how accurate each decision was
// ═════════════════════════════════════════════════════════════════
const TradeEvaluationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    decisionLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "decision_logs",
    },

    // Decision Reference
    stock: String,
    decision: String, // "BUY", "SELL", "HOLD"
    decision_time: Date,
    decision_price: Number,

    // Execution
    executed: Boolean,
    execution_price: Number,
    execution_qty: Number,
    execution_time: Date,

    // Outcome
    evaluation_time: Date,
    actual_price_at_eval: Number,
    price_change_pct: Number,

    // Accuracy Metrics
    predicted_direction: String,
    actual_direction: String,
    direction_correct: Boolean,

    predicted_price: Number,
    actual_price: Number,
    price_error: Number,
    price_error_pct: Number,

    predicted_strength: String,
    actual_strength: String,

    // Outcome vs Expectation
    expected_profit: Number,
    actual_profit: Number,
    profit_deviation: Number,

    confidence_level: Number,
    confidence_vs_result: String, // "HIGH_CORRECT", "HIGH_WRONG", "LOW_CORRECT", "LOW_WRONG"

    // Context Analysis
    regime_when_correct: [String],
    regime_when_wrong: [String],
    feature_drift_at_trade: Number,
    entropy_at_trade: Number,

    // Learning Signals
    should_increase_weight: [String], // Which indicators were right
    should_decrease_weight: [String], // Which indicators were wrong

    notes: String,
  },
  { timestamps: true, collection: "trade_evaluations" },
);

// ═════════════════════════════════════════════════════════════════
// LEARNED PARAMETERS SCHEMA
// Self-learning system stores adapted parameters
// ═════════════════════════════════════════════════════════════════
const LearnedParametersSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true },

    // Indicator Weight Adaptations
    indicator_weights: {
      EMA_TREND_WEIGHT: {
        value: Number,
        iterations: Number,
        performance: Number,
      },
      RSI_WEIGHT: { value: Number, iterations: Number, performance: Number },
      MACD_WEIGHT: { value: Number, iterations: Number, performance: Number },
      BOLLINGER_WEIGHT: {
        value: Number,
        iterations: Number,
        performance: Number,
      },
      VOLUME_WEIGHT: { value: Number, iterations: Number, performance: Number },
      STOCH_WEIGHT: { value: Number, iterations: Number, performance: Number },
    },

    // Signal Threshold Adaptations
    signal_thresholds: {
      BUY_THRESHOLD: Number,
      SELL_THRESHOLD: Number,
    },

    // Confidence Scaling
    confidence_scaling: {
      base_multiplier: Number,
      entropy_penalty: Number,
      drift_penalty: Number,
    },

    // Regime-Specific Parameters
    regime_params: {
      high_entropy_factor: Number,
      high_drift_factor: Number,
      volatility_multiplier: Number,
    },

    // Learning History
    learning_iterations: Number,
    last_update: Date,
    performance_history: [
      {
        iteration: Number,
        accuracy: Number,
        win_rate: Number,
        avg_confidence_vs_result: Number,
      },
    ],

    // Regime Analysis
    regime_statistics: {
      high_entropy: {
        win_rate: Number,
        avg_accuracy: Number,
        freq_adjustment_factor: Number,
      },
      low_entropy: {
        win_rate: Number,
        avg_accuracy: Number,
        freq_adjustment_factor: Number,
      },
      high_drift: {
        win_rate: Number,
        avg_accuracy: Number,
        freq_adjustment_factor: Number,
      },
      stable: {
        win_rate: Number,
        avg_accuracy: Number,
        freq_adjustment_factor: Number,
      },
    },
  },
  { timestamps: true, collection: "learned_parameters" },
);

// ═════════════════════════════════════════════════════════════════
// PAPER TRADING ENGINE SCHEMA
// Tracks trades, holdings, and P&L
// ═════════════════════════════════════════════════════════════════
const PaperTradeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    tradeId: { type: String, unique: true, index: true },

    // Trade Details
    type: { type: String, enum: ["BUY", "SELL"] },
    stock: String,
    qty: Number,
    entry_price: Number,
    exit_price: Number,
    entry_time: Date,
    exit_time: Date,

    // Simulated Costs
    slippage_pct: Number,
    slippage_amount: Number,
    transaction_cost: Number,

    // P&L
    entry_total: Number,
    exit_total: Number,
    gross_pnl: Number,
    net_pnl: Number, // After slippage and costs
    pnl_pct: Number,

    // Position Metadata
    avg_price: Number,
    current_holdings: Number,

    // Decision Link
    decisionLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "decision_logs",
    },
    decision_confidence: Number,
    decision_tier: String,

    // Execution Mode
    execution_mode: { type: String, enum: ["AUTO", "SEMI", "MANUAL"] },

    // Status
    status: { type: String, enum: ["OPEN", "CLOSED"] },

    notes: String,
  },
  { timestamps: true, collection: "paper_trades" },
);

// ═════════════════════════════════════════════════════════════════
// PORTFOLIO SNAPSHOT SCHEMA
// Daily/session snapshots of portfolio state
// ═════════════════════════════════════════════════════════════════
const PortfolioSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },

    // Capital & Liquidity
    initial_capital: Number,
    total_capital: Number,
    current_cash: Number,
    current_holdings_value: Number,

    // Performance Metrics
    total_pnl: Number,
    total_pnl_pct: Number,
    realized_pnl: Number,
    unrealized_pnl: Number,

    // Risk Metrics
    max_drawdown: Number,
    sharpe_ratio: Number,
    win_rate: Number,
    avg_win: Number,
    avg_loss: Number,
    profit_factor: Number,

    // Holdings
    holdings: [
      {
        symbol: String,
        qty: Number,
        avg_price: Number,
        current_value: Number,
        unrealized_pnl: Number,
      },
    ],

    // Trade Statistics
    total_trades: Number,
    buy_count: Number,
    sell_count: Number,

    // Signal Accuracy
    signal_accuracy_pct: Number,
    directional_accuracy_pct: Number,

    // Risk Limits
    daily_limit_used: Number,
    max_limit_used: Number,
  },
  { timestamps: true, collection: "portfolio_snapshots" },
);

// ═════════════════════════════════════════════════════════════════
// SYSTEM REPORT SCHEMA
// Generated reports for analysis
// ═════════════════════════════════════════════════════════════════
const SystemReportSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    reportId: { type: String, unique: true },
    report_type: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "SESSION", "TRADE"],
    },

    // Period
    period_start: Date,
    period_end: Date,

    // Summary Statistics
    summary: {
      total_trades: Number,
      successful_trades: Number,
      failed_trades: Number,
      win_rate_pct: Number,
      gross_pnl: Number,
      net_pnl: Number,
      total_return_pct: Number,
      sharpe_ratio: Number,
      max_drawdown: Number,
    },

    // Learning Insights
    learning_insights: {
      patterns_identified: [String],
      parameter_changes: [String],
      regime_changes_detected: [String],
      adaptation_score: Number,
    },

    // Decision Accuracy
    decision_analysis: {
      directional_accuracy: Number,
      magnitude_accuracy: Number,
      confidence_calibration: Number,
      regime_relevant_accuracy: {
        high_entropy: Number,
        low_entropy: Number,
        high_drift: Number,
        stable: Number,
      },
    },

    // Report Content
    content: {
      html: String,
      json: Object,
      summary_text: String,
    },

    // Metadata
    generated_at: { type: Date, default: Date.now },
    data_points: Number,
  },
  { timestamps: true, collection: "system_reports" },
);

// ═════════════════════════════════════════════════════════════════
// ORDER SCHEMA
// User/strategy intent — not a fill, must not change cash
// ═════════════════════════════════════════════════════════════════
const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    side: { type: String, enum: ["BUY", "SELL"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    submittedAt: { type: Date, default: Date.now },
    strategyId: String,
    decisionId: { type: mongoose.Schema.Types.ObjectId, ref: "decision_logs" },
    status: {
      type: String,
      enum: ["ACCEPTED", "REJECTED", "FILLED", "CANCELLED"],
      default: "ACCEPTED",
    },
    idempotencyKey: { type: String, unique: true, sparse: true },
    rejectReason: String,
  },
  { timestamps: true, collection: "orders" },
);

// ═════════════════════════════════════════════════════════════════
// EXECUTION / FILL SCHEMA
// Immutable accounting event — the source of truth
// ═════════════════════════════════════════════════════════════════
const ExecutionSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true },
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    side: { type: String, enum: ["BUY", "SELL"], required: true },
    quantity: { type: Number, required: true },
    requestedPrice: { type: Number, required: true },
    fillPrice: { type: Number, required: true },
    grossValue: { type: Number, required: true },
    commission: { type: Number, default: 0 },
    taxesAndFees: { type: Number, default: 0 },
    slippageValue: { type: Number, default: 0 },
    executedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "executions" },
);

// ═════════════════════════════════════════════════════════════════
// POSITION SCHEMA
// One aggregate position per userId + symbol (long-only)
// ═════════════════════════════════════════════════════════════════
const PositionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    symbol: { type: String, required: true },
    quantity: { type: Number, default: 0, min: 0 },
    averageCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    realizedPnl: { type: Number, default: 0 },
    stopPrice: Number,
    highestClose: Number,
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "positions" },
);

PositionSchema.index({ userId: 1, symbol: 1 }, { unique: true });

// ═════════════════════════════════════════════════════════════════
// CASH ENTRY SCHEMA
// Append-only ledger for auditability
// ═════════════════════════════════════════════════════════════════
const CashEntrySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    executionId: { type: mongoose.Schema.Types.ObjectId, ref: "executions" },
    amount: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["INITIAL_DEPOSIT", "BUY_SETTLEMENT", "SELL_SETTLEMENT", "FEE"],
      required: true,
    },
    balanceAfter: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "cash_entries" },
);

// Create and export models
const models = {
  User: mongoose.model("User", UserSchema),
  DecisionLog: mongoose.model("DecisionLog", DecisionLogSchema),
  TradeEvaluation: mongoose.model("TradeEvaluation", TradeEvaluationSchema),
  LearnedParameters: mongoose.model(
    "LearnedParameters",
    LearnedParametersSchema,
  ),
  PaperTrade: mongoose.model("PaperTrade", PaperTradeSchema),
  PortfolioSnapshot: mongoose.model(
    "PortfolioSnapshot",
    PortfolioSnapshotSchema,
  ),
  SystemReport: mongoose.model("SystemReport", SystemReportSchema),
  Order: mongoose.model("Order", OrderSchema),
  Execution: mongoose.model("Execution", ExecutionSchema),
  Position: mongoose.model("Position", PositionSchema),
  CashEntry: mongoose.model("CashEntry", CashEntrySchema),
};

module.exports = models;
