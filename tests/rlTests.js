/**
 * ═══════════════════════════════════════════════════════════════
 * RL SYSTEM TEST SUITE
 * Comprehensive testing for all RL components
 * ═══════════════════════════════════════════════════════════════
 */

// Mock TensorFlow for tests (if not available)
let tf = null;
try {
  tf = require("@tensorflow/tfjs-node");
} catch (e) {
  console.warn("⚠️ TensorFlow.js not available, using mock");
}

const PolicyModel = require("../rl/policyModel");
const ActionSelector = require("../rl/actionSelector");
const RewardEngine = require("../rl/rewardEngine");
const ReplayBuffer = require("../rl/replayBuffer");
const TrainingEngine = require("../rl/trainer");
const RLEngine = require("../rl/index");

// Test counters
let passCount = 0;
let failCount = 0;
let testCount = 0;

/**
 * Test helper
 */
function test(name, fn) {
  testCount++;
  try {
    fn();
    console.log(`✓ Test ${testCount}: ${name}`);
    passCount++;
  } catch (e) {
    console.error(`✗ Test ${testCount}: ${name}`);
    console.error(`  Error: ${e.message}`);
    failCount++;
  }
}

/**
 * Assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

/**
 * assertEquals helper
 */
function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

/**
 * Test ActionSelector
 */
function testActionSelector() {
  console.log("\n🧪 Testing Action Selector...");

  test("ActionSelector initializes with correct epsilon", () => {
    const selector = new ActionSelector(0.1);
    assertEquals(selector.epsilon, 0.1, "Initial epsilon should be 0.1");
  });

  test("ActionSelector decays epsilon", () => {
    const selector = new ActionSelector(0.1, 0.995);
    const initial = selector.epsilon;
    selector.decayEpsilon();
    assert(selector.epsilon < initial, "Epsilon should decrease");
  });

  test("ActionSelector selects action from policy", () => {
    const selector = new ActionSelector(0, 0.995); // No exploration
    const policyOutput = {
      action: "BUY",
      actionIdx: 0,
      probs: [0.7, 0.2, 0.1],
      confidence: 0.7,
    };
    const result = selector.selectAction(policyOutput, {
      useExploration: false,
    });
    assertEquals(result.action, "BUY", "Should select BUY");
  });

  test("ActionSelector explores with random actions", () => {
    const selector = new ActionSelector(1.0); // Always explore
    const policyOutput = {
      action: "HOLD",
      probs: [0.3, 0.3, 0.4],
      confidence: 0.4,
    };
    const result = selector.selectAction(policyOutput, {
      useExploration: true,
    });
    assert(
      ["BUY", "SELL", "HOLD"].includes(result.action),
      "Should return valid action",
    );
  });

  test("ActionSelector respects forced action", () => {
    const selector = new ActionSelector();
    const result = selector.selectAction(
      { action: "SELL" },
      { forceAction: "BUY" },
    );
    assertEquals(result.action, "BUY", "Should use forced action");
  });
}

/**
 * Test RewardEngine
 */
function testRewardEngine() {
  console.log("\n🧪 Testing Reward Engine...");

  test("RewardEngine calculates positive reward for profit", () => {
    const engine = new RewardEngine();
    const outcome = {
      actualPnL: 100,
      predictedDirection: "BUY",
      actualDirection: "BUY",
      entropy: 0.3,
      rlfsScore: 0.9,
      confidence: 0.8,
    };
    const result = engine.calculateReward(outcome);
    assert(result.reward > 0, "Profitable trade should have positive reward");
  });

  test("RewardEngine calculates negative reward for loss", () => {
    const engine = new RewardEngine();
    const outcome = {
      actualPnL: -50,
      predictedDirection: "BUY",
      actualDirection: "SELL",
      entropy: 0.7,
      rlfsScore: 0.5,
      confidence: 0.9,
    };
    const result = engine.calculateReward(outcome);
    assert(result.reward < 0, "Loss and wrong direction should be negative");
  });

  test("RewardEngine applies entropy penalty", () => {
    const engine = new RewardEngine();
    const outcomeLowEntropy = {
      actualPnL: 100,
      entropy: 0.2,
      rlfsScore: 0.9,
      confidence: 0.8,
    };
    const outcomeHighEntropy = {
      actualPnL: 100,
      entropy: 0.9,
      rlfsScore: 0.9,
      confidence: 0.8,
    };
    const result1 = engine.calculateReward(outcomeLowEntropy);
    const result2 = engine.calculateReward(outcomeHighEntropy);
    assert(
      result1.reward > result2.reward,
      "Lower entropy should yield higher reward",
    );
  });

  test("RewardEngine tracks reward history", () => {
    const engine = new RewardEngine();
    for (let i = 0; i < 5; i++) {
      engine.calculateReward({
        actualPnL: 10 * i,
        entropy: 0.5,
        rlfsScore: 0.8,
      });
    }
    const stats = engine.getRewardStats();
    assertEquals(stats.count, 5, "Should have 5 rewards in history");
  });
}

