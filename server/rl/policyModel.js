/**
 * ═══════════════════════════════════════════════════════════════
 * RL POLICY MODEL
 * TensorFlow.js-based policy network for BUY/SELL/HOLD
 * Architecture: Input(12) → Dense(64,ReLU) → Dense(32,ReLU) → Output(3,Softmax)
 * ═══════════════════════════════════════════════════════════════
 */

const tf = require("@tensorflow/tfjs-node");

/**
 * Policy Network for RL agent
 * Outputs probability distribution over [BUY, SELL, HOLD]
 */
class PolicyModel {
  constructor(inputSize = 12, hiddenSize1 = 64, hiddenSize2 = 32) {
    this.inputSize = inputSize;
    this.hiddenSize1 = hiddenSize1;
    this.hiddenSize2 = hiddenSize2;
    this.outputSize = 3;
    this.model = null;
    this.isTraining = false;
    this.trainHistory = [];

    this.buildModel();
  }

  /**
   * Build the neural network model
   */
  buildModel() {
    try {
      this.model = tf.sequential({
        layers: [
          // Input layer
          tf.layers.dense({
            units: this.hiddenSize1,
            activation: "relu",
            inputShape: [this.inputSize],
            kernelInitializer: "heNormal",
            name: "input_dense",
          }),

          // Dropout for regularization
          tf.layers.dropout({ rate: 0.2 }),

          // Hidden layer 2
          tf.layers.dense({
            units: this.hiddenSize2,
            activation: "relu",
            kernelInitializer: "heNormal",
            name: "hidden_dense",
          }),

          // Dropout
          tf.layers.dropout({ rate: 0.2 }),

          // Output layer with softmax (probability distribution)
          tf.layers.dense({
            units: this.outputSize,
            activation: "softmax",
            kernelInitializer: "glorotUniform",
            name: "output_dense",
          }),
        ],
      });

      // Compile with Adam optimizer
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"],
      });

