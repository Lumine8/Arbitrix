/* ═══════════════════════════════════════════
   ARBITRIX — Auto-Trade Confirmation Modal
   Full PIEC breakdown + AI reasoning
═══════════════════════════════════════════ */

import { C, fc, fp, shortSym } from '../lib/constants'
import { SigBadge, TierBadge, ScoreBar, EntropyBar } from './UI'

export function ConfirmModal({ trade, onConfirm, onReject, onAutoAll }) {
  const a    = trade.analysis || {}
  const acol = trade.type === 'BUY' ? C.green : C.red
  const cost = trade.qty * trade.price
  const tgt  = a.targetPrice || null
  const estPnl = tgt ? (tgt - trade.price) * trade.qty : null
  const estPct = estPnl != null && cost > 0 ? estPnl / cost * 100 : null

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
              PIEC engine detected a {trade.type} opportunity · {trade.name}
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
            ['10D TGT', fc(tgt)],
            ['EST P&L', estPct != null ? fp(estPct) : '—'],
            ['SIGNAL',  a.signal || trade.type],
            ['CONF',    `${a.confidence || 0}%`],
          ].map(([label, val], i) => (
            <div key={i} style={{ background: C.bg, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: C.dim, letterSpacing: 2, marginBottom: 3 }}>{label}</div>
              <div style={{ color: C.head, fontWeight: 700, fontSize: 12 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* PIEC metrics */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.cyan, letterSpacing: 3, marginBottom: 10 }}>
            ⬡ PIEC REGIME ANALYSIS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[
              ['RLFS SCORE', `${((a.rlfs || 1) * 100).toFixed(0)}%`, a.rlfs > 0.7 ? C.green : a.rlfs > 0.4 ? C.amber : C.red],
              ['DRIFT',      `${(a.drift || 0).toFixed(3)}`,          a.drift < 0.25 ? C.green : a.drift < 0.65 ? C.amber : C.red],
              ['ω SIZING',   `${((a.omega || 1) * 100).toFixed(0)}%`, C.blue],
            ].map(([label, val, col]) => (
              <div key={label} style={{ textAlign: 'center', background: C.bg, padding: '8px 10px' }}>
                <div style={{ fontSize: 8, color: C.dim, letterSpacing: 2 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: col, marginTop: 4 }}>{val}</div>
              </div>
            ))}
          </div>
          <TierBadge tier={a.tier || 'STABLE'} />
          <div style={{ marginTop: 10 }}>
            <EntropyBar value={a.ent ? a.ent.normalized : 0.5} />
          </div>
        </div>

        {/* Signal scores */}
        {a.scores && (
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, marginBottom: 10 }}>
              SIGNAL BREAKDOWN
            </div>
            <ScoreBar label="EMA Trend (0.28)"  value={a.scores.trend} />
            <ScoreBar label="RSI Momentum (0.20)" value={a.scores.rsi} />
            <ScoreBar label="MACD Crossover (0.24)" value={a.scores.macd} />
            <ScoreBar label="Bollinger Band (0.16)" value={a.scores.bb} />
            <ScoreBar label="Volume Confirm (0.12)" value={a.scores.vol} />
            <div style={{ marginTop: 6, fontSize: 10, color: C.muted }}>
              Composite: <span style={{ color: acol, fontWeight: 700 }}>{a.composite}</span>
              {' '}· Entropy Attenuation: ×{a.ent ? (1 - a.ent.normalized * 0.4).toFixed(2) : '1.00'}
              {' '}· S-ADR ω: ×{(a.omega || 1).toFixed(2)}
            </div>
          </div>
        )}

        {/* AI reasoning */}
        {trade.reason && (
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.amber, letterSpacing: 3, marginBottom: 10 }}>
              ✦ WHY {shortSym(trade.symbol)} IS THE BEST {trade.type} NOW
            </div>
            <div style={{
              padding: 12, background: C.amber + '08',
              border: `1px solid ${C.amber}18`,
              fontSize: 11, color: C.text, lineHeight: 1.9,
            }}>
              {trade.reason}
            </div>

            {trade.vsAlt && trade.vsAlt.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 9, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>
                  WHY NOT THE ALTERNATIVES
                </div>
                {trade.vsAlt.map((alt, i) => (
                  <div key={i} style={{
                    padding: '6px 10px', marginBottom: 4,
                    background: C.bg, border: `1px solid ${C.border}`,
                    fontSize: 10, color: C.muted,
                  }}>
                    <span style={{ color: C.head }}>{alt.symbol} </span>— {alt.reason}
                  </div>
                ))}
              </div>
            )}
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
          Paper trade only · Not financial advice · PIEC signals are algorithmic estimates
        </div>
      </div>
    </div>
  )
}
