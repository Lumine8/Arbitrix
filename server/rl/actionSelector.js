/**
 * ═══════════════════════════════════════════════════════════════
 * ACTION SELECTOR
 * Epsilon-greedy strategy for exploration vs exploitation
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Action selector with epsilon-greedy exploration
 */
class ActionSelector {
  constructor(epsilon = 0.1, decayRate = 0.995, minEpsilon = 0.01) {
    this.epsilon = epsilon;
    this.initialEpsilon = epsilon;
    this.decayRate = decayRate;
    this.minEpsilon = minEpsilon;
    this.stepCount = 0;
  }

  /**
   * Select action using epsilon-greedy strategy
   * With probability ε: random action
   * With probability 1-ε: action from policy
   *
   * @param {Object} policyOutput - Output from policy.predict()
   * @param {Object} options - {useExploration: boolean, forceAction: string}
   * @returns {Object} {action, isExploration, epsilon}
   */
  selectAction(policyOutput, options = {}) {
    const { useExploration = true, forceAction = null } = options;

    // Override for forced action
    if (forceAction && ["BUY", "SELL", "HOLD"].includes(forceAction)) {
      return {
        action: forceAction,
        isExploration: false,
        epsilon: this.epsilon,
        source: "forced",
      };
    }

    // If no exploration, use policy action
    if (!useExploration) {
      return {
        action: policyOutput.action || "HOLD",
        actionIdx: policyOutput.actionIdx || 2,
        probs: policyOutput.probs || [0.33, 0.33, 0.34],
        isExploration: false,
        epsilon: this.epsilon,
        source: "policy",
      };
    }

    // Epsilon-greedy exploration
    const rand = Math.random();
    let action, actionIdx, source;

    if (rand < this.epsilon) {
      // Explore: random action
      actionIdx = Math.floor(Math.random() * 3);
      action = ["BUY", "SELL", "HOLD"][actionIdx];
      source = "exploration";
    } else {
      // Exploit: use policy action
      action = policyOutput.action || "HOLD";
      actionIdx = policyOutput.actionIdx || 2;
      source = "exploitation";
    }

    this.stepCount++;

    return {
      action,
      actionIdx,
      probs: policyOutput.probs || [0.33, 0.33, 0.34],
      isExploration: source === "exploration",
      epsilon: this.epsilon,
      source,
      confidence: policyOutput.confidence || 0.5,
    };
  }

  /**
   * Decay epsilon over time (reduce exploration)
   * @returns {number} New epsilon value
   */
  decayEpsilon() {
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.decayRate);
    return this.epsilon;
  }

  /**
   * Set epsilon manually
   * @param {number} value - New epsilon value [0, 1]
   */
  setEpsilon(value) {
    this.epsilon = Math.max(0, Math.min(1, value));
  }

  /**
   * Reset epsilon to initial value
   */
  resetEpsilon() {
    this.epsilon = this.initialEpsilon;
  }

  /**
   * Get selector statistics
   * @returns {Object}
   */
  getStats() {
    return {
      epsilon: parseFloat(this.epsilon.toFixed(4)),
      minEpsilon: this.minEpsilon,
      decayRate: this.decayRate,
      stepCount: this.stepCount,
      explorationRate: parseFloat((this.epsilon * 100).toFixed(2)),
    };
  }

  /**
   * Validate policy output
   * @param {Object} policyOutput - Output from policy
   * @returns {boolean}
   */
  static validatePolicyOutput(policyOutput) {
    if (!policyOutput) return false;
    if (!policyOutput.action) return false;
    if (!["BUY", "SELL", "HOLD"].includes(policyOutput.action)) return false;
    if (!Array.isArray(policyOutput.probs) || policyOutput.probs.length !== 3)
      return false;
    return true;
  }
}

module.exports = ActionSelector;
