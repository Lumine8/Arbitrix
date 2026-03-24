/**
 * ═══════════════════════════════════════════════════════════════
 * REPLAY BUFFER
 * Experience storage for training
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Experience replay buffer
 * Stores (state, action, reward, next_state, done) tuples
 */
class ReplayBuffer {
  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
    this.buffer = [];
    this.position = 0;
  }

  /**
   * Add experience to buffer
   * @param {Object} experience - {state, action, reward, nextState, done}
   */
  add(experience) {
    if (!experience || !experience.state || !experience.action) {
      console.warn("Invalid experience, skipping");
      return;
    }

    // Validate experience
    const validExp = {
      state: Array.isArray(experience.state) ? experience.state : null,
      action: ["BUY", "SELL", "HOLD"].includes(experience.action)
        ? experience.action
        : "HOLD",
      reward: Number.isFinite(experience.reward) ? experience.reward : 0,
      nextState: Array.isArray(experience.nextState)
        ? experience.nextState
        : null,
      done: Boolean(experience.done),
      timestamp: experience.timestamp || new Date(),
    };

    if (!validExp.state || !validExp.nextState) {
      console.warn("Invalid state in experience");
      return;
    }

    // Add to buffer (FIFO with replacement)
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(validExp);
    } else {
      this.buffer[this.position] = validExp;
      this.position = (this.position + 1) % this.maxSize;
    }
  }

  /**
   * Sample random batch from buffer
   * @param {number} batchSize - Number of samples
   * @returns {Array<Object>} Random batch
   */
  sample(batchSize = 32) {
    if (this.buffer.length === 0) {
      return [];
    }

    const batch = [];
    const batchSizeAdjusted = Math.min(batchSize, this.buffer.length);

    // Prevent same experience appearing multiple times in a batch
    const indices = new Set();
    while (indices.size < batchSizeAdjusted) {
      indices.add(Math.floor(Math.random() * this.buffer.length));
    }

    for (const idx of indices) {
      batch.push(this.buffer[idx]);
    }

    return batch;
  }

  /**
   * Get last N experiences
   * @param {number} n - Number of experiences
   * @returns {Array<Object>}
   */
  getLast(n = 10) {
    const start = Math.max(0, this.buffer.length - n);
    return this.buffer.slice(start);
  }

  /**
   * Get buffer statistics
   * @returns {Object}
   */
  getStats() {
    if (this.buffer.length === 0) {
      return {
        size: 0,
        maxSize: this.maxSize,
        fillPercentage: 0,
        avgReward: 0,
      };
    }

    const rewards = this.buffer.map((e) => e.reward);
    const avgReward = rewards.reduce((a, b) => a + b, 0) / rewards.length;
    const maxReward = Math.max(...rewards);
    const minReward = Math.min(...rewards);

    return {
      size: this.buffer.length,
      maxSize: this.maxSize,
      fillPercentage: parseFloat(
        ((this.buffer.length / this.maxSize) * 100).toFixed(2),
      ),
      avgReward: parseFloat(avgReward.toFixed(2)),
      maxReward: parseFloat(maxReward.toFixed(2)),
      minReward: parseFloat(minReward.toFixed(2)),
    };
  }

  /**
   * Clear bufffer
   */
  clear() {
    this.buffer = [];
    this.position = 0;
  }

  /**
   * Check if buffer is ready for training
   * @param {number} minSize - Minimum size required
   * @returns {boolean}
   */
  isReady(minSize = 32) {
    return this.buffer.length >= minSize;
  }

  /**
   * Get experience distribution by action
   * @returns {Object}
   */
  getActionDistribution() {
    const dist = { BUY: 0, SELL: 0, HOLD: 0 };
    for (const exp of this.buffer) {
      dist[exp.action]++;
    }
    return {
      BUY: parseFloat(((dist.BUY / this.buffer.length) * 100).toFixed(2)),
      SELL: parseFloat(((dist.SELL / this.buffer.length) * 100).toFixed(2)),
      HOLD: parseFloat(((dist.HOLD / this.buffer.length) * 100).toFixed(2)),
    };
  }
}

module.exports = ReplayBuffer;
