/**
 * ═══════════════════════════════════════════════════════════════
 * TRAINING ENGINE
 * Orchestrates RL training loop
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Training engine for RL policy
 */
class TrainingEngine {
  constructor(policyModel, replayBuffer, rewardEngine, config = {}) {
    this.policyModel = policyModel;
    this.replayBuffer = replayBuffer;
    this.rewardEngine = rewardEngine;

    this.trainInterval = config.trainInterval || 20; // Train every N trades
    this.batchSize = config.batchSize || 32; // Training batch size
    this.minBufferSize = config.minBufferSize || 50; // Min experiences before training
    this.trainingEnabled = config.trainingEnabled !== false;

    this.tradeCount = 0;
    this.trainingHistory = [];
    this.lastTrainingStep = 0;
  }

  /**
   * Add trade experience and potentially trigger training
   * @param {Object} experience - {state, action, reward, nextState, done}
   * @returns {Object} {trained: boolean, result: Object}
   */
  async addExperienceAndTrain(experience) {
    try {
      // Add to buffer
      this.replayBuffer.add(experience);
      this.tradeCount++;

      const stats = {
        tradeCount: this.tradeCount,
        bufferSize: this.replayBuffer.buffer.length,
        trained: false,
      };

      // Check if we should train
      if (!this.trainingEnabled) {
        return { ...stats, reason: "Training disabled" };
      }

      if (this.replayBuffer.buffer.length < this.minBufferSize) {
        return {
          ...stats,
          reason: `Insufficient data: ${this.replayBuffer.buffer.length}/${this.minBufferSize}`,
        };
      }

      if (this.tradeCount - this.lastTrainingStep < this.trainInterval) {
        return {
          ...stats,
          reason: `Wait for next training: ${this.tradeCount - this.lastTrainingStep}/${this.trainInterval}`,
        };
      }

      // === TRAIN ===
      const trainingResult = await this.train();
      stats.trained = true;
      stats.result = trainingResult;

      return stats;
    } catch (e) {
      console.error("Error in addExperienceAndTrain:", e);
      return { tradeCount: this.tradeCount, trained: false, error: e.message };
    }
  }

  /**
   * Train the policy model
   * @returns {Promise<Object>} Training result
   */
  async train() {
    try {
      if (this.replayBuffer.buffer.length < this.minBufferSize) {
        return { error: "Not enough experiences" };
      }

      console.log(`\n🧠 RL Training Cycle #${this.trainingHistory.length + 1}`);
      console.log(`   Buffer: ${this.replayBuffer.buffer.length} experiences`);

      // Sample batch
      const batch = this.replayBuffer.sample(this.batchSize);
      if (batch.length === 0) {
        return { error: "Empty batch" };
      }

      // Train model on batch
      const trainResult = await this.policyModel.trainOnBatch(batch);

      if (trainResult.error) {
        console.warn("⚠️ Training error:", trainResult.error);
        return trainResult;
      }

      // Record training statistics
      const trainingEntry = {
        timestamp: new Date(),
        cycle: this.trainingHistory.length + 1,
        loss: trainResult.loss,
        accuracy: trainResult.accuracy,
        batchSize: batch.length,
        bufferSize: this.replayBuffer.buffer.length,
      };

      this.trainingHistory.push(trainingEntry);
      this.lastTrainingStep = this.tradeCount;

      // Keep last 100 training cycles
      if (this.trainingHistory.length > 100) {
        this.trainingHistory.shift();
      }

      console.log(
        `   Loss: ${trainResult.loss?.toFixed(4)} | Accuracy: ${trainResult.accuracy?.toFixed(4)}`,
      );
      console.log(
        `   Reward Stats: ${JSON.stringify(this.rewardEngine.getRewardStats())}`,
      );

      return {
        cycle: trainingEntry.cycle,
        loss: trainResult.loss,
        accuracy: trainResult.accuracy,
        batchSize: batch.length,
        recommended: this.getTrainingRecommendation(),
      };
    } catch (e) {
      console.error("Error in training:", e);
      return { error: e.message };
    }
  }

  /**
   * Get training statistics
   * @returns {Object}
   */
  getTrainingStats() {
    if (this.trainingHistory.length === 0) {
      return {
        trained: false,
        cycles: 0,
        totalTrades: this.tradeCount,
      };
    }

    const recent = this.trainingHistory.slice(-5);
    const avgLoss =
      recent.reduce((sum, t) => sum + (t.loss || 0), 0) / recent.length;
    const avgAccuracy =
      recent.reduce((sum, t) => sum + (t.accuracy || 0), 0) / recent.length;

    return {
      trained: true,
      cycles: this.trainingHistory.length,
      totalTrades: this.tradeCount,
      recentAvgLoss: parseFloat(avgLoss.toFixed(4)),
      recentAvgAccuracy: parseFloat(avgAccuracy.toFixed(4)),
      bufferSize: this.replayBuffer.buffer.length,
      bufferFillPercentage: parseFloat(
        (
          (this.replayBuffer.buffer.length / this.replayBuffer.maxSize) *
          100
        ).toFixed(2),
      ),
    };
  }

  /**
   * Get recommendation for continuing training
   * @returns {string}
   */
  getTrainingRecommendation() {
    const stats = this.getTrainingStats();

    if (stats.recentAvgLoss > 0.5) {
      return "loss_high - model needs more training";
    }
    if (stats.recentAvgAccuracy < 0.4) {
      return "accuracy_low - consider adjusting learning rate";
    }
    if (stats.bufferFillPercentage > 80) {
      return "buffer_full - consider reducing buffer size or increasing training frequency";
    }

    return "training_proceeding_well";
  }

  /**
   * Get training history
   * @returns {Array<Object>}
   */
  getTrainingHistory() {
    return this.trainingHistory;
  }

  /**
   * Reset training state
   */
  resetTraining() {
    this.replayBuffer.clear();
    this.trainingHistory = [];
    this.tradeCount = 0;
    this.lastTrainingStep = 0;
  }

  /**
   * Set training parameters
   * @param {Object} config
   */
  updateConfig(config) {
    if (config.trainInterval !== undefined)
      this.trainInterval = config.trainInterval;
    if (config.batchSize !== undefined) this.batchSize = config.batchSize;
    if (config.minBufferSize !== undefined)
      this.minBufferSize = config.minBufferSize;
    if (config.trainingEnabled !== undefined)
      this.trainingEnabled = config.trainingEnabled;
  }
}

module.exports = TrainingEngine;
