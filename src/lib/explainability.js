/* ═══════════════════════════════════════════════════════════════
   ARBITRIX — Enhanced PIEC Implementation
   PIEC with full explainability and regime interpretation
═══════════════════════════════════════════════════════════════ */

import {
  marketEntropy,
  rlfsStep,
  sadr,
  makeRLFS,
  RLFS_PARAMS,
  SADR_PARAMS,
} from "./piec";

/**
 * Enhanced PIEC Analysis with full interpretation
 */
export function analyzePIEC(history, mon) {
  if (!history || history.length < 30) return null;

  const closes = history.map((h) => h.close);
  const entropyResult = marketEntropy(closes);

  // Interpret entropy
  const entropyInterpretation = interpretEntropy(entropyResult.normalized);

  // Interpret RLFS
  const rlfsResult = rlfsStep(mon, extractFeatures(history, closes));
  const rlfsInterpretation = interpretRLFS(rlfsResult.drift, rlfsResult.rlfs);

  // Interpret S-ADR
  const sadrResult = sadr(rlfsResult.drift);
  const sadrInterpretation = interpretSADR(sadrResult.omega, sadrResult.tier);

  // Combined regime interpretation
  const regimeInterpretation = deriveRegimeInterpretation(
    entropyResult.normalized,
    rlfsResult.drift,
    sadrResult.tier,
  );

  return {
    entropy: {
      score: entropyResult.normalized,
      bins: entropyResult.bins,
      interpretation: entropyInterpretation,
      signal_attenuation: 1 - entropyResult.normalized * 0.4,
    },
    rlfs: {
      score: rlfsResult.rlfs,
      drift: rlfsResult.drift,
      interpretation: rlfsInterpretation,
      stability_confidence: rlfsResult.rlfs * 100,
    },
    sadr: {
      omega: sadrResult.omega,
      tier: sadrResult.tier,
      interpretation: sadrInterpretation,
      position_size: `${(sadrResult.omega * 100).toFixed(1)}%`,
    },
    regime: regimeInterpretation,
  };
}

/**
 * Extract normalized feature vector
 */
function extractFeatures(history, closes) {
  const n = closes.length;
  if (n < 20) return [0.5, 0.5, 0.5, 0.5, 0.5];

  // RSI
  let g = 0,
    l = 0;
  for (let i = Math.max(0, n - 15); i < n; i++) {
    const d = closes[i] - (i > 0 ? closes[i - 1] : closes[i]);
    if (d > 0) g += d;
    else l -= d;
  }
  const ag = g / 14,
    al = l / 14;
  const rsi = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  const rsiN = rsi / 100;

  // MACD
  const ema12 = simpleEMA(closes, 12);
  const ema26 = simpleEMA(closes, 26);
  const macdLine = ema12 - ema26;
  const macdN = Math.tanh(macdLine / (closes[n - 1] * 0.01)) * 0.5 + 0.5;

  // Bollinger position
  const sma20 = closes.slice(-20).reduce((a, b) => a + b) / 20;
  let variance = 0;
  for (let i = Math.max(0, n - 20); i < n; i++) {
    variance += (closes[i] - sma20) ** 2;
  }
  const std = Math.sqrt(variance / 20);
  const upper = sma20 + 2 * std;
  const lower = sma20 - 2 * std;
  const bbPos = (closes[n - 1] - lower) / (upper - lower);
  const bbPN = Math.max(0, Math.min(1, bbPos));

  // EMA spread
  const ema9 = simpleEMA(closes, 9);
  const ema50 = simpleEMA(closes, 50);
  const emaSpr = (ema9 - ema50) / ema50;
  const emaN = Math.tanh(emaSpr * 10) * 0.5 + 0.5;

  // Volume ratio
  const recentVol = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const histVol = closes.slice(-20, -5).reduce((a, b) => a + b, 0) / 15;
  const volR = Math.tanh((recentVol / histVol - 1) * 2) * 0.5 + 0.5;

  return [rsiN, macdN, bbPN, emaN, volR];
}

/**
 * Simple EMA calculation
 */
