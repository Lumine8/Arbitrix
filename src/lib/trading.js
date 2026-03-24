/* ═══════════════════════════════════════════════════════════════
   ARBITRIX — Trading Modes & API Integration
   FULL-AI, SEMI-AI, MANUAL modes with decision logging
═══════════════════════════════════════════════════════════════ */

/**
 * Trading mode configuration
 */
export const TRADING_MODES = {
  FULL_AI: {
    name: "FULL-AI MODE",
    description: "Automatic execution - no confirmation needed",
    emoji: "🤖",
    auto_execute: true,
    requires_confirmation: false,
  },
  SEMI_AI: {
    name: "SEMI-AI MODE",
    description: "AI suggests - user confirms each trade",
    emoji: "👁️",
    auto_execute: false,
    requires_confirmation: true,
  },
  MANUAL: {
    name: "MANUAL MODE",
    description: "No auto trades - analysis only",
    emoji: "👋",
    auto_execute: false,
    requires_confirmation: false,
  },
};

// ═════════════════════════════════════════════════════════════════
// BACKEND API INTEGRATION
// ═════════════════════════════════════════════════════════════════

const API_BASE = `${window.location.origin}/api`;

/**
 * Log a trade decision with full context
 */
export async function logDecision(userId, sessionId, decisionData) {
  try {
    const response = await fetch(`${API_BASE}/decisions/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        sessionId,
        ...decisionData,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to log decision");
    }

    const data = await response.json();
    console.log("✓ Decision logged:", data.decisionId);
    return data;
  } catch (error) {
    console.error("Error logging decision:", error);
    return null;
  }
}

/**
 * Get decision history
 */
export async function getDecisionHistory(userId, sessionId, limit = 100) {
  try {
    const response = await fetch(
      `${API_BASE}/decisions/history/${userId}/${sessionId}?limit=${limit}`,
    );
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

/**
 * Execute a simulated trade
 */
export async function executeTrade(userId, sessionId, tradeData) {
  try {
    const response = await fetch(`${API_BASE}/trades/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        sessionId,
        ...tradeData,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to execute trade");
    }

    const data = await response.json();
    console.log("✓ Trade executed:", data.tradeId);
    return data;
  } catch (error) {
    console.error("Error executing trade:", error);
    return null;
  }
}

/**
 * Evaluate a completed trade
 */
export async function evaluateTrade(userId, sessionId, evalData) {
  try {
    const response = await fetch(`${API_BASE}/trades/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        sessionId,
        ...evalData,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to evaluate trade");
    }

    const data = await response.json();
    console.log("✓ Trade evaluated");
    return data;
  } catch (error) {
    console.error("Error evaluating trade:", error);
    return null;
  }
}

/**
 * Get trade history
 */
export async function getTradeHistory(userId, sessionId) {
  try {
    const response = await fetch(
      `${API_BASE}/trades/history/${userId}/${sessionId}`,
    );
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching trade history:", error);
    return [];
  }
}

/**
 * Get portfolio metrics
 */
export async function getPortfolioMetrics(userId, sessionId) {
  try {
    const response = await fetch(
      `${API_BASE}/trades/metrics/${userId}/${sessionId}`,
    );
    const data = await response.json();
    return data.data || {};
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return {};
  }
}

/**
 * Get accuracy statistics
 */
export async function getAccuracyStats(userId, sessionId) {
  try {
    const response = await fetch(
      `${API_BASE}/trades/accuracy/${userId}/${sessionId}`,
    );
    const data = await response.json();
    return data.data || {};
  } catch (error) {
    console.error("Error fetching accuracy:", error);
    return {};
  }
}

// ═════════════════════════════════════════════════════════════════
// LEARNING & ADAPTATION API
// ═════════════════════════════════════════════════════════════════

/**
 * Initialize learning parameters
 */
export async function initializeLearning(userId, sessionId) {
  try {
    const response = await fetch(`${API_BASE}/learning/initialize/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });

    const data = await response.json();
    console.log("✓ Learning initialized");
    return data.data;
  } catch (error) {
    console.error("Error initializing learning:", error);
    return null;
  }
}

/**
 * Run adaptation cycle
 */
