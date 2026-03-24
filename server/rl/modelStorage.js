/**
 * ═══════════════════════════════════════════════════════════════
 * MODEL STORAGE
 * Save and load trained RL models
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require("fs");
const path = require("path");

/**
 * Model storage utility
 */
class ModelStorage {
  constructor(modelDir = "./models") {
    this.modelDir = modelDir;
    this.ensureDirectoryExists();
  }

  /**
   * Ensure model directory exists
   */
  ensureDirectoryExists() {
    if (!fs.existsSync(this.modelDir)) {
      fs.mkdirSync(this.modelDir, { recursive: true });
      console.log(`✓ Created model directory: ${this.modelDir}`);
    }
  }

  /**
   * Save model and metadata
   * @param {Object} policyModel - Trained policy model
   * @param {Object} metadata - Model metadata
   * @param {string} modelName - Model name
   * @returns {Promise<boolean>}
   */
  async saveModel(policyModel, metadata = {}, modelName = "policy_model") {
    try {
      const modelPath = path.join(this.modelDir, modelName);

      // Create model directory
      if (!fs.existsSync(modelPath)) {
        fs.mkdirSync(modelPath, { recursive: true });
      }

      // Save model weights
      if (policyModel.model) {
        await policyModel.model.save(`file://${modelPath}`);
        console.log(`✓ Saved model weights to ${modelPath}`);
      }

      // Save metadata
      const metadataPath = path.join(modelPath, "metadata.json");
      const fullMetadata = {
        timestamp: new Date().toISOString(),
        modelName,
        version: "1.0.0",
        architecture: {
          inputSize: 12,
          hidden1: 64,
          hidden2: 32,
          outputSize: 3,
        },
        trainingStats: {
          iterations: policyModel.trainHistory?.length || 0,
          trainingProgress: policyModel.getTrainingProgress?.(),
        },
        ...metadata,
      };

      fs.writeFileSync(metadataPath, JSON.stringify(fullMetadata, null, 2));
      console.log(`✓ Saved metadata to ${metadataPath}`);

      return true;
    } catch (e) {
      console.error("Error saving model:", e);
      return false;
    }
  }

  /**
   * Load model and metadata
   * @param {string} modelName - Model name to load
   * @returns {Promise<Object>} {model: PolicyModel, metadata: Object}
   */
  async loadModel(modelName = "policy_model") {
    try {
      const modelPath = path.join(this.modelDir, modelName);

      if (!fs.existsSync(modelPath)) {
        console.warn(`Model not found: ${modelPath}`);
        return { model: null, metadata: null, loaded: false };
      }

      // Load metadata
      const metadataPath = path.join(modelPath, "metadata.json");
      let metadata = {};
      if (fs.existsSync(metadataPath)) {
        const data = fs.readFileSync(metadataPath, "utf-8");
        metadata = JSON.parse(data);
        console.log(`✓ Loaded metadata: ${metadata.timestamp}`);
      }

      console.log(`✓ Model loaded from ${modelPath}`);

      return {
        model: null, // Actual model loading done by PolicyModel.loadModel()
        metadata,
        loaded: true,
        path: modelPath,
      };
    } catch (e) {
      console.error("Error loading model:", e);
      return { model: null, metadata: null, loaded: false, error: e.message };
    }
  }

  /**
   * List available models
   * @returns {Array<string>}
   */
  listModels() {
    try {
      if (!fs.existsSync(this.modelDir)) {
        return [];
      }

      const files = fs.readdirSync(this.modelDir);
      const models = files.filter((f) => {
        const fullPath = path.join(this.modelDir, f);
        return fs.statSync(fullPath).isDirectory();
      });

      return models;
    } catch (e) {
      console.error("Error listing models:", e);
      return [];
    }
  }

  /**
   * Get model info
   * @param {string} modelName - Model name
   * @returns {Object} Model information
   */
  getModelInfo(modelName = "policy_model") {
    try {
      const modelPath = path.join(this.modelDir, modelName);
      const metadataPath = path.join(modelPath, "metadata.json");

      if (!fs.existsSync(metadataPath)) {
        return { exists: false };
      }

      const data = fs.readFileSync(metadataPath, "utf-8");
      const metadata = JSON.parse(data);

      return {
        exists: true,
        ...metadata,
      };
    } catch (e) {
      console.error("Error getting model info:", e);
      return { exists: false, error: e.message };
    }
  }

  /**
   * Delete model
   * @param {string} modelName - Model name
   * @returns {boolean}
   */
  deleteModel(modelName = "policy_model") {
    try {
      const modelPath = path.join(this.modelDir, modelName);

      if (!fs.existsSync(modelPath)) {
        console.warn(`Model not found: ${modelPath}`);
        return false;
      }

      // Recursive delete
      this.deleteDirectory(modelPath);
      console.log(`✓ Deleted model: ${modelName}`);
      return true;
    } catch (e) {
      console.error("Error deleting model:", e);
      return false;
    }
  }

  /**
   * Recursively delete directory
   * @param {string} dirPath - Directory path
   */
  deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
          this.deleteDirectory(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  }

  /**
   * Export model for deployment
   * @param {string} modelName - Model name
   * @param {string} exportPath - Export path
   * @returns {boolean}
   */
  exportModel(modelName = "policy_model", exportPath = "./exported_model") {
    try {
      const modelPath = path.join(this.modelDir, modelName);

      if (!fs.existsSync(modelPath)) {
        console.warn(`Model not found: ${modelPath}`);
        return false;
      }

      if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
      }

      // Copy model files
      const files = fs.readdirSync(modelPath);
      for (const file of files) {
        const src = path.join(modelPath, file);
        const dst = path.join(exportPath, file);

        if (fs.statSync(src).isDirectory()) {
          this.copyDirectory(src, dst);
        } else {
          fs.copyFileSync(src, dst);
        }
      }

      console.log(`✓ Exported model to ${exportPath}`);
      return true;
    } catch (e) {
      console.error("Error exporting model:", e);
      return false;
    }
  }

  /**
   * Copy directory recursively
   * @param {string} src - Source path
   * @param {string} dst - Destination path
   */
  copyDirectory(src, dst) {
    if (!fs.existsSync(dst)) {
      fs.mkdirSync(dst, { recursive: true });
    }

    const files = fs.readdirSync(src);
    for (const file of files) {
      const srcFile = path.join(src, file);
      const dstFile = path.join(dst, file);

      if (fs.statSync(srcFile).isDirectory()) {
        this.copyDirectory(srcFile, dstFile);
      } else {
        fs.copyFileSync(srcFile, dstFile);
      }
    }
  }
}

module.exports = ModelStorage;