function simpleEMA(prices, n) {
  const k = 2 / (n + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * Interpret entropy score
 */
export function interpretEntropy(entropy) {
  if (entropy < 0.3) {
    return {
      regime: "low_entropy",
      label: "Strong Directional Trend",
      description:
        "Market is trending strongly in a clear direction. Signals are highly reliable.",
      confidence_multiplier: 1.2,
      trade_frequency: "High - More signals reliable",
      risk_level: "Lower in this regime",
    };
  } else if (entropy < 0.5) {
    return {
      regime: "moderate_entropy",
      label: "Transitional Market",
      description: "Market is between regimes. Mix of trend and randomness.",
      confidence_multiplier: 1.0,
      trade_frequency: "Moderate - Be selective",
      risk_level: "Moderate",
    };
  } else if (entropy < 0.7) {
    return {
      regime: "high_entropy",
      label: "Chaotic/Mean-Reverting Market",
      description:
        "Market behavior is largely random. Directional signals less reliable.",
      confidence_multiplier: 0.8,
      trade_frequency: "Low - Wait for clearer signals",
      risk_level: "Higher in this regime",
    };
  } else {
    return {
      regime: "very_high_entropy",
      label: "Highly Chaotic Market",
      description:
        "Market is extremely noisy. Avoid trading or use defensive strategies.",
      confidence_multiplier: 0.6,
      trade_frequency: "Very Low - Too risky",
      risk_level: "Very High",
    };
  }
}

/**
 * Interpret RLFS drift score
 */
export function interpretRLFS(drift, rlfs_score) {
  if (drift < RLFS_PARAMS.GAMMA * 0.3) {
    return {
      stability: "Very Stable",
      label: "Stable Feature Representation",
      description: "Indicator features are consistent and reliable. Low drift.",
      reliability: "Very High",
      signal_trust: 1.0,
      recommendation: "Trust all signals at full weight",
    };
  } else if (drift < RLFS_PARAMS.GAMMA * 0.6) {
    return {
      stability: "Stable",
      label: "Slightly Drifting",
      description: "Some feature variation but still mostly stable.",
      reliability: "High",
      signal_trust: 0.85,
      recommendation: "Trust signals with caution",
    };
  } else if (drift < RLFS_PARAMS.GAMMA * 0.9) {
    return {
      stability: "Degraded",
      label: "Moderate Drift Detected",
      description:
        "Feature representation is shifting. Signal reliability declining.",
      reliability: "Moderate",
      signal_trust: 0.6,
      recommendation:
        "Reduce position size and increase confirmation requirements",
    };
  } else {
    return {
      stability: "Rejected",
      label: "High Drift - Features Unreliable",
      description:
        "Significant market regime change. Signals cannot be trusted.",
      reliability: "Low",
      signal_trust: 0.3,
      recommendation: "Avoid trading or switch to conservative strategy",
    };
  }
}

/**
 * Interpret S-ADR position sizing tier
 */
export function interpretSADR(omega, tier) {
  const tierInfo = {
    STABLE: {
      label: "Full Position Size",
      description:
        "Market is stable and signals are reliable. Use full position sizing.",
      position_management: "Full aggression (100% position)",
      risk_management: "Standard stops",
    },
    DEGRADED: {
      label: "Scaled Position Size",
      description:
        "Market shows signs of degradation. Reduce position size accordingly.",
      position_management: `Conservative scaling (${(omega * 100).toFixed(1)}% position)`,
      risk_management: "Tighter stops, lower leverage",
    },
    REJECTED: {
      label: "No Trading",
      description:
        "System has rejected trading due to excessive drift. Do not trade.",
      position_management: "No positions (0% position)",
      risk_management: "Wait for regime stabilization",
    },
  };

  return {
    tier,
    omega,
    ...(tierInfo[tier] || tierInfo.STABLE),
  };
}

/**
 * Derive overall regime interpretation
 */
export function deriveRegimeInterpretation(entropy, drift, tier) {
  let overall_regime = "NEUTRAL";
  let market_character = "";
  let trading_bias = "";
  let recommended_strategy = "";

  // Regime classification
  if (entropy < 0.4 && drift < 0.3 && tier === "STABLE") {
    overall_regime = "STRONG_TREND";
    market_character = "Clear directional market with stable conditions";
    trading_bias = "Follow the trend aggressively";
    recommended_strategy = "Momentum trading, trend-following";
  } else if (entropy < 0.4 && drift > 0.5) {
    overall_regime = "TREND_WITH_DRIFT";
    market_character = "Trending but with feature instability";
    trading_bias =
      "Trade carefully - trend is present but signals are shifting";
    recommended_strategy = "Reduced position sizes, higher confirmation needs";
  } else if (entropy > 0.6 && drift < 0.3) {
    overall_regime = "MEAN_REVERSION";
    market_character = "Choppy, mean-reverting market with stable indicators";
    trading_bias = "Fade extremes, expect reversals";
    recommended_strategy = "Counter-trend, range-bound strategies";
  } else if (entropy > 0.6 && drift > 0.5) {
    overall_regime = "CHAOTIC_DRIFT";
    market_character = "High noise + feature instability = unreliable signals";
    trading_bias = "Avoid trading or use minimal position sizes";
    recommended_strategy = "Defensive, sit on sidelines or hedge";
  } else if (tier === "DEGRADED") {
    overall_regime = "REGIME_CHANGE";
    market_character = "Market regime is shifting";
    trading_bias = "Very cautious - waiting for new regime to establish";
    recommended_strategy = "Observation mode, very small position test trades";
  } else {
    overall_regime = "TRANSITIONAL";
    market_character = "Between clear regimes";
    trading_bias = "Wait for clarity or be very selective";
    recommended_strategy = "Pick highest conviction trades only";
  }

  return {
    overall_regime,
    market_character,
    trading_bias,
    recommended_strategy,
    entropy_regime: interpretEntropy(entropy).regime,
    drift_status: interpretRLFS(drift, Math.exp(-1.2 * drift)).stability,
    position_tier: tier,
  };
}

/**
 * Generate PIEC explanation for UI
 */
export function generatePIECExplanation(piecAnalysis) {
  if (!piecAnalysis) return "";

  const { entropy, rlfs, sadr, regime } = piecAnalysis;

  const lines = [
    `📊 PIEC ANALYSIS:`,
    ``,
    `🌍 MARKET ENTROPY: ${entropy.label}`,
    `   Entropy Score: ${(entropy.score * 100).toFixed(1)}% - ${entropy.interpretation.description}`,
    `   Signal Reliability: ${(entropy.confidence_multiplier * 100).toFixed(0)}%`,
    ``,
    `🔍 RLFS (Feature Stability): ${rlfs.label}`,
    `   Drift: ${(rlfs.drift * 100).toFixed(2)}% - ${rlfs.interpretation.description}`,
    `   Signal Trust: ${(rlfs.signal_trust * 100).toFixed(0)}%`,
    `   ${rlfs.interpretation.recommendation}`,
    ``,
    `⚖️ S-ADR (Position Sizing): ${sadr.label}`,
    `   Position Size: ${sadr.position_size}`,
    `   ${sadr.interpretation.position_management}`,
    ``,
    `🎯 OVERALL REGIME: ${regime.overall_regime}`,
    `   ${regime.market_character}`,
    `   Trading Bias: ${regime.trading_bias}`,
    `   Strategy: ${regime.recommended_strategy}`,
  ];

  return lines.join("\n");
}

/**
 * Get PIEC summary for decision reasoning
 */
export function getPIECSummary(piecAnalysis) {
  if (!piecAnalysis) return "N/A";

  const entropy_regime = piecAnalysis.entropy.interpretation.regime;
  const drift_status = piecAnalysis.rlfs.interpretation.stability;
  const position_tier = piecAnalysis.sadr.tier;

  return `Regime: ${entropy_regime} | Stability: ${drift_status} | Position: ${position_tier}`;
}

export default {
  analyzePIEC,
  interpretEntropy,
  interpretRLFS,
  interpretSADR,
  deriveRegimeInterpretation,
  generatePIECExplanation,
  getPIECSummary,
};