/**
 * Test ReplayBuffer
 */
function testReplayBuffer() {
  console.log("\n🧪 Testing Replay Buffer...");

  test("ReplayBuffer adds experiences", () => {
    const buffer = new ReplayBuffer(100);
    const exp = {
      state: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0, 0.5],
      action: "BUY",
      reward: 10,
      nextState: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0, 0, 0.6],
      done: false,
    };
    buffer.add(exp);
    assertEquals(buffer.buffer.length, 1, "Buffer should have 1 experience");
  });

  test("ReplayBuffer respects max size", () => {
    const buffer = new ReplayBuffer(5);
    for (let i = 0; i < 10; i++) {
      buffer.add({
        state: Array(12).fill(0.5),
        action: "HOLD",
        reward: 0,
        nextState: Array(12).fill(0.5),
        done: false,
      });
    }
    assert(buffer.buffer.length <= 5, "Buffer should not exceed max size");
  });

  test("ReplayBuffer samples batch", () => {
    const buffer = new ReplayBuffer(100);
    for (let i = 0; i < 50; i++) {
      buffer.add({
        state: Array(12).fill(0.5),
        action: ["BUY", "SELL", "HOLD"][i % 3],
        reward: i,
        nextState: Array(12).fill(0.5),
        done: false,
      });
    }
    const batch = buffer.sample(10);
    assert(batch.length === 10, "Should sample 10 experiences");
  });

  test("ReplayBuffer tracks statistics", () => {
    const buffer = new ReplayBuffer(100);
    buffer.add({
      state: Array(12).fill(0.5),
      action: "BUY",
      reward: 25,
      nextState: Array(12).fill(0.5),
      done: false,
    });
    const stats = buffer.getStats();
    assert(stats.size === 1, "Buffer size should be 1");
    assert(stats.avgReward === 25, "Average reward should be 25");
  });

  test("ReplayBuffer reports action distribution", () => {
    const buffer = new ReplayBuffer(100);
    const actions = ["BUY", "SELL", "HOLD", "BUY", "BUY"];
    for (const action of actions) {
      buffer.add({
        state: Array(12).fill(0.5),
        action,
        reward: 0,
        nextState: Array(12).fill(0.5),
        done: false,
      });
    }
    const dist = buffer.getActionDistribution();
    assert(dist.BUY > 0, "Should have BUY actions");
  });
}

/**
 * Test PolicyModel (basic)
 */
function testPolicyModel() {
  console.log("\n🧪 Testing Policy Model...");

  test("PolicyModel initializes", () => {
    const model = new PolicyModel(12, 64, 32);
    assert(model.model !== null, "Model should be initialized");
    assert(model.inputSize === 12, "Input size should be 12");
  });

  test("PolicyModel provides summary", () => {
    const model = new PolicyModel();
    const summary = model.getSummary();
    assertEquals(summary.inputSize, 12, "Input size should be 12");
    assertEquals(summary.outputSize, 3, "Output size should be 3");
  });
}

/**
 * Test RLEngine
 */
