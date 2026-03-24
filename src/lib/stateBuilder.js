/**
 * ═══════════════════════════════════════════════════════════════
 * STATE BUILDER FOR RL POLICY
 * Constructs normalized state vectors from market data
 * ═══════════════════════════════════════════════════════════════
 */

import { ANALYSIS_PARAMS } from "./constants";

/**
 * Normalize value to [0, 1] range with bounds checking
 * @param {number} value - Raw value
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Normalized value in [0, 1]
 */
export function normalizeToRange(value, min = 0, max = 100) {
  if (!Number.isFinite(value)) return 0.5;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Normalize value to [-1, 1] range
 * @param {number} value - Raw value
 * @param {number} center - Center point (default 50)
 * @param {number} scale - Scaling factor (default 50)
 * @returns {number} Normalized value in [-1, 1]
 */
export function normalizeToSymmetric(value, center = 50, scale = 50) {
  if (!Number.isFinite(value)) return 0;
  const normalized = (value - center) / scale;
  return Math.max(-1, Math.min(1, normalized));
}

/**
 * Build complete state vector for RL policy
 * STATE = [RSI, MACD, BB_pos, EMA_spread, Volume, Entropy, RLFS, Drift, Volatility, Sentiment, Position_flag, Unrealized_PnL]
 *
 * @param {Object} analysisResult - Result from analyzeStock()
 * @param {Object} portfolio - Portfolio state {holdings, unrealized_pnl}
 * @param {boolean} hasPosition - Whether currently holding the stock
 * @param {number} unrealizedPnL - Unrealized P&L in dollars
 * @returns {Array<number>} Normalized state vector (12 elements)
 */
export function buildStateVector(
  analysisResult,
  portfolio = {},
  hasPosition = false,
  unrealizedPnL = 0,
) {
  if (!analysisResult) {
    console.warn("Invalid analysis result for state vector");
    return getDefaultState();
  }

  try {
    // Extract components from analysis
    const rsi = analysisResult.rsi || 50;
    const macdHist = analysisResult.mH || 0;
    const bbPosition = analysisResult.bb
      ? normalizeToRange(
          (analysisResult.last - analysisResult.bb.lower) /
            (analysisResult.bb.upper - analysisResult.bb.lower) || 0.5,
        )
      : 0.5;

    // EMA spread: measure of trend strength
    const ema9 = analysisResult.ema9 || analysisResult.last;
    const ema21 = analysisResult.ema21 || analysisResult.last;
    const ema50 = analysisResult.ema50 || analysisResult.last;
    const emaTrend = (ema9 - ema50) / ema50; // Can be negative or positive
    const emaSpread = normalizeToSymmetric(emaTrend * 100); // Map to [-1, 1]

    // Volume ratio
    const volumeNorm = analysisResult.scores?.vol || 0;

    // PIEC metrics
    const entropy = analysisResult.ent?.normalized || 0.5;

    // RLFS metrics
    const rlfsScore = analysisResult.rlfs || 1.0;
    const drift = analysisResult.drift || 0;

    // Volatility (in percentage, normalize)
    const volatility = normalizeToRange(analysisResult.vol || 0, 0, 50);

    // Sentiment: based on composite score
    const sentiment = normalizeToSymmetric(analysisResult.composite * 10 || 0);

    // Position flag (0 or 1)
    const positionFlag = hasPosition ? 1.0 : 0.0;

    // Normalize unrealized P&L (assuming typical portfolio is $10k-$100k)
    const pnlNorm = normalizeToSymmetric(unrealizedPnL / 1000); // $1000 = 1.0 unit

    // Build state vector [12 elements]
    const state = [
      normalizeToRange(rsi, 0, 100), // RSI: [0, 1]
      normalizeToSymmetric(macdHist, 0, 0.1), // MACD: [-1, 1]
      bbPosition, // BB position: [0, 1]
      emaSpread, // EMA spread: [-1, 1]
      normalizeToRange(volumeNorm, -1, 1), // Volume: [0, 1]
      normalizeToRange(entropy, 0, 1), // Entropy: [0, 1]
      normalizeToRange(rlfsScore, 0, 1), // RLFS score: [0, 1]
      normalizeToRange(drift, 0, 1), // Drift: [0, 1]
      volatility, // Volatility: [0, 1]
      normalizeToSymmetric(sentiment, 0, 1), // Sentiment: [-1, 1]
      positionFlag, // Position: 0 or 1
      Math.max(-1, Math.min(1, pnlNorm)), // P&L: [-1, 1]
    ];

    // Validate all elements
    if (state.some((s) => !Number.isFinite(s))) {
      console.warn("Non-finite values in state vector, using defaults");
      return getDefaultState();
    }

    return state;
  } catch (e) {
    console.error("Error building state vector:", e);
    return getDefaultState();
  }
}

/**
 * Get default neutral state vector
 * @returns {Array<number>} Default state (all 0.5 or neutral)
 */
export function getDefaultState() {
  return [0.5, 0, 0.5, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0];
}

/**
 * Validate state vector
 * @param {Array<number>} state - State vector to validate
 * @returns {boolean} True if valid
 */
export function validateStateVector(state) {
  if (!Array.isArray(state)) return false;
  if (state.length !== 12) return false;
  return state.every((s) => Number.isFinite(s) && s >= -1 && s <= 1);
}

/**
 * Get human-readable state description
 * @param {Array<number>} state - State vector
 * @returns {Object} Human-readable descriptions
 */
export function describeState(state) {
  if (!validateStateVector(state)) return null;

  return {
    rsi: `RSI ${(state[0] * 100).toFixed(0)}%`,
    macd: `MACD ${state[1] > 0 ? "Bullish" : "Bearish"}`,
    bbPosition: `BB ${(state[2] * 100).toFixed(0)}%`,
    emaTrend: `EMA ${state[3] > 0 ? "Bullish" : "Bearish"}`,
    volume: `Vol ${(state[4] * 100).toFixed(0)}%`,
    entropy: `Entropy ${(state[5] * 100).toFixed(0)}% ${state[5] > 0.7 ? "Chaotic" : state[5] > 0.4 ? "Moderate" : "Trending"}`,
    rlfs: `RLFS ${(state[6] * 100).toFixed(0)}%`,
    drift: `Drift ${(state[7] * 100).toFixed(0)}%`,
    volatility: `Vol ${(state[8] * 100).toFixed(0)}%`,
    sentiment: `Sentiment ${state[9] > 0 ? "Bullish" : "Bearish"}`,
    position: state[10] === 1 ? "Holding" : "Flat",
    pnl: `PnL ${state[11] > 0 ? "+" : ""}${(state[11] * 1000).toFixed(0)}$`,
  };
}

/**
 * Build next state after trade outcome
 * @param {Object} newAnalysis - Fresh analysis result
 * @param {Object} portfolio - Updated portfolio
 * @param {boolean} hasPosition - New position flag
 * @param {number} newUnrealizedPnL - Updated unrealized P&L
 * @returns {Array<number>} Next state vector
 */
export function buildNextState(
  newAnalysis,
  portfolio = {},
  hasPosition = false,
  newUnrealizedPnL = 0,
) {
  return buildStateVector(
    newAnalysis,
    portfolio,
    hasPosition,
    newUnrealizedPnL,
  );
}

export default {
  normalizeToRange,
  normalizeToSymmetric,
  buildStateVector,
  getDefaultState,
  validateStateVector,
  describeState,
  buildNextState,
};
