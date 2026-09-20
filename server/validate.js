/**
 * ═══════════════════════════════════════════════════════════════
 * VALIDATION SCRIPT
 * Checks all server modules for syntax and import errors
 * ═══════════════════════════════════════════════════════════════
 */

const path = require("path");

console.log("═══════════════════════════════════════════════════════");
console.log("🔍 ARBITRIX SERVER VALIDATION");
console.log("═══════════════════════════════════════════════════════\n");

let errors = 0;
let successes = 0;

// Check MongoDB models
console.log("📊 Checking MongoDB models...\n");

try {
  const models = require("./models");
  const modelNames = Object.keys(models);
  console.log(`✓ MongoDB models loaded: ${modelNames.join(", ")}`);
  successes++;
} catch (e) {
  console.error(`✗ MongoDB models: ${e.message}`);
  errors++;
}

// Check decision engine
console.log("\n🏭 Checking decision engines...\n");

try {
  const {
    DecisionLogger,
    TradeEvaluator,
    PaperTradingEngine,
  } = require("./decisionEngine");
  console.log(`✓ DecisionLogger: OK`);
  console.log(`✓ TradeEvaluator: OK`);
  console.log(`✓ PaperTradingEngine: OK`);
  successes++;
} catch (e) {
  console.error(`✗ Decision engines: ${e.message}`);
  errors++;
}

// Check learning engine
console.log("\n🧠 Checking learning engine...\n");

try {
  const LearningEngine = require("./learningEngine");
  console.log(`✓ LearningEngine: OK`);
  successes++;
} catch (e) {
  console.error(`✗ Learning engine: ${e.message}`);
  errors++;
}

// Check report engine
console.log("\n📄 Checking report engine...\n");

try {
  const { ContextEngine, ReportGenerator } = require("./reportEngine");
  console.log(`✓ ContextEngine: OK`);
  console.log(`✓ ReportGenerator: OK`);
  successes++;
} catch (e) {
  console.error(`✗ Report engine: ${e.message}`);
  errors++;
}

console.log("\n═══════════════════════════════════════════════════════");
console.log(`📊 TOTAL: ${successes} ✓, ${errors} ✗`);
console.log("═══════════════════════════════════════════════════════\n");

if (errors > 0) {
  console.log(
    "⚠️ Some modules have errors. Please fix them before proceeding.",
  );
  process.exit(1);
} else {
  console.log("🎉 All modules validated successfully!");
  process.exit(0);
}
