/* ═══════════════════════════════════════════
   ARBITRIX — Auto-Trade Confirmation Modal
═══════════════════════════════════════════ */

import { C, fc, fp, shortSym } from '../lib/constants'
import { SigBadge } from './UI'

export function ConfirmModal({ trade, onConfirm, onReject, onAutoAll }) {
  const a    = trade.analysis || {}
  const acol = trade.type === 'BUY' ? C.green : C.red
  const cost = trade.qty * trade.price

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000d0',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 600, maxHeight: '88vh', overflowY: 'auto',
        background: C.card, border: `1px solid ${acol}40`,
        boxShadow: `0 0 60px ${acol}15`, fontFamily: C.mono,
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 20px', background: acol + '0e',
          borderBottom: `1px solid ${acol}28`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 24, color: acol }}>{trade.type === 'BUY' ? '▲' : '▼'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.head, letterSpacing: 1, fontFamily: C.serif }}>
              AUTO-TRADE SIGNAL
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              Detected a {trade.type} opportunity · {trade.name}
            </div>
          </div>
          <SigBadge sig={trade.type} sz={13} />
        </div>

        {/* Summary grid */}
        <div style={{
          padding: '12px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8,
        }}>
          {[
            ['STOCK',   shortSym(trade.symbol)],
            ['QTY',     `${trade.qty} shares`],
            ['PRICE',   fc(trade.price)],
            ['TOTAL',   fc(cost)],
            ['SIGNAL',  a.signal || trade.type],
            ['CONF',    `${a.confidence || 0}%`],
            ['COMPOSITE', `${a.composite || 0}`],
            ['RSI',     `${a.rsi || '—'}`],
          ].map(([label, val], i) => (
            <div key={i} style={{ background: C.bg, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: C.dim, letterSpacing: 2, marginBottom: 3 }}>{label}</div>
              <div style={{ color: C.head, fontWeight: 700, fontSize: 12 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Signal scores */}
        {a.scores && (
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, marginBottom: 10 }}>
              SIGNAL BREAKDOWN
            </div>
            {[
              ['EMA Trend', a.scores.trend],
              ['RSI',       a.scores.rsi],
              ['MACD',      a.scores.macd],
              ['Bollinger', a.scores.bb],
              ['Volume',    a.scores.vol],
              ['Stochastic', a.scores.stoch],
            ].map(([label, val]) => {
              const pct = ((val + 1) / 2) * 100
              const col = val > 0.15 ? C.green : val < -0.15 ? C.red : C.amber
              return (
                <div key={label} style={{ marginBottom: 6 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 9, color: C.muted, marginBottom: 3, fontFamily: C.mono,
                  }}>
                    <span>{label}</span>
                    <span style={{ color: col }}>{val >= 0 ? '+' : ''}{val}</span>
                  </div>
                  <div style={{ height: 3, background: C.dim, borderRadius: 2 }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: col,
                      width: Math.max(0, Math.min(100, pct)) + '%',
                    }} />
                  </div>
                </div>
              )
            })}
            <div style={{ marginTop: 6, fontSize: 10, color: C.muted }}>
              Composite: <span style={{ color: acol, fontWeight: 700 }}>{a.composite}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 8 }}>
          <button onClick={onConfirm} style={{
            flex: 2, padding: 14,
            background: acol + '14', border: `1px solid ${acol}`,
            color: acol, fontFamily: C.mono, fontSize: 12,
            fontWeight: 700, cursor: 'pointer', letterSpacing: 2,
          }}>
            {trade.type === 'BUY' ? '▲ CONFIRM BUY' : '▼ CONFIRM SELL'}
          </button>
          <button onClick={onAutoAll} style={{
            flex: 1, padding: 14,
            background: C.cyan + '14', border: `1px solid ${C.cyan}60`,
            color: C.cyan, fontFamily: C.mono, fontSize: 11,
            fontWeight: 700, cursor: 'pointer', letterSpacing: 1,
          }}>
            ⚡ AUTO ALL
          </button>
          <button onClick={onReject} style={{
            flex: 1, padding: 14,
            background: 'transparent', border: `1px solid ${C.dim}`,
            color: C.muted, fontFamily: C.mono, fontSize: 11,
            fontWeight: 700, cursor: 'pointer', letterSpacing: 1,
          }}>
            SKIP
          </button>
        </div>
        <div style={{ padding: '0 20px 14px', fontSize: 9, color: C.dim, textAlign: 'center' }}>
          Paper trade only · Not financial advice · Signals are algorithmic estimates
        </div>
      </div>
    </div>
  )
}