export async function runAdaptation(userId, sessionId, lookbackWindow = 20) {
  try {
    const response = await fetch(`${API_BASE}/learning/adapt/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, lookbackWindow }),
    });

    const data = await response.json();
    console.log("✓ Adaptation cycle complete");
    return data.data;
  } catch (error) {
    console.error("Error running adaptation:", error);
    return null;
  }
}

/**
 * Get learned parameters
 */
export async function getLearnedParameters(userId) {
  try {
    const response = await fetch(`${API_BASE}/learning/parameters/${userId}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching parameters:", error);
    return null;
  }
}

/**
 * Get learning progress
 */
export async function getLearningProgress(userId) {
  try {
    const response = await fetch(`${API_BASE}/learning/progress/${userId}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching progress:", error);
    return null;
  }
}

/**
 * Get regime insights
 */
export async function getRegimeInsights(userId) {
  try {
    const response = await fetch(
      `${API_BASE}/learning/regime-insights/${userId}`,
    );
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching regime insights:", error);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════
// MARKET CONTEXT API
// ═════════════════════════════════════════════════════════════════

/**
 * Get market context
 */
export async function getMarketContext() {
  try {
    const response = await fetch(`${API_BASE}/context/market`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching market context:", error);
    return null;
  }
}

/**
 * Get volatility multiplier
 */
export async function getVolatilityMultiplier(vixLevel) {
  try {
    const response = await fetch(
      `${API_BASE}/context/volatility-multiplier/${vixLevel}`,
    );
    const data = await response.json();
    return data.multiplier;
  } catch (error) {
    console.error("Error calculating multiplier:", error);
    return 1.0;
  }
}

/**
 * Interpret market context
 */
export async function interpretContext(context) {
  try {
    const response = await fetch(`${API_BASE}/context/interpret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });

    const data = await response.json();
    return data.interpretation || [];
  } catch (error) {
    console.error("Error interpreting context:", error);
    return [];
  }
}

// ═════════════════════════════════════════════════════════════════
// REPORT GENERATION API
// ═════════════════════════════════════════════════════════════════

/**
 * Generate trade report
 */
export async function generateTradeReport(userId, sessionId, decisionLogId) {
  try {
    const response = await fetch(`${API_BASE}/reports/trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId, decisionLogId }),
    });

    const data = await response.json();
    console.log("✓ Report generated:", data.reportId);
    return data.data;
  } catch (error) {
    console.error("Error generating report:", error);
    return null;
  }
}

/**
 * Generate session report
 */
export async function generateSessionReport(userId, sessionId) {
  try {
    const response = await fetch(`${API_BASE}/reports/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId }),
    });

    const data = await response.json();
    console.log("✓ Session report generated:", data.reportId);
    return data.data;
  } catch (error) {
    console.error("Error generating session report:", error);
    return null;
  }
}

/**
 * Get report by ID
 */
export async function getReport(reportId) {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching report:", error);
    return null;
  }
}

/**
 * Download report as HTML
 */
export function downloadReportHTML(
  reportData,
  filename = "arbitrix-report.html",
) {
  if (!reportData.content?.html) return;

  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/html;charset=utf-8," +
      encodeURIComponent(reportData.content.html),
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Download report as JSON
 */
export function downloadReportJSON(
  reportData,
  filename = "arbitrix-report.json",
) {
  if (!reportData.content?.json) return;

  const jsonStr = JSON.stringify(reportData.content.json, null, 2);
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:application/json;charset=utf-8," + encodeURIComponent(jsonStr),
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// ═════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════

/**
 * Determine trading action based on mode and user preference
 */
export function determineTradeAction(mode, requiresConfirmation = false) {
  if (mode === "FULL_AI") return "AUTO";
  if (mode === "SEMI_AI" && requiresConfirmation) return "SEMI";
  return "MANUAL";
}

/**
 * Format accuracy percentage
 */
export function formatAccuracy(value) {
  if (!value && value !== 0) return "—";
  return `${value.toFixed(1)}%`;
}

/**
 * Get regime label
 */
export function getRegimeLabel(regime) {
  const labels = {
    high_entropy: "🌪️ High Entropy",
    low_entropy: "📈 Stable Trend",
    high_drift: "⚠️ Drifting",
    stable: "✓ Stable",
  };
  return labels[regime] || regime;
}

/**
 * Get signal color
 */
export function getSignalColor(signal) {
  if (signal === "BUY") return "#00e676"; // Green
  if (signal === "SELL") return "#ff4040"; // Red
  return "#ffb300"; // Amber for HOLD
}