      console.log("✓ Policy model built successfully");
      console.log(
        "  Architecture: Input(12) → Dense(64,ReLU) → Dense(32,ReLU) → Output(3,Softmax)",
      );
    } catch (e) {
      console.error("Error building policy model:", e);
      throw e;
    }
  }

  /**
   * Predict action probabilities for a given state
   * @param {Array<number>} state - Normalized state vector [12 elements]
   * @returns {Promise<{action: string, probs: Array<number>}>}
   */
  async predict(state) {
    try {
      if (!Array.isArray(state) || state.length !== this.inputSize) {
        throw new Error(
          `State must be array of length ${this.inputSize}, got ${state.length}`,
        );
      }

      // Ensure valid inputs
      const validState = state.map((s) => {
        if (!Number.isFinite(s)) return 0;
        return s;
      });

      const input = tf.tensor2d([validState]);
      const output = this.model.predict(input);
      const probs = await output.data();

      // Convert to array
      const probsArray = Array.from(probs).map((p) => parseFloat(p.toFixed(4)));

      // Clean up tensors
      input.dispose();
      output.dispose();

      // Map to action
      const actionIdx = probsArray.indexOf(Math.max(...probsArray));
      const actions = ["BUY", "SELL", "HOLD"];
      const action = actions[actionIdx];

      return {
        action,
        actionIdx,
        probs: probsArray,
        confidence: probsArray[actionIdx],
      };
    } catch (e) {
      console.error("Error in policy prediction:", e);
      // Return default HOLD action
      return {
        action: "HOLD",
        actionIdx: 2,
        probs: [0.33, 0.33, 0.34],
        confidence: 0.34,
        error: e.message,
      };
    }
  }

  /**
   * Train the model on experiences
   * @param {Array<{state, action, reward, nextState, done}>} experiences - Training batch
   * @returns {Promise<Object>} Training history
   */
  async trainOnBatch(experiences) {
    if (!experiences || experiences.length === 0) {
      return { loss: null, accuracy: null };
    }

    try {
      this.isTraining = true;

      // Prepare training data
      const states = [];
      const targets = [];
      const actionMap = { BUY: 0, SELL: 1, HOLD: 2 };

      for (const exp of experiences) {
        if (!exp.state || !exp.action) {
          console.warn("Skipping malformed experience");
          continue;
        }

        states.push(exp.state);

        // Create target: one-hot encoding for action
        const target = [0, 0, 0];
        const actionIdx = actionMap[exp.action] || 2;

        // Use reward as the target value for the action
        const scaledReward = Math.tanh(exp.reward / 100); // Scale reward to [-1, 1]
        target[actionIdx] = Math.max(-1, Math.min(1, scaledReward + 0.5)); // Convert to [0, 1]

        targets.push(target);
      }

      if (states.length === 0) {
        return { loss: null, accuracy: null };
      }

      // Convert to tensors
      const inputTensor = tf.tensor2d(states);
      const targetTensor = tf.tensor2d(targets);

      // Train the model
      const history = await this.model.fit(inputTensor, targetTensor, {
        epochs: 1,
        batchSize: Math.min(32, states.length),
        verbose: 0,
        shuffle: true,
      });

      const loss = history.history.loss[0];
      const accuracy = history.history.acc ? history.history.acc[0] : 0;

      // Update training history
      this.trainHistory.push({
        timestamp: new Date(),
        loss,
        accuracy,
        sampleCount: states.length,
      });

      // Keep last 100 iterations only
      if (this.trainHistory.length > 100) {
        this.trainHistory.shift();
      }

      // Cleanup
      inputTensor.dispose();
      targetTensor.dispose();
      history.dispose ? history.dispose() : null;

      this.isTraining = false;

      return { loss, accuracy, sampleCount: states.length };
    } catch (e) {
      console.error("Error training policy model:", e);
      this.isTraining = false;
      return { loss: null, accuracy: null, error: e.message };
    }
  }

  /**
   * Get training progress
   * @returns {Object} Training statistics
   */
  getTrainingProgress() {
    if (this.trainHistory.length === 0) {
      return { trained: false, iterations: 0 };
    }

    const recent = this.trainHistory.slice(-10);
    const avgLoss = recent.reduce((sum, h) => sum + h.loss, 0) / recent.length;
    const avgAccuracy =
      recent.reduce((sum, h) => sum + h.accuracy, 0) / recent.length;

    return {
      trained: true,
      iterations: this.trainHistory.length,
      recentAvgLoss: parseFloat(avgLoss.toFixed(4)),
      recentAvgAccuracy: parseFloat(avgAccuracy.toFixed(4)),
      isTraining: this.isTraining,
      lastUpdate: this.trainHistory[this.trainHistory.length - 1].timestamp,
    };
  }

  /**
   * Save model to file
   * @param {string} path - File path to save model
   * @returns {Promise<boolean>}
   */
  async saveModel(path) {
    try {
      if (!this.model) {
        throw new Error("No model to save");
      }

      await this.model.save(`file://${path}`);
      console.log(`✓ Model saved to ${path}`);
      return true;
    } catch (e) {
      console.error("Error saving model:", e);
      return false;
    }
  }

  /**
   * Load model from file
   * @param {string} path - File path to load model from
   * @returns {Promise<boolean>}
   */
  async loadModel(path) {
    try {
      this.model = await tf.loadLayersModel(`file://${path}/model.json`);
      console.log(`✓ Model loaded from ${path}`);
      return true;
    } catch (e) {
      console.error("Error loading model:", e);
      console.warn("Creating new model instead");
      this.buildModel();
      return false;
    }
  }

  /**
   * Get model summary
   * @returns {Object}
   */
  getSummary() {
    return {
      inputSize: this.inputSize,
      hiddenSize1: this.hiddenSize1,
      hiddenSize2: this.hiddenSize2,
      outputSize: this.outputSize,
      trainable: this.model ? this.model.trainable : false,
      trained: this.trainHistory.length > 0,
      trainingIterations: this.trainHistory.length,
    };
  }

  /**
   * Dispose model and free memory
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

module.exports = PolicyModel;
