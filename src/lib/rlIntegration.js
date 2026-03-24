/**
 * ═══════════════════════════════════════════════════════════════
 * RL INTEGRATION WRAPPER
 * Bridges RL engine with existing analyze.js logic
 * ═══════════════════════════════════════════════════════════════
 */

import { buildStateVector, validateStateVector } from "./stateBuilder";

/**
 * Wrapper function to integrate RL with traditional analysis
 * @param {Object} analysisResult - Result from analyzeStock()
 * @param {Object} rlEngine - RLEngine instance (optional)
 * @param {Object} portfolio - Current portfolio state
 * @param {boolean} useRL - Whether to use RL
 * @returns {Promise<Object>} Enhanced analysis with RL decision
 */
export async function enhanceAnalysisWithRL(
  analysisResult,
  rlEngine = null,
  portfolio = {},
  useRL = true,
) {
  try {
    if (!useRL || !rlEngine) {
      // Return original analysis
      return {
        ...analysisResult,
        rl: null,
        usedRL: false,
      };
    }

    // Build state vector from analysis
    const hasPosition = portfolio.holdings && portfolio.holdings.length > 0;
    const unrealizedPnL = portfolio.unrealizedPnL || 0;

    const state = buildStateVector(
      analysisResult,
      portfolio,
      hasPosition,
      unrealizedPnL,
    );

    // Validate state
    if (!validateStateVector(state)) {
      console.warn("Invalid state vector, falling back to traditional signal");
      return {
        ...analysisResult,
        rl: null,
        usedRL: false,
      };
    }

    // Get RL decision
    const rlDecision = await rlEngine.decideAction(analysisResult, state, {
      useRL: true,
      portfolio,
    });

    // Blend RL decision with traditional signal for fallback safety
    const blendedDecision = blendDecisions(analysisResult, rlDecision);

    return {
      ...analysisResult,
      rl: {
        decision: rlDecision,
        state,
        blended: blendedDecision,
      },
      usedRL: true,
      // Override signal with RL if confident
      signal:
        rlDecision.confidence > 60 ? rlDecision.action : analysisResult.signal,
      confidence:
        rlDecision.confidence > 60
          ? rlDecision.confidence
          : analysisResult.confidence,
    };
  } catch (e) {
    console.error("Error enhancing analysis with RL:", e);
    return {
      ...analysisResult,
      rl: null,
      usedRL: false,
      error: e.message,
    };
  }
}

/**
 * Blend RL and traditional decisions for safety
 * Uses RL if confident, otherwise falls back to traditional signal
 * @param {Object} analysisResult - Traditional analysis
 * @param {Object} rlDecision - RL decision
 * @returns {Object} Blended decision
 */
export function blendDecisions(analysisResult, rlDecision) {
  const analysisCertainty = analysisResult.confidence / 100;
  const rlCertainty = (rlDecision.confidence || 50) / 100;
  const totalCertainty = analysisCertainty + rlCertainty;

  // Weighted average of decisions (if numeric)
  const actionScores = {
    BUY: 0,
    SELL: 0,
    HOLD: 0,
  };

  // Add traditional signal weight
  if (analysisResult.signal === "BUY") {
    actionScores.BUY += analysisCertainty;
  } else if (analysisResult.signal === "SELL") {
    actionScores.SELL += analysisCertainty;
  } else {
    actionScores.HOLD += analysisCertainty;
  }

  // Add RL signal weight
  if (rlDecision.action === "BUY") {
    actionScores.BUY += rlCertainty;
  } else if (rlDecision.action === "SELL") {
    actionScores.SELL += rlCertainty;
  } else {
    actionScores.HOLD += rlCertainty;
  }

  // Normalize scores
  for (const action in actionScores) {
    actionScores[action] /= totalCertainty || 1;
  }

  // Pick action with highest score
  const bestAction = Object.keys(actionScores).reduce((best, action) =>
    actionScores[action] > actionScores[best] ? action : best,
  );

  const blendedConfidence = Math.max(analysisCertainty, rlCertainty) * 100;

  return {
    action: bestAction,
    confidence: parseFloat(blendedConfidence.toFixed(1)),
    scores: actionScores,
    reasoning: `Blended from TA (${analysisResult.signal}) and RL (${rlDecision.action})`,
  };
}

/**
 * Create extended decision log entry with RL data
 * @param {Object} baseDecision - Base decision from analyze.js
 * @param {Object} rlData - RL decision data
 * @returns {Object} Extended decision
 */
export function createExtendedDecisionLog(baseDecision, rlData = {}) {
  return {
    ...baseDecision,

    // RL-specific fields
    rl_enabled: Boolean(rlData.decision),
    rl_action: rlData.decision?.action || null,
    rl_confidence: rlData.decision?.confidence || null,
    rl_action_probs: rlData.decision?.probs || null,
    rl_is_exploration: rlData.decision?.isExploration || null,
    rl_epsilon: rlData.decision?.epsilon || null,
    rl_source: rlData.decision?.source || null,

    // State vector
    state_vector: rlData.state || null,

    // Blending info
    blend_strategy: "confidence_weighted",
    blend_info: rlData.blended || null,

    // Model info
    model_iteration: rlData.model_iteration || null,
    model_trained: rlData.model_trained || false,
  };
}

/**
 * Extract learning signals from trade outcome
 * @param {Object} tradeOutcome - Result of trade
 * @param {Object} originalAnalysis - Original analysis
 * @returns {Object} Learning signals for RL
 */
export function extractLearningSignals(tradeOutcome, originalAnalysis = {}) {
  return {
    actualPnL: tradeOutcome.pnl || 0,
    predictedDirection: originalAnalysis.signal || "HOLD",
    actualDirection: tradeOutcome.direction || "HOLD",
    actualPrice: tradeOutcome.closedPrice || 0,
    predictedPrice: originalAnalysis.targetPrice || 0,

    entropy: originalAnalysis.ent?.normalized || 0.5,
    rlfsScore: originalAnalysis.rlfs || 1.0,
    drift: originalAnalysis.drift || 0,

    confidence: originalAnalysis.confidence || 50,
    heldDays: tradeOutcome.heldDays || 1,
    maxDrawdown: tradeOutcome.maxDrawdown || 0,

    done: tradeOutcome.closed || false,
  };
}

export default {
  enhanceAnalysisWithRL,
  blendDecisions,
  createExtendedDecisionLog,
  extractLearningSignals,
};
