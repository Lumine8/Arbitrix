/**
 * ═══════════════════════════════════════════════════════════════
 * RL SYSTEM - PRACTICAL USAGE EXAMPLES
 * Real-world code examples for using the RL trading system
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 1: BASIC RL DECISION
// ═══════════════════════════════════════════════════════════════

/**
 * Get an RL-powered trading decision
 */
async function getRLTradingDecision() {
  try {
    // 1. Analyze stock (existing logic)
    const history = await fetchStockHistory("RELIANCE.NS", "6mo");
    const analysis = analyzeStock(history);

    // 2. Get current portfolio
    const portfolio = await getCurrentPortfolio();

    // 3. Build state vector
    const { buildStateVector } = await import("./stateBuilder.js");
    const state = buildStateVector(analysis, portfolio);

    // 4. Call RL API
    const response = await fetch("http://localhost:5000/api/rl/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state,
        analysisResult: analysis,
        portfolio,
        useRL: true,
      }),
    });

    const decision = await response.json();

    console.log(`
      🤖 RL Decision:
      Action: ${decision.action}
      Confidence: ${decision.confidence}%
      Probabilities: BUY=${(decision.probs[0] * 100).toFixed(1)}% SELL=${(decision.probs[1] * 100).toFixed(1)}% HOLD=${(decision.probs[2] * 100).toFixed(1)}%
      Source: ${decision.source}
      Exploration: ${decision.isExploration}
    `);

    return decision;
  } catch (error) {
    console.error("Error getting RL decision:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 2: COMPLETE TRADING CYCLE
// ═══════════════════════════════════════════════════════════════

/**
 * Complete trading cycle with RL
 */
async function completeTradingCycle() {
  try {
    const stock = "TCS.NS";
    const capital = 50000;

    console.log("📊 Starting RL Trading Cycle");
    console.log(`   Stock: ${stock}`);
    console.log(`   Capital: ₹${capital}`);

    // === STEP 1: DECISION ===
    console.log("\n1️⃣ Making RL Decision...");

    const history = await fetchStockHistory(stock, "6mo");
    const analysis = analyzeStock(history);
    const state = buildStateVector(analysis);

    const decisionRes = await fetch("http://localhost:5000/api/rl/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, analysisResult: analysis }),
    });
    const decision = await decisionRes.json();

    if (decision.action === "HOLD") {
      console.log("   → RL suggests HOLD. Skipping trade.");
      return;
    }

    console.log(`   ✓ Action: ${decision.action}`);
    console.log(`   ✓ Confidence: ${decision.confidence}%`);

    // === STEP 2: EXECUTE TRADE (Paper Trading) ===
    console.log("\n2️⃣ Executing Trade...");

    const tradeRes = await fetch("http://localhost:5000/api/trades/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user123",
        sessionId: "session456",
        stock,
        action: decision.action,
        qty: Math.floor((capital * 0.3) / analysis.last),
        entryPrice: analysis.last,
        confidence: decision.confidence,
      }),
    });
    const trade = await tradeRes.json();

    console.log(`   ✓ Trade executed: ${trade.tradeId}`);
    console.log(`   ✓ Qty: ${trade.qty}`);
    console.log(`   ✓ Entry Price: ₹${trade.entry_price}`);

    // === STEP 3: WAIT & OBSERVE ===
    console.log("\n3️⃣ Waiting for outcome...");

    // Simulate time passing (in real scenario, this would be actual market movement)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Get current price
    const currentPrice = analysis.last * (1 + (Math.random() - 0.5) * 0.02); // ±1% random
    console.log(`   ✓ Current Price: ₹${currentPrice.toFixed(2)}`);

    // === STEP 4: EVALUATE OUTCOME ===
    console.log("\n4️⃣ Evaluating Outcome...");

    const pnl = (currentPrice - analysis.last) * trade.qty;
    const evaluateRes = await fetch(
      "http://localhost:5000/api/trades/evaluate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          sessionId: "session456",
          decisionLogId: trade.decisionLogId,
          stock,
          decision: decision.action,
          execution_price: analysis.last,
          evaluation_price: currentPrice,
          expected_direction: decision.action === "BUY" ? "UP" : "DOWN",
        }),
      },
    );
    const evaluation = await evaluateRes.json();

    console.log(
      `   ✓ P&L: ₹${pnl.toFixed(2)} (${((pnl / (analysis.last * trade.qty)) * 100).toFixed(2)}%)`,
    );
    console.log(
      `   ✓ Direction Correct: ${evaluation.direction_correct ? "✅" : "❌"}`,
    );

    // === STEP 5: PROVIDE FEEDBACK & TRAIN ===
    console.log("\n5️⃣ Training RL Agent...");

    // Build next state
    const nextState = buildStateVector(analysis, {}, false, pnl);

    const outcomeRes = await fetch(
      "http://localhost:5000/api/rl/process-outcome",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeOutcome: {
            actualPnL: pnl,
            predictedDirection: decision.action,
            actualDirection: currentPrice > analysis.last ? "UP" : "DOWN",
            entropy: analysis.ent.normalized,
            rlfsScore: analysis.rlfs,
            confidence: decision.confidence / 100,
            tradeFrequency: 1,
            maxDrawdown: 0,
          },
          nextState,
        }),
      },
    );
    const outcome = await outcomeRes.json();

    console.log(`   ✓ Reward: ${outcome.reward}`);
    console.log(`   ✓ Trained: ${outcome.trained ? "✅" : "⏳"}`);

    console.log("\n✅ Trading cycle complete!");
  } catch (error) {
    console.error("Error in trading cycle:", error);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 3: MONITORING RL PROGRESS
// ═══════════════════════════════════════════════════════════════

/**
 * Monitor and display RL training progress
 */
async function monitorRLProgress() {
  try {
    // Get stats
    const statsRes = await fetch("http://localhost:5000/api/rl/stats");
    const stats = await statsRes.json();

    console.log(`
    🤖 RL AGENT STATUS
    ═══════════════════════════════════════════════════════
    
    Enabled: ${stats.enabled ? "✅" : "❌"}
    Total Decisions: ${stats.decisions}
    Training Cycles: ${stats.training.cycles}
    
    📊 MODEL PERFORMANCE
    ───────────────────────────────────────────────────────
    Recent Loss: ${stats.training.recentAvgLoss?.toFixed(4) || "N/A"}
    Recent Accuracy: ${stats.training.recentAvgAccuracy?.toFixed(2)}%
    Buffer Size: ${stats.replayBuffer.size} / ${stats.replayBuffer.maxSize}
    
    💰 REWARD TRACKING
    ───────────────────────────────────────────────────────
    Avg Reward: ${stats.rewardStats.avgReward?.toFixed(2) || "N/A"}
    Recent Avg: ${stats.rewardStats.recentAvgReward?.toFixed(2) || "N/A"}
    Max Reward: ${stats.rewardStats.maxReward?.toFixed(2) || "N/A"}
    Min Reward: ${stats.rewardStats.minReward?.toFixed(2) || "N/A"}
    Trend: ${stats.rewardStats.trend || "N/A"}
    
    🎯 ACTION SELECTOR
    ───────────────────────────────────────────────────────
    Epsilon: ${stats.actionSelector.epsilon?.toFixed(4)}
    Exploration Rate: ${stats.actionSelector.explorationRate}%
    
    💾 MODEL STORAGE
    ───────────────────────────────────────────────────────
    Saved Models: ${stats.models?.length || 0}
    Recommendation: ${stats.recommendedAction}
    ═══════════════════════════════════════════════════════
    `);

    return stats;
  } catch (error) {
    console.error("Error monitoring RL progress:", error);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 4: LEARNING CURVE VISUALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Get and display learning curve
 */
async function displayLearningCurve() {
  try {
    const curveRes = await fetch("http://localhost:5000/api/rl/learning-curve");
    const { curve } = await curveRes.json();

    console.log("\n📈 LEARNING CURVE");
    console.log("Cycle | Loss    | Accuracy");
    console.log("─────────────────────────────");

    for (const point of curve) {
      const cycle = `${point.cycle}`.padEnd(5);
      const loss = (point.loss || 0).toFixed(4).padEnd(7);
      const accuracy = `${(point.accuracy * 100).toFixed(1)}%`;
      console.log(`${cycle}│ ${loss} │ ${accuracy}`);
    }

    // Calculate trend
    if (curve.length > 1) {
      const first = curve[0].loss;
      const last = curve[curve.length - 1].loss;
      const improvement = (((first - last) / first) * 100).toFixed(1);
      console.log(
        `\n✓ 📉 Loss improved ${improvement}% over ${curve.length} cycles`,
      );
    }
  } catch (error) {
    console.error("Error displaying learning curve:", error);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 5: MODEL PERSISTENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Save and load trained models
 */
async function manageModels() {
  try {
    console.log("💾 Model Management");

    // List available models
    const listRes = await fetch("http://localhost:5000/api/rl/models");
    const { models } = await listRes.json();
    console.log(`\nAvailable models: ${models.join(", ") || "None"}`);

    // Save current model
    const saveRes = await fetch("http://localhost:5000/api/rl/save-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelName: `model_v${Date.now()}`,
      }),
    });
    const saveResult = await saveRes.json();
    console.log(
      `\nSave result: ${saveResult.success ? "✅ Success" : "❌ Failed"}`,
    );

    // Load a model
    const loadRes = await fetch("http://localhost:5000/api/rl/load-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelName: `model_v${Date.now()}`,
      }),
    });
    const loadResult = await loadRes.json();
    console.log(
      `Load result: ${loadResult.success ? "✅ Success" : "❌ Failed"}`,
    );
  } catch (error) {
    console.error("Error managing models:", error);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXAMPLE 6: BATCH TRADING SESSION
// ═══════════════════════════════════════════════════════════════

/**
 * Run multiple trades and track learning
 */
async function batchTradingSession(numTrades = 10) {
  try {
    console.log(`\n🚀 Starting Batch Trading Session (${numTrades} trades)`);
    console.log("═".repeat(50));

    let wins = 0;
    let losses = 0;
    let totalPnL = 0;

    for (let i = 0; i < numTrades; i++) {
      console.log(`\n[${i + 1}/${numTrades}] Trade ${i + 1}`);

      // Get decision
      const history = await fetchStockHistory("INFY.NS", "6mo");
      const analysis = analyzeStock(history);
      const state = buildStateVector(analysis);

      const decisionRes = await fetch("http://localhost:5000/api/rl/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, analysisResult: analysis }),
      });
      const decision = await decisionRes.json();

      if (decision.action === "HOLD") continue;

      console.log(`  Action: ${decision.action} (${decision.confidence}%)`);

      // Simulate outcome
      const direction = Math.random() > 0.5 ? 1 : -1;
      const pnl = direction * Math.random() * 100;

      if (pnl > 0) wins++;
      else losses++;
      totalPnL += pnl;

      // Report outcome
      const nextState = buildStateVector(analysis, {}, false, pnl);

      await fetch("http://localhost:5000/api/rl/process-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeOutcome: {
            actualPnL: pnl,
            entropy: analysis.ent.normalized,
            rlfsScore: analysis.rlfs,
            confidence: decision.confidence / 100,
          },
          nextState,
        }),
      });

      console.log(`  P&L: ₹${pnl.toFixed(2)}`);
    }

    console.log("\n" + "═".repeat(50));
    console.log(`📊 Session Results`);
    console.log(`  Wins: ${wins}`);
    console.log(`  Losses: ${losses}`);
    console.log(`  Total P&L: ₹${totalPnL.toFixed(2)}`);
    console.log(`  Win Rate: ${((wins / (wins + losses)) * 100).toFixed(1)}%`);
    console.log("═".repeat(50));

    // Show final stats
    await monitorRLProgress();
  } catch (error) {
    console.error("Error in batch session:", error);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN: Run Examples
// ═══════════════════════════════════════════════════════════════

async function runExamples() {
  // Uncomment to run examples:

  // await getRLTradingDecision()
  // await completeTradingCycle()
  // await monitorRLProgress()
  // await displayLearningCurve()
  // await manageModels()
  // await batchTradingSession(20)

  console.log("Ready to run RL trading system examples!");
}

// Export for use
export {
  getRLTradingDecision,
  completeTradingCycle,
  monitorRLProgress,
  displayLearningCurve,
  manageModels,
  batchTradingSession,
  runExamples,
};
