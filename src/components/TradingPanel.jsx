/* ═══════════════════════════════════════════
   ARBITRIX — Center Trading Panel
   Chart + Signal tabs + Buy/Sell + AI note
═══════════════════════════════════════════ */

import { useState } from 'react'
import { C, fc, fp, cl, shortSym } from '../lib/constants'
import { SigBadge, TierBadge, ScoreBar, EntropyBar, StatRow } from './UI'
import { PriceChart } from './PriceChart'

const TABS = ['chart', 'signals', 'piec', 'why']

export function TradingPanel({
  selected, stockMap, analyses, holdings, aiPicks,
  qty, onQtyChange, slPct, onSlPctChange,
  onBuy, onSell, tradeNote, loadMsg,
}) {
  const [tab, setTab] = useState('chart')

  if (!selected) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.dim, fontSize: 12, padding: 40, flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 32, opacity: 0.3 }}>◈</div>
        <div>Select a stock from the watchlist to begin</div>
        {loadMsg && (
          <div style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>
            {loadMsg}
          </div>
        )}
      </div>
    )
  }

  const selData = stockMap[selected]
  const selA    = analyses[selected]
  const selH    = holdings[selected]
  const chg     = selData && selData.prevClose
    ? (selData.price - selData.prevClose) / selData.prevClose * 100 : 0

  const tradeCost = selData ? parseFloat(qty || 1) * selData.price : 0
  const slPrice   = selH ? selH.avgPrice * (1 - parseFloat(slPct || 5) / 100) : null
  const pnlOnSel  = selH && selData ? (selData.price - selH.avgPrice) * selH.qty : null
  const retOnSel  = selH && selData ? (selData.price - selH.avgPrice) / selH.avgPrice * 100 : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Stock header */}
      {selData && (
        <div style={{
          padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          background: C.panel,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: C.serif, fontSize: 17, fontWeight: 700, color: C.head }}>
                {shortSym(selected)}
              </span>
              {selA && <SigBadge sig={selA.signal} sz={11} />}
              {selA && <TierBadge tier={selA.tier} />}
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{selData.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.head, fontFamily: C.mono }}>
              {fc(selData.price)}
            </div>
            <div style={{ fontSize: 10, color: cl(chg), fontWeight: 700 }}>{fp(chg)}</div>
          </div>
          {selA && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: C.muted }}>10D Target</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>
                {fc(selA.targetPrice)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${C.border}`,
        background: C.panel, flexShrink: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px 0',
              background: tab === t ? C.card : 'transparent',
              border: 'none', borderBottom: `2px solid ${tab === t ? C.green : 'transparent'}`,
              color: tab === t ? C.head : C.muted,
              fontFamily: C.mono, fontSize: 9, cursor: 'pointer',
              letterSpacing: 2, textTransform: 'uppercase',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {tab === 'chart' && selData && (
          <PriceChart
            stockData={selData}
            analysis={selA}
            holdingAvg={selH ? selH.avgPrice : null}
          />
        )}

        {tab === 'signals' && selA && (
          <div>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 3, marginBottom: 14 }}>
              SIGNAL COMPONENT BREAKDOWN
            </div>
            <ScoreBar label="EMA Trend (w=0.28)"      value={selA.scores.trend} />
            <ScoreBar label="RSI Momentum (w=0.20)"   value={selA.scores.rsi} />
            <ScoreBar label="MACD Crossover (w=0.24)" value={selA.scores.macd} />
            <ScoreBar label="Bollinger Band (w=0.16)" value={selA.scores.bb} />
            <ScoreBar label="Volume Confirm (w=0.12)" value={selA.scores.vol} />

            <div style={{ marginTop: 16, padding: 12, background: C.dimmer, fontSize: 10, lineHeight: 2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['Raw signal', selA.composite],
                  ['Entropy attn', (1 - selA.ent.normalized * 0.4).toFixed(3)],
                  ['S-ADR ω',     selA.omega.toFixed(3)],
                  ['Final comp',  selA.composite],
                  ['Confidence',  selA.confidence + '%'],
                  ['RSI',         selA.rsi],
                ].map(([label, val]) => (
                  <div key={label}>
                    <span style={{ color: C.muted, fontSize: 9 }}>{label} </span>
                    <span style={{ color: C.head, fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'piec' && selA && (
          <div>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 3, marginBottom: 14 }}>
              PIEC · RLFS · S-ADR REGIME STATUS
            </div>

            <div style={{ marginBottom: 16 }}>
              <EntropyBar value={selA.ent.normalized} />
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16,
            }}>
              {[
                ['RLFS SCORE', (selA.rlfs * 100).toFixed(1) + '%', selA.rlfs > 0.7 ? C.green : selA.rlfs > 0.4 ? C.amber : C.red],
                ['DRIFT',     selA.drift.toFixed(4), selA.drift < 0.25 ? C.green : selA.drift < 0.65 ? C.amber : C.red],
                ['ω SIZING',  (selA.omega * 100).toFixed(0) + '%', C.blue],
              ].map(([label, val, col]) => (
                <div key={label} style={{ textAlign: 'center', padding: 10, background: C.dimmer }}>
                  <div style={{ fontSize: 8, color: C.dim, letterSpacing: 2 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: col, marginTop: 4 }}>{val}</div>
                </div>
              ))}
            </div>

            <TierBadge tier={selA.tier} />

            <div style={{ marginTop: 14, padding: 12, background: C.dimmer, fontSize: 10, lineHeight: 1.9, color: C.muted }}>
              <div style={{ color: C.cyan, fontSize: 8, letterSpacing: 2, marginBottom: 8 }}>HOW PIEC WORKS</div>
              <b style={{ color: C.head }}>Entropy:</b> Measures how directional vs random recent price moves are.
              Low entropy (trending) = trust signals. High entropy (chaotic) = attenuate.<br />
              <b style={{ color: C.head }}>RLFS:</b> Tracks feature vector drift. When indicators shift regime, RLFS detects it before you lose money.<br />
              <b style={{ color: C.head }}>S-ADR:</b> Maps drift to position size ω. DEGRADED = smaller position. REJECTED = no trade at all.
            </div>

            {/* Entropy bin distribution */}
            {selA.ent && selA.ent.bins && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 8, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>
                  RETURN DIRECTION DISTRIBUTION
                </div>
                <div style={{ display: 'flex', gap: 3, height: 40, alignItems: 'flex-end' }}>
                  {selA.ent.bins.map((b, i) => {
                    const maxBin = Math.max(...selA.ent.bins, 1)
                    const h = (b / maxBin) * 100
                    return (
                      <div key={i} style={{ flex: 1 }}>
                        <div style={{
                          height: h + '%', background: i < 4 ? C.red + '80' : C.green + '80',
                          borderRadius: '2px 2px 0 0', minHeight: 2,
                        }} />
                      </div>
                    )
                  })}
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 7, color: C.dim, marginTop: 3,
                }}>
                  <span>Strong ↓</span><span>Strong ↑</span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'why' && (
          <div>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 3, marginBottom: 14 }}>
              WHY THESE STOCKS WERE PICKED
            </div>
            {aiPicks ? (
              <div style={{
                padding: 14, background: C.dimmer,
                border: `1px solid ${C.amber}20`,
                fontSize: 11, color: C.text, lineHeight: 1.9,
              }}>
                {aiPicks}
              </div>
            ) : (
              <div style={{ color: C.dim, fontSize: 10 }}>Loading AI analysis…</div>
            )}
          </div>
        )}
      </div>

      {/* Buy/Sell + Position panel */}
      {selData && (
        <div style={{
          flexShrink: 0, padding: 14,
          borderTop: `1px solid ${C.border}`,
          background: C.panel,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>

            {/* Order entry */}
            <div style={{ padding: 12, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 8, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>ORDER</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: C.muted, marginBottom: 4 }}>QTY</div>
                  <input
                    type="number" value={qty} min="1"
                    onChange={e => onQtyChange(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 8px',
                      background: C.bg, border: `1px solid ${C.border}`,
                      color: C.head, fontFamily: C.mono, fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: C.muted, marginBottom: 4 }}>SL %</div>
                  <input
                    type="number" value={slPct} min="1" max="20"
                    onChange={e => onSlPctChange(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 8px',
                      background: C.bg, border: `1px solid ${C.border}`,
                      color: C.amber, fontFamily: C.mono, fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 8 }}>
                Cost: <b style={{ color: C.head }}>{fc(tradeCost)}</b>
                {slPrice && <span style={{ color: C.red }}> · SL: {fc(slPrice)}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => onBuy(selected, qty, selData.price, selA)}
                  style={{
                    flex: 1, padding: '9px',
                    background: '#00e67614', border: `1px solid ${C.green}`,
                    color: C.green, fontFamily: C.mono, fontSize: 11,
                    fontWeight: 700, cursor: 'pointer', letterSpacing: 1,
                  }}
                >
                  ▲ BUY
                </button>
                <button
                  onClick={() => onSell(selected, selH ? selH.qty : qty, selData.price, selA)}
                  disabled={!selH}
                  style={{
                    flex: 1, padding: '9px',
                    background: selH ? '#ff404014' : 'transparent',
                    border: `1px solid ${selH ? C.red : C.dim}`,
                    color: selH ? C.red : C.dim,
                    fontFamily: C.mono, fontSize: 11,
                    fontWeight: 700,
                    cursor: selH ? 'pointer' : 'not-allowed', letterSpacing: 1,
                  }}
                >
                  ▼ SELL
                </button>
              </div>
            </div>

            {/* Position */}
            <div style={{ padding: 12, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 8, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>POSITION</div>
              {selH ? (
                <>
                  <StatRow label="Shares"    value={selH.qty} />
                  <StatRow label="Avg Buy"   value={fc(selH.avgPrice)} />
                  <StatRow label="Mkt Value" value={fc(selH.qty * selData.price)} />
                  <StatRow label="Unr. P&L"  value={fc(pnlOnSel)} valueColor={pnlOnSel != null ? cl(pnlOnSel) : C.head} />
                  <StatRow label="Return"    value={retOnSel != null ? fp(retOnSel) : '—'} valueColor={retOnSel != null ? cl(retOnSel) : C.head} />
                  {slPrice && <StatRow label="Stop-Loss" value={fc(slPrice)} valueColor={C.red} />}
                </>
              ) : (
                <div style={{ color: C.dim, fontSize: 10, marginTop: 16, textAlign: 'center' }}>
                  No position
                </div>
              )}
            </div>
          </div>

          {/* AI trade note */}
          {tradeNote && (
            <div style={{
              padding: 12, background: C.amber + '08',
              border: `1px solid ${C.amber}20`, fontSize: 11,
              color: C.text, lineHeight: 1.8,
            }}>
              <div style={{ fontSize: 8, color: C.amber, letterSpacing: 2, marginBottom: 6 }}>
                ✦ TRADE ANALYSIS
              </div>
              {tradeNote}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
