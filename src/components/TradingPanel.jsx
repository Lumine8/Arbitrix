/* ═══════════════════════════════════════════
   ARBITRIX — Center Trading Panel
   Chart + Signal tabs + Buy/Sell
═══════════════════════════════════════════ */

import { useState } from 'react'
import { C, fc, fp, cl, shortSym } from '../lib/constants'
import { SigBadge, ScoreBar, StatRow } from './UI'
import { PriceChart } from './PriceChart'

const TABS = ['chart', 'signals']

export function TradingPanel({
  selected, stockMap, analyses, holdings,
  qty, onQtyChange, slPct, onSlPctChange,
  onBuy, onSell, loadMsg,
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
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{selData.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.head, fontFamily: C.mono }}>
              {fc(selData.price)}
            </div>
            <div style={{ fontSize: 10, color: cl(chg), fontWeight: 700 }}>{fp(chg)}</div>
          </div>
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
            <ScoreBar label="EMA Trend (w=0.24)"      value={selA.scores.trend} />
            <ScoreBar label="RSI Momentum (w=0.17)"   value={selA.scores.rsi} />
            <ScoreBar label="MACD Crossover (w=0.20)" value={selA.scores.macd} />
            <ScoreBar label="Bollinger Band (w=0.14)" value={selA.scores.bb} />
            <ScoreBar label="Volume Confirm (w=0.10)" value={selA.scores.vol} />
            <ScoreBar label="Stochastic (w=0.15)"     value={selA.scores.stoch} />

            <div style={{ marginTop: 16, padding: 12, background: C.dimmer, fontSize: 10, lineHeight: 2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['Composite',   selA.composite],
                  ['Confidence',  selA.confidence + '%'],
                  ['RSI',         selA.rsi],
                  ['Stoch %K',    selA.stochK],
                  ['Stoch %D',    selA.stochD],
                  ['ATR',         selA.atr],
                  ['Volatility',  selA.vol + '%'],
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
        </div>
      )}
    </div>
  )
}
