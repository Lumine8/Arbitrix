/* ═══════════════════════════════════════════
   ARBITRIX — Holdings & Trade Log (Right Column)
═══════════════════════════════════════════ */

import { C, fc, fp, cl, shortSym } from '../lib/constants'

export function HoldingsPanel({ holdings, stockMap, trades, selected, onSelect, autoCount }) {
  return (
    <div style={{
      borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: C.panel,
    }}>

      {/* Holdings header */}
      <div style={{
        padding: '7px 12px', fontSize: 7, color: C.dim,
        letterSpacing: 3, borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        HOLDINGS · {Object.keys(holdings).length}
      </div>

      {/* Holdings list */}
      <div style={{ overflowY: 'auto', maxHeight: 200, flexShrink: 0 }}>
        {Object.keys(holdings).length === 0 ? (
          <div style={{ padding: 14, fontSize: 10, color: C.dim, textAlign: 'center' }}>
            No holdings yet
          </div>
        ) : Object.entries(holdings).map(([sym, h]) => {
          const d = stockMap[sym]
          if (!d) return null
          const u   = (d.price - h.avgPrice) * h.qty
          const up  = (d.price - h.avgPrice) / h.avgPrice * 100
          const nearSL = d.price < h.avgPrice * 0.97
          return (
            <div
              key={sym}
              onClick={() => onSelect(sym)}
              style={{
                padding: '9px 12px', borderBottom: `1px solid ${C.bg}`,
                cursor: 'pointer',
                background: selected === sym
                  ? '#00e67608'
                  : nearSL ? '#ff404008' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.head, fontWeight: 700 }}>{shortSym(sym)}</span>
                <span style={{ color: cl(up), fontSize: 10 }}>{fp(up)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10 }}>
                <span style={{ color: C.muted }}>{h.qty}sh · {fc(h.avgPrice)}</span>
                <span style={{ color: cl(u), fontWeight: 700 }}>{fc(u)}</span>
              </div>
              {nearSL && (
                <div style={{ fontSize: 8, color: C.red, marginTop: 2 }}>⚠ Near stop-loss</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Portfolio P&L summary */}
      {Object.keys(holdings).length > 0 && (() => {
        let totalVal = 0, totalCost = 0
        for (const [sym, h] of Object.entries(holdings)) {
          const d = stockMap[sym]
          if (d) {
            totalVal  += d.price * h.qty
            totalCost += h.avgPrice * h.qty
          }
        }
        const pnl = totalVal - totalCost
        return (
          <div style={{
            padding: '6px 12px', background: C.dimmer,
            borderTop: `1px solid ${C.border}`,
            display: 'flex', justifyContent: 'space-between',
            fontSize: 9, fontFamily: C.mono, flexShrink: 0,
          }}>
            <span style={{ color: C.muted }}>Portfolio P&L</span>
            <span style={{ color: cl(pnl), fontWeight: 700 }}>{fc(pnl)}</span>
          </div>
        )
      })()}

      {/* Trade log header */}
      <div style={{
        padding: '7px 12px', fontSize: 7, color: C.dim,
        letterSpacing: 3, borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>TRADE LOG · {trades.length}</span>
        <span style={{ color: C.blue }}>{autoCount} auto</span>
      </div>

      {/* Trade log */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {trades.length === 0 ? (
          <div style={{ padding: 14, fontSize: 10, color: C.dim, textAlign: 'center' }}>
            No trades yet
          </div>
        ) : trades.slice(0, 40).map(tr => (
          <div key={tr.id} style={{ padding: '9px 12px', borderBottom: `1px solid ${C.bg}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{
                  color: tr.type === 'BUY' ? C.green : C.red,
                  fontWeight: 700, fontSize: 10, letterSpacing: 1,
                }}>
                  {tr.type}
                </span>
                {tr.isAuto && (
                  <span style={{
                    fontSize: 7, color: C.blue,
                    border: `1px solid ${C.blue}30`, padding: '1px 4px',
                  }}>
                    AUTO
                  </span>
                )}
              </div>
              <span style={{ fontSize: 8, color: C.dim }}>{tr.time}</span>
            </div>
            <div style={{ color: C.head, fontSize: 11, marginTop: 2 }}>
              {shortSym(tr.symbol)} · {tr.qty}sh @ {fc(tr.price)}
            </div>
            {tr.pnl != null && (
              <div style={{ color: cl(tr.pnl), fontSize: 10, marginTop: 2 }}>
                P&L: {fc(tr.pnl)}
              </div>
            )}
            {tr.signal && (
              <div style={{ fontSize: 8, color: C.dim, marginTop: 2 }}>
                {tr.signal} · {tr.confidence || 0}% · {tr.tier || ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
