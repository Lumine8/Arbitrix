/* ═══════════════════════════════════════════
   ARBITRIX — PIEC Entropy + RLFS + S-ADR
   Physical Integrity Entropy Consensus
═══════════════════════════════════════════ */

/**
 * PIEC Market Entropy
 * Measures directional randomness of recent price returns.
 * High entropy → market chaotic → reduce signal weight.
 * Low entropy  → market trending → trust signals more.
 */
/* RLFS PARAMETERS */
export const RLFS_PARAMS = {
  BETA: 1.2,          // Drift sensitivity
  GAMMA: 0.25,        // Drift averaging factor
};

/* S-ADR PARAMETERS */
export const SADR_PARAMS = {
  STABLE_THRESHOLD: 0.25,     // Drift threshold for STABLE regime
  REJECTED_THRESHOLD: 0.65,   // Drift threshold for REJECTED regime
};

/* PIEC MARKET ENTROPY */
export function marketEntropy(prices) {
  const K = 8, win = 30
  if (prices.length < win + 1) return { normalized: 0.5, bins: [0, 0, 0, 0, 0, 0, 0, 0] }

  const rec = prices.slice(prices.length - win - 1)
  const ret = []
  for (let i = 1; i < rec.length; i++) ret.push(rec[i] - rec[i - 1])

  let mx = 0
  for (const r of ret) if (Math.abs(r) > mx) mx = Math.abs(r)
  if (mx === 0) mx = 1

  const bins = new Array(K).fill(0)
  for (const r of ret) {
    const norm = (r / mx + 1) / 2
    let b = Math.floor(norm * K)
    if (b >= K) b = K - 1
    bins[b]++
  }

  const pr = bins.map(b => b / ret.length)
  let H = 0
  for (const p of pr) if (p > 0) H -= p * Math.log2(p + 1e-10)

  return { normalized: +(H / Math.log2(K)).toFixed(4), bins }
}

/**
 * RLFS — Representation Learning Feature Stability
 * Tracks drift of the indicator feature vector over time.
 * Returns rlfs score (1 = stable, 0 = completely drifted)
 * and drift magnitude.
 */
export function makeRLFS() {
  return { beta: RLFS_PARAMS.BETA, gamma: RLFS_PARAMS.GAMMA, drift: 0, prev: null }
}

export function rlfsStep(mon, x) {
  if (!mon.prev) {
    mon.prev = x.slice()
    return { rlfs: 1, drift: 0 }
  }
  let dist = 0
  for (let i = 0; i < x.length; i++) dist += (x[i] - mon.prev[i]) ** 2
  dist = Math.sqrt(dist)
  mon.drift = mon.gamma * dist + (1 - mon.gamma) * mon.drift
  mon.prev = x.slice()
  const r = +Math.exp(-mon.beta * mon.drift).toFixed(4)
  return { rlfs: r, drift: +mon.drift.toFixed(4) }
}

/**
 * S-ADR — Stability-Adaptive Degradation Response
 * Maps drift to position sizing omega (0–1).
 * STABLE  : full position
 * DEGRADED: scaled position (linear interpolation)
 * REJECTED: no trade
 */
export function sadr(drift) {
  if (drift <= SADR_PARAMS.STABLE_THRESHOLD) return { omega: 1, tier: 'STABLE' }
  if (drift >= SADR_PARAMS.REJECTED_THRESHOLD) return { omega: 0, tier: 'REJECTED' }
  const w = (SADR_PARAMS.REJECTED_THRESHOLD - drift) / (SADR_PARAMS.REJECTED_THRESHOLD - SADR_PARAMS.STABLE_THRESHOLD)
  return { omega: +w.toFixed(3), tier: 'DEGRADED' }
}
