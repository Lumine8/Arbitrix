/**
 * ═══════════════════════════════════════════════════════════════
 * REINFORCEMENT LEARNING ENGINE
 * Main orchestrator that coordinates RL pipeline
 * ═══════════════════════════════════════════════════════════════
 */

const PolicyModel = require("./policyModel");
const ActionSelector = require("./actionSelector");
const RewardEngine = require("./rewardEngine");
const ReplayBuffer = require("./replayBuffer");
const TrainingEngine = require("./trainer");
const ModelStorage = require("./modelStorage");

/**
 * Main RL Engine orchestrating the complete pipeline
 */
class RLEngine {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.config = {
      epsilon: 0.1,
      decayRate: 0.995,
      trainInterval: 20,
      batchSize: 32,
      bufferSize: 10000,
      modelDir: config.modelDir || "./models",
      ...config,
    };

    // Initialize components
    this.policyModel = new PolicyModel(12, 64, 32);
    this.actionSelector = new ActionSelector(
      this.config.epsilon,
      this.config.decayRate,
    );
    this.rewardEngine = new RewardEngine({
      drawdownPenalty: config.drawdownPenalty || 0.5,
      entropyPenalty: config.entropyPenalty || 0.3,
      driftPenalty: config.driftPenalty || 0.2,
    });
    this.replayBuffer = new ReplayBuffer(this.config.bufferSize);
    this.trainer = new TrainingEngine(
      this.policyModel,
      this.replayBuffer,
      this.rewardEngine,
      {
        trainInterval: this.config.trainInterval,
        batchSize: this.config.batchSize,
        minBufferSize: Math.min(50, this.config.batchSize * 2),
      },
    );
    this.modelStorage = new ModelStorage(this.config.modelDir);

    this.sessionStart = new Date();
    this.decisions = [];
    this.lastState = null;
    this.lastAction = null;
    this.lastReward = null;

