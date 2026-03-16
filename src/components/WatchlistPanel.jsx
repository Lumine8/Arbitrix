/* ═══════════════════════════════════════════
   ARBITRIX — Watchlist Panel (Left Column)
═══════════════════════════════════════════ */

import { C, fc, fp, cl, shortSym } from '../lib/constants'
import { SigBadge, TierBadge } from './UI'

export function WatchlistPanel({
  watchlist, stockMap, analyses, selected, onSelect,
  scanStatus, onScanNow, settings, onOpenSettings,
  cash, capital, autoCount,
}) {
  const totalPct = capital > 0 ? ((cash / capital - 1) * 100) : 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: C.panel,
      borderRight: `1px solid ${C.border}`,
    }}>

      {/* Topbar */}
      <div style={{
        padding: '0 12px', height: 44,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <svg width="22" height="22" viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="lgt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00e676" />
              <stop offset="100%" stopColor="#ffd700" />
            </linearGradient>
          </defs>
          <rect width="72" height="72" rx="14" fill="#0a0e16" />
          <rect x="10" y="44" width="8"  height="18" rx="1" fill="url(#lgt)" opacity="0.5" />
          <rect x="21" y="34" width="8"  height="28" rx="1" fill="url(#lgt)" opacity="0.7" />
          <rect x="32" y="24" width="8"  height="38" rx="1" fill="url(#lgt)" opacity="0.9" />
          <rect x="43" y="16" width="8"  height="46" rx="1" fill="url(#lgt)" />
          <rect x="54" y="22" width="8"  height="40" rx="1" fill="url(#lgt)" opacity="0.7" />
          <polyline points="14,42 25,32 36,22 47,14 58,20"
            fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="47" cy="14" r="3" fill="#ffd700" />
        </svg>

        <span style={{ fontFamily: C.serif, fontSize: 15, fontWeight: 800, color: C.head, letterSpacing: 1 }}>
          ARBITRIX
        </span>
        <span style={{ fontSize: 7, color: C.dim, letterSpacing: 2, marginLeft: 2 }}>PIEC</span>

        <div style={{ flex: 1 }} />

        {/* Scan status */}
        <div style={{
          fontSize: 8, color: C.cyan, fontFamily: C.mono,
          letterSpacing: 1, padding: '3px 7px',
          border: `1px solid ${C.cyan}30`, cursor: 'pointer',
        }} onClick={onScanNow}>
          {scanStatus}
        </div>

        <button onClick={onOpenSettings} style={{
          background: 'none', border: `1px solid ${C.border}`,
          color: C.muted, cursor: 'pointer',
          padding: '4px 8px', fontFamily: C.mono, fontSize: 10,
        }}>
          ⚙
        </button>
      </div>

      {/* Portfolio summary bar */}
      <div style={{
        padding: '8px 12px', borderBottom: `1px solid ${C.border}`,
        background: C.dimmer, flexShrink: 0,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
      }}>
        {[
          ['CASH',     fc(cash),     null],
          ['CAPITAL',  fc(capital),  null],
          ['P&L',      fp(totalPct), totalPct],
        ].map(([label, val, trend]) => (
          <div key={label} style={{ textAlign: 'center', padding: '2px 0' }}>
            <div style={{ fontSize: 7, color: C.dim, letterSpacing: 2 }}>{label}</div>
            <div style={{ fontSize: 10, color: trend != null ? cl(trend) : C.head, fontWeight: 700, marginTop: 1 }}>
              {val}
            </div>
          </div>
        ))}
      </div>

      {/* Mode badge */}
      <div style={{
        padding: '5px 12px', borderBottom: `1px solid ${C.border}`,
        fontSize: 8, color: C.muted, fontFamily: C.mono,
        display: 'flex', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <span>
          {!settings.autoEnabled ? '⏸ AUTO OFF'
            : settings.confirmBuy && settings.confirmSell ? '✋ CONFIRM ALL'
            : !settings.confirmBuy && !settings.confirmSell ? '⚡ FULL AUTO'
            : '⚡/✋ MIXED'}
        </span>
        <span style={{ color: C.blue }}>{autoCount} auto trades</span>
      </div>

      {/* Scan now button */}
      <div style={{ padding: '6px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={onScanNow} style={{
          width: '100%', padding: '6px', background: '#4fc3f708',
          border: `1px solid ${C.cyan}40`, color: C.cyan,
          fontFamily: C.mono, fontSize: 9, cursor: 'pointer', letterSpacing: 2,
        }}>
          ⟳ SCAN NOW
        </button>
      </div>

      {/* Watchlist header */}
      <div style={{
        padding: '6px 12px', fontSize: 7, color: C.dim,
        letterSpacing: 3, borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        WATCHLIST · {watchlist.length} STOCKS
      </div>

      {/* Stock list */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {watchlist.map(sym => {
          const d = stockMap[sym]
          const a = analyses[sym]
          if (!d) return (
            <div key={sym} style={{ padding: '10px 12px', borderBottom: `1px solid ${C.bg}` }}>
              <div style={{ fontSize: 9, color: C.dim }}>{shortSym(sym)} <span style={{ color: C.dimmer }}>loading…</span></div>
            </div>
          )
          const chg = d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0
          const isSelected = selected === sym
          return (
            <div
              key={sym}
              onClick={() => onSelect(sym)}
              style={{
                padding: '10px 12px', borderBottom: `1px solid ${C.bg}`,
                cursor: 'pointer',
                background: isSelected ? '#00e67606' : 'transparent',
                borderLeft: isSelected ? `2px solid ${C.green}` : '2px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: C.head, fontWeight: 700, fontSize: 11 }}>{shortSym(sym)}</span>
                  {a && <span style={{ marginLeft: 6 }}><SigBadge sig={a.signal} sz={9} /></span>}
                </div>
                <span style={{ color: cl(chg), fontSize: 10, fontWeight: 700 }}>{fp(chg)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9 }}>
                <span style={{ color: C.muted }}>{fc(d.price)}</span>
                {a && (
                  <span style={{ color: C.dim }}>
                    RLFS {(a.rlfs * 100).toFixed(0)}% · <TierBadge tier={a.tier} />
                  </span>
                )}
              </div>
              {a && a.signal !== 'HOLD' && (
                <div style={{ marginTop: 4, fontSize: 8, color: C.dim }}>
                  conf {a.confidence}% · ω {(a.omega * 100).toFixed(0)}%
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
