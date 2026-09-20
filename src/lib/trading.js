/* ═══════════════════════════════════════════════════════════════
   ARBITRIX — Trading Modes & API Integration
   FULL-AI, SEMI-AI, MANUAL modes with decision logging
═════════════════════════════════════════════════════════════════ */

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
// AUTH HELPERS
// ═════════════════════════════════════════════════════════════════

const API_BASE = `${window.location.origin}/api`;

function getToken() {
  return localStorage.getItem('arbitrix_token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function authGet(url) {
  return fetch(url, { headers: authHeaders() });
}

function authPost(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

// ═════════════════════════════════════════════════════════════════
// AUTH API
// ═════════════════════════════════════════════════════════════════

export async function register(username, email, password, capital) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, capital }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('arbitrix_token', data.token);
    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}

export async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('arbitrix_token', data.token);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function getMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await authGet(`${API_BASE}/auth/me`);
    if (!res.ok) { localStorage.removeItem('arbitrix_token'); return null; }
    return await res.json();
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('arbitrix_token');
}

// ═════════════════════════════════════════════════════════════════
// BACKEND API INTEGRATION
// ═════════════════════════════════════════════════════════════════

/**
 * Log a trade decision with full context
 */
export async function logDecision(sessionId, decisionData) {
  try {
    const response = await authPost(`${API_BASE}/decisions/log`, {
      sessionId,
      ...decisionData,
    });
    if (!response.ok) throw new Error("Failed to log decision");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error logging decision:", error);
    return null;
  }
}

/**
 * Get decision history
 */
export async function getDecisionHistory(sessionId, limit = 100) {
  try {
    const response = await authGet(`${API_BASE}/decisions/history/${sessionId}?limit=${limit}`);
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
export async function executeTradeOnServer(sessionId, tradeData) {
  try {
    const response = await authPost(`${API_BASE}/trades/execute`, {
      sessionId,
      idempotencyKey: crypto.randomUUID(),
      ...tradeData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to execute trade");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error executing trade:", error);
    return null;
  }
}

/**
 * Close a trade
 */
export async function closeTradeOnServer(tradeId, exitPrice) {
  try {
    const response = await authPost(`${API_BASE}/trades/close/${tradeId}`, {
      exit_price: exitPrice,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to close trade");
    }
    return await response.json();
  } catch (error) {
    console.error("Error closing trade:", error);
    return null;
  }
}

/**
 * Evaluate a completed trade
 */
export async function evaluateTrade(sessionId, evalData) {
  try {
    const response = await authPost(`${API_BASE}/trades/evaluate`, {
      sessionId,
      ...evalData,
    });
    if (!response.ok) throw new Error("Failed to evaluate trade");
    return await response.json();
  } catch (error) {
    console.error("Error evaluating trade:", error);
    return null;
  }
}

/**
 * Get trade history
 */
export async function getTradeHistory(sessionId) {
  try {
    const response = await authGet(`${API_BASE}/trades/history/${sessionId}`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching trade history:", error);
    return [];
  }
}

/**
 * Initialize paper trading account with initial deposit
 */
export async function initPaperAccount(initialCash) {
  try {
    const response = await authPost(`${API_BASE}/trades/init`, { initialCash });
    if (!response.ok) throw new Error("Failed to initialize account");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error initializing account:", error);
    return null;
  }
}

/**
 * Get portfolio metrics (cash, positions, P&L)
 */
export async function getPortfolioMetrics(sessionId) {
  try {
    const response = await authGet(`${API_BASE}/trades/metrics/${sessionId}`);
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
export async function getAccuracyStats(sessionId) {
  try {
    const response = await authGet(`${API_BASE}/trades/accuracy/${sessionId}`);
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

export async function initializeLearning(userId, sessionId) {
  try {
    const response = await authPost(`${API_BASE}/learning/initialize/${userId}`, { sessionId });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error initializing learning:", error);
    return null;
  }
}

export async function runAdaptation(userId, sessionId, lookbackWindow = 20) {
  try {
    const response = await authPost(`${API_BASE}/learning/adapt/${userId}`, {
      sessionId,
      lookbackWindow,
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error running adaptation:", error);
    return null;
  }
}

export async function getLearnedParameters(userId) {
  try {
    const response = await authGet(`${API_BASE}/learning/parameters/${userId}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching parameters:", error);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════

export function determineTradeAction(mode, requiresConfirmation = false) {
  if (mode === "FULL_AI") return "AUTO";
  if (mode === "SEMI_AI" && requiresConfirmation) return "SEMI";
  return "MANUAL";
}

export function formatAccuracy(value) {
  if (!value && value !== 0) return "—";
  return `${value.toFixed(1)}%`;
}

export function getSignalColor(signal) {
  if (signal === "BUY") return "#00e676";
  if (signal === "SELL") return "#ff4040";
  return "#ffb300";
}