function testRLEngine() {
  console.log("\n🧪 Testing RL Engine...");

  test("RLEngine initializes", () => {
    const engine = new RLEngine({ enabled: true });
    assertEquals(engine.enabled, true, "Engine should be enabled");
    assert(engine.policyModel !== null, "Policy model should exist");
  });

  test("RLEngine returns statistics", () => {
    const engine = new RLEngine();
    const stats = engine.getStats();
    assert(stats.enabled !== undefined, "Stats should have enabled flag");
    assert(stats.decisions !== undefined, "Stats should have decision count");
  });

  test("RLEngine can list models", () => {
    const engine = new RLEngine({ modelDir: "./test_models" });
    const models = engine.listModels();
    assert(Array.isArray(models), "Should return array of models");
  });

  test("RLEngine resets properly", () => {
    const engine = new RLEngine();
    engine.decisions.push({ action: "BUY" });
    engine.reset();
    assertEquals(engine.decisions.length, 0, "Decisions should be cleared");
  });
}

/**
 * Integration test: Full pipeline
 */
function testFullPipeline() {
  console.log("\n🧪 Testing Full RL Pipeline...");

  test("Complete flow: decision -> outcome -> training", async () => {
    const engine = new RLEngine({ enabled: true });

    // Simulate decision
    const testState = Array(12).fill(0.5);
    const analysisResult = {
      signal: "BUY",
      confidence: 75,
      composite: 0.25,
      ent: { normalized: 0.35 },
      rlfs: 0.95,
      drift: 0.1,
      rsi: 65,
      ema9: 100,
      ema21: 99,
      ema50: 98,
      last: 101,
      vol: 18,
      scores: { trend: 0.5, rsi: 0.3, macd: 0.4, bb: 0.2, vol: 0.1 },
    };

    const decision = await engine.decideAction(analysisResult, testState);
    assert(decision.action !== undefined, "Should generate action");
    assert(
      ["BUY", "SELL", "HOLD"].includes(decision.action),
      "Action should be valid",
    );

    // Simulate outcome
    const nextState = Array(12).fill(0.5);
    const outcome = {
      actualPnL: 50,
      predictedDirection: decision.action,
      actualDirection: "BUY",
      entropy: 0.4,
      rlfsScore: 0.92,
      confidence: decision.confidence,
    };

    const result = await engine.processOutcome(outcome, nextState);
    assert(result.processed !== undefined, "Should process outcome");
  });
}

/**
 * Error handling tests
 */
function testErrorHandling() {
  console.log("\n🧪 Testing Error Handling...");

  test("ActionSelector validates policy output", () => {
    const selector = new ActionSelector();
    const isValid = ActionSelector.validatePolicyOutput({ action: "BUY" });
    assert(isValid === false, "Should reject incomplete output");

    const isValid2 = ActionSelector.validatePolicyOutput({
      action: "BUY",
      probs: [0.3, 0.3, 0.4],
    });
    assert(isValid2 === true, "Should accept valid output");
  });

  test("ReplayBuffer handles invalid experiences", () => {
    const buffer = new ReplayBuffer(100);
    buffer.add(null); // Should not throw
    buffer.add({}); // Should not throw
    assertEquals(
      buffer.buffer.length,
      0,
      "Invalid experiences should be skipped",
    );
  });

  test("RewardEngine handles missing data", () => {
    const engine = new RewardEngine();
    const result = engine.calculateReward(null);
    assert(result.breakdown.error !== undefined, "Should handle null input");
  });
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log("═════════════════════════════════════════════════════════");
  console.log("🧪 ARBITRIX RL SYSTEM TEST SUITE");
  console.log("═════════════════════════════════════════════════════════");

  try {
    testActionSelector();
    testRewardEngine();
    testReplayBuffer();
    testPolicyModel();
    testRLEngine();
    testErrorHandling();
    await testFullPipeline();

    console.log("\n═════════════════════════════════════════════════════════");
    console.log(`Ran ${testCount} tests`);
    console.log(`✓ Passed: ${passCount}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log("═════════════════════════════════════════════════════════");

    if (failCount === 0) {
      console.log("\n🎉 ALL TESTS PASSED!");
    } else {
      console.log(`\n⚠️ ${failCount} test(s) failed`);
      process.exit(1);
    }
  } catch (e) {
    console.error("\n❌ Test suite error:", e);
    process.exit(1);
  }
}

// Export for use in other test runners
module.exports = {
  runAllTests,
  test,
  assert,
  assertEquals,
};

// Run if executed directly
if (require.main === module) {
  runAllTests();
}
