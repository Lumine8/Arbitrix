/* ═══════════════════════════════════════════
   ARBITRIX — Settings Panel
═══════════════════════════════════════════ */

import { C } from '../lib/constants'

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '12px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <div style={{ color: C.head, fontSize: 11 }}>{label}</div>
        {desc && <div style={{ color: C.muted, fontSize: 9, marginTop: 3, lineHeight: 1.6 }}>{desc}</div>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: checked ? C.green : C.dim,
          cursor: 'pointer', position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3,
          left: checked ? 18 : 3,
          width: 14, height: 14, borderRadius: '50%',
          background: C.bg, transition: 'left 0.2s',
        }} />
      </div>
    </div>
  )
}

export function SettingsPanel({ settings, onChange, onClose }) {
  const set = (k, v) => onChange({ ...settings, [k]: v })

  const modeText = settings.autoEnabled
    ? settings.confirmBuy && settings.confirmSell
      ? '✋ CONFIRM ALL — asking before every trade'
      : !settings.confirmBuy && !settings.confirmSell
        ? '⚡ FULL AUTO — trading without confirmations'
        : '⚡/✋ MIXED — auto sells, confirm buys'
    : '⏸ AUTO DISABLED — manual trading only'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000d0',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 480, maxHeight: '85vh', overflowY: 'auto',
        background: C.card, border: `1px solid ${C.border}`,
        fontFamily: C.mono,
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.head, fontFamily: C.serif }}>
            ⚙ ARBITRIX SETTINGS
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: C.muted,
            cursor: 'pointer', fontSize: 16,
          }}>✕</button>
        </div>

        <div style={{ padding: '0 20px' }}>
          <Toggle
            label="⚡ Auto-Trading Engine"
            desc="Scans every 30 seconds and automatically queues BUY/SELL signals."
            checked={settings.autoEnabled}
            onChange={v => set('autoEnabled', v)}
          />
          <Toggle
            label="✋ Confirm Before BUY"
            desc="Show confirmation dialog before executing each auto-buy."
            checked={settings.confirmBuy}
            onChange={v => set('confirmBuy', v)}
          />
          <Toggle
            label="✋ Confirm Before SELL"
            desc="Show confirmation dialog before executing each auto-sell."
            checked={settings.confirmSell}
            onChange={v => set('confirmSell', v)}
          />
          <Toggle
            label="💡 Show AI Reasoning"
            desc="AI explains why this is the best stock vs alternatives in the confirmation."
            checked={settings.showWhy}
            onChange={v => set('showWhy', v)}
          />
          <Toggle
            label="🛡 Auto Stop-Loss (−5%)"
            desc="Automatically sell any position that falls 5% below your average buy price."
            checked={settings.stopLossAuto}
            onChange={v => set('stopLossAuto', v)}
          />
          <Toggle
            label="🔔 Toast Notifications"
            desc="Show trade notifications in the bottom-right corner."
            checked={settings.notifications}
            onChange={v => set('notifications', v)}
          />
        </div>

        <div style={{
          padding: '12px 20px', background: C.bg,
          margin: '16px 20px 20px',
          border: `1px solid ${C.border}`,
          fontSize: 9, color: C.muted, lineHeight: 1.8,
        }}>
          <div style={{ color: C.amber, letterSpacing: 2, marginBottom: 4 }}>CURRENT MODE</div>
          {modeText}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: 12, background: C.green,
            border: 'none', color: C.bg, fontFamily: C.mono,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: 2,
          }}>
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