    console.log(
      `\n✓ RL Engine initialized (${this.enabled ? "enabled" : "disabled"})`,
    );
  }

  /**
   * Make decision using RL policy
   * @param {Object} analysisResult - Result from analyzeStock()
   * @param {Array<number>} state - Normalized state vector
   * @param {Object} options - {useRL: boolean, forceAction: string, portfolio: Object}
   * @returns {Promise<Object>} Decision with action, confidence, etc.
   */
  async decideAction(analysisResult, state, options = {}) {
    try {
      const {
        useRL = this.enabled,
        forceAction = null,
        portfolio = {},
      } = options;

      if (!useRL) {
        // Fallback to traditional signal logic
        return {
          action: analysisResult.signal || "HOLD",
          confidence: analysisResult.confidence || 50,
          source: "traditional",
          rlUsed: false,
        };
      }

      // Get policy prediction
      const policyOutput = await this.policyModel.predict(state);

      // Select action with epsilon-greedy
      const actionResult = this.actionSelector.selectAction(policyOutput, {
        forceAction,
      });

      // Store for later reward calculation
      this.lastState = state;
      this.lastAction = actionResult.action;

      return {
        action: actionResult.action,
        actionIdx: actionResult.actionIdx,
        confidence: (actionResult.confidence * 100).toFixed(1),
        probs: actionResult.probs.map((p) => parseFloat(p.toFixed(4))),
        source: actionResult.source,
        isExploration: actionResult.isExploration,
        epsilon: actionResult.epsilon,
        rlUsed: true,
        timestamp: new Date(),
        policyOutput,
      };
    } catch (e) {
      console.error("Error in RL decision:", e);
      return {
        action: analysisResult.signal || "HOLD",
        confidence: analysisResult.confidence || 50,
        source: "fallback",
        rlUsed: false,
        error: e.message,
      };
    }
  }

  /**
   * Process trade outcome and update learning
   * @param {Object} tradeOutcome - {actualPnL, predictedDirection, actualDirection, entropy, rlfsScore, ...}
   * @param {Array<number>} nextState - State after trade
   * @returns {Promise<Object>} Training result
   */
  async processOutcome(tradeOutcome, nextState) {
    try {
      if (!this.enabled || !this.lastState || !this.lastAction) {
        return {
          processed: false,
          reason: "RL not enabled or no previous decision",
        };
      }

      // Calculate reward
      const { reward, breakdown } =
        this.rewardEngine.calculateReward(tradeOutcome);

      // Store experience
      const experience = {
        state: this.lastState,
        action: this.lastAction,
        reward,
        nextState: nextState || this.lastState,
        done: tradeOutcome.done || false,
        timestamp: new Date(),
      };

      // Add to training and potentially train
      const trainingResult =
        await this.trainer.addExperienceAndTrain(experience);

      // Decay exploration
      this.actionSelector.decayEpsilon();

      // Record decision
      this.decisions.push({
        state: this.lastState,
        action: this.lastAction,
        reward,
        rewardBreakdown: breakdown,
        trainingResult,
      });

      // Keep last 1000 decisions
      if (this.decisions.length > 1000) {
        this.decisions.shift();
      }

      return {
        processed: true,
        reward,
        breakdown,
        trained: trainingResult.trained,
        trainingResult,
      };
    } catch (e) {
      console.error("Error processing outcome:", e);
      return { processed: false, error: e.message };
    }
  }

  /**
   * Get RL statistics
   * @returns {Object}
   */
  getStats() {
    return {
      enabled: this.enabled,
      sessionStart: this.sessionStart,
      decisions: this.decisions.length,
      policyModel: this.policyModel.getSummary(),
      actionSelector: this.actionSelector.getStats(),
      rewardStats: this.rewardEngine.getRewardStats(),
      replayBuffer: this.replayBuffer.getStats(),
      training: this.trainer.getTrainingStats(),
      recommendedAction: this.trainer.getTrainingRecommendation(),
    };
  }

  /**
   * Save trained model
   * @param {string} modelName - Model name
   * @returns {Promise<boolean>}
   */
  async saveModel(modelName = "policy_model") {
    try {
      const metadata = {
        sessionStart: this.sessionStart,
        decisions: this.decisions.length,
        trainingStats: this.trainer.getTrainingStats(),
      };
      return await this.modelStorage.saveModel(
        this.policyModel,
        metadata,
        modelName,
      );
    } catch (e) {
      console.error("Error saving model:", e);
      return false;
    }
  }

  /**
   * Load previously trained model
   * @param {string} modelName - Model name
   * @returns {Promise<boolean>}
   */
  async loadModel(modelName = "policy_model") {
    try {
      const loaded = await this.policyModel.loadModel(
        `${this.config.modelDir}/${modelName}`,
      );
      if (loaded) {
        console.log(`✓ Loaded trained model: ${modelName}`);
      }
      return loaded;
    } catch (e) {
      console.error("Error loading model:", e);
      return false;
    }
  }

  /**
   * Get learning curve data
   * @returns {Array<Object>}
   */
  getLearningCurve() {
    return this.trainer.getTrainingHistory().map((entry, idx) => ({
      cycle: entry.cycle,
      loss: entry.loss,
      accuracy: entry.accuracy,
      timestamp: entry.timestamp,
    }));
  }

  /**
   * Reset RL engine
   */
  reset() {
    this.policyModel = new PolicyModel(12, 64, 32);
    this.actionSelector.resetEpsilon();
    this.rewardEngine.resetHistory();
    this.replayBuffer.clear();
    this.trainer.resetTraining();
    this.decisions = [];
    this.lastState = null;
    this.lastAction = null;
    this.sessionStart = new Date();
    console.log("✓ RL Engine reset");
  }

  /**
   * List available models
   * @returns {Array<string>}
   */
  listModels() {
    return this.modelStorage.listModels();
  }

  /**
   * Export model for deployment
   * @param {string} modelName - Model name
   * @param {string} exportPath - Export path
   * @returns {boolean}
   */
  exportModel(modelName = "policy_model", exportPath = "./exported_model") {
    return this.modelStorage.exportModel(modelName, exportPath);
  }
}

module.exports = RLEngine;
