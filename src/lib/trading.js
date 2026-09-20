/* ═══════════════════════════════════════════════════════════════
   ARBITRIX — Trading Modes & API Integration
   FULL-AI, SEMI-AI, MANUAL modes with decision logging
═════════════════════════════════════════════════════════════════ */

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
  const res = await authPost(`${API_BASE}/auth/register`, { username, email, password, capital });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  localStorage.setItem('arbitrix_token', data.token);
  return data;
}

export async function login(email, password) {
  const res = await authPost(`${API_BASE}/auth/login`, { email, password });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  localStorage.setItem('arbitrix_token', data.token);
  return data;
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
    return await response.json();
  } catch (error) {
    console.error("Error executing trade:", error);
    return null;
  }
}

/**
 * Initialize paper trading account with initial deposit
 */
export async function initPaperAccount(initialCash) {
  try {
    const response = await authPost(`${API_BASE}/trades/init`, { initialCash });
    if (!response.ok) throw new Error("Failed to initialize account");
    return await response.json();
  } catch (error) {
    console.error("Error initializing account:", error);
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
