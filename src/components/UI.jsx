/* ═══════════════════════════════════════════
   ARBITRIX — Shared UI Components
   Badges, bars, sparklines, toasts
═══════════════════════════════════════════ */

import { C, cl } from '../lib/constants'

/* Signal badge: BUY / SELL / HOLD */
export function SigBadge({ sig, sz = 11 }) {
  const cfg = {
    BUY:  { c: C.green, sym: '▲' },
    SELL: { c: C.red,   sym: '▼' },
    HOLD: { c: C.amber, sym: '◆' },
  }
  const x = cfg[sig] || cfg.HOLD
  return (
    <span style={{
      background: x.c + '18', color: x.c,
      padding: '2px 8px', fontSize: sz,
      fontWeight: 700, letterSpacing: 1,
      border: `1px solid ${x.c}30`,
      fontFamily: C.mono,
    }}>
      {x.sym} {sig}
    </span>
  )
}

/* PIEC tier badge: STABLE / DEGRADED / REJECTED */
export function TierBadge({ tier }) {
  const cols = { STABLE: C.green, DEGRADED: C.amber, REJECTED: C.red }
  const col = cols[tier] || C.green
  return (
    <span style={{
      background: col + '12', color: col,
      padding: '2px 8px', fontSize: 10,
      fontWeight: 700, letterSpacing: 1,
      border: `1px solid ${col}28`,
      fontFamily: C.mono,
    }}>
      {tier}
    </span>
  )
}

/* Horizontal score bar with label */
export function ScoreBar({ label, value, minV = -1, maxV = 1 }) {
  const pct = ((value - minV) / (maxV - minV)) * 100
  const col = value > 0.15 ? C.green : value < -0.15 ? C.red : C.amber
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: C.muted, marginBottom: 3, fontFamily: C.mono,
      }}>
        <span>{label}</span>
        <span style={{ color: col }}>{value >= 0 ? '+' : ''}{value}</span>
      </div>
      <div style={{ height: 3, background: C.dim, borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2, background: col,
          width: Math.max(0, Math.min(100, pct)) + '%',
        }} />
      </div>
    </div>
  )
}

/* Entropy gauge bar */
export function EntropyBar({ value }) {
  const pct = value * 100
  const col = value < 0.4 ? C.green : value < 0.7 ? C.amber : C.red
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: C.muted, marginBottom: 3, fontFamily: C.mono,
      }}>
        <span>PIEC ENTROPY</span>
        <span style={{ color: col }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={{ height: 4, background: C.dim, borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: `linear-gradient(90deg, ${C.green}, ${C.amber}, ${C.red})`,
          width: pct + '%', transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 8, color: C.dim, marginTop: 2, fontFamily: C.mono,
      }}>
        <span>LOW (trending)</span>
        <span>HIGH (random)</span>
      </div>
    </div>
  )
}

/* Toast notification stack */
export function Toasts({ notifs }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 900,
      display: 'flex', flexDirection: 'column-reverse', gap: 8, maxWidth: 340,
    }}>
      {notifs.slice(0, 4).map(n => {
        const col = n.type === 'BUY' ? C.green
          : n.type === 'SELL' ? C.red
          : n.type === 'SL' ? C.orange
          : C.blue
        return (
          <div key={n.id} style={{
            padding: '10px 14px', background: C.card,
            border: `1px solid ${col}40`,
            fontSize: 10, color: C.text, fontFamily: C.mono,
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: col, fontWeight: 700 }}>
                {n.type === 'BUY' ? '▲ BUY'
                  : n.type === 'SELL' ? '▼ SELL'
                  : n.type === 'SL' ? '🛡 SL'
                  : 'ℹ INFO'}
              </span>
              <span>{n.msg}</span>
            </div>
            {n.detail && (
              <div style={{ color: C.muted, fontSize: 9, marginTop: 3 }}>{n.detail}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* Key-value stat row */
export function StatRow({ label, value, valueColor }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '4px 0', borderBottom: `1px solid ${C.panel}`,
    }}>
      <span style={{ color: C.muted, fontSize: 10 }}>{label}</span>
      <span style={{ color: valueColor || C.head }}>{value}</span>
    </div>
  )
}

/* Loading spinner */
export function Spinner() {
  return (
    <div style={{
      display: 'inline-block', width: 12, height: 12,
      border: `2px solid ${C.dim}`, borderTopColor: C.green,
      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    }} />
  )
}
