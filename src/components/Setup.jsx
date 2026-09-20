/* ═══════════════════════════════════════════
   ARBITRIX — Setup / Launch Screen
═══════════════════════════════════════════ */

import { useState } from 'react'
import { C } from '../lib/constants'
import { login, register, logout } from '../lib/trading'

const PRESETS = [1000, 5000, 10000, 50000, 100000]

export function Setup({ onStart, user, setUser }) {
  const [amt, setAmt] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [authMode, setAuthMode] = useState(null) // null | 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass] = useState('')
  const [authUser, setAuthUser] = useState('')
  const [authErr, setAuthErr] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  function go() {
    const v = parseFloat(amt)
    if (!v || v < 1000) { setErr('Minimum ₹1,000'); return }
    setBusy(true)
    onStart(v)
  }

  async function handleAuth(e) {
    e.preventDefault()
    setAuthErr('')
    setAuthBusy(true)
    try {
      if (authMode === 'login') {
        const data = await login(authEmail, authPass)
        setUser(data.user)
      } else {
        const data = await register(authUser, authEmail, authPass, parseFloat(amt) || 0)
        setUser(data.user)
      }
      setAuthMode(null)
    } catch (e) {
      setAuthErr(e.message)
    } finally {
      setAuthBusy(false)
    }
  }

  function handleLogout() {
    logout()
    setUser(null)
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: C.mono,
    }}>
      <div style={{ width: 500 }}>

        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          {/* SVG Logo */}
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00e676" />
                  <stop offset="50%" stopColor="#4fc3f7" />
                  <stop offset="100%" stopColor="#ffd700" />
                </linearGradient>
              </defs>
              <rect width="72" height="72" rx="14" fill="#0a0e16" stroke="#0f1c28" strokeWidth="1" />
              {/* chart bars */}
              <rect x="10" y="44" width="8"  height="18" rx="1" fill="url(#lg)" opacity="0.4" />
              <rect x="21" y="34" width="8"  height="28" rx="1" fill="url(#lg)" opacity="0.6" />
              <rect x="32" y="24" width="8"  height="38" rx="1" fill="url(#lg)" opacity="0.8" />
              <rect x="43" y="16" width="8"  height="46" rx="1" fill="url(#lg)" />
              <rect x="54" y="22" width="8"  height="40" rx="1" fill="url(#lg)" opacity="0.7" />
              {/* trend line */}
              <polyline points="14,42 25,32 36,22 47,14 58,20"
                fill="none" stroke="#00e676" strokeWidth="2" strokeLinecap="round" />
              {/* dot */}
              <circle cx="47" cy="14" r="3" fill="#ffd700" />
            </svg>
          </div>

          <div style={{ fontSize: 8, color: C.cyan, letterSpacing: 6, marginBottom: 10 }}>
            NSE · AI · TRADING PLATFORM
          </div>
          <div style={{
            fontFamily: C.serif, fontSize: 38, fontWeight: 800,
            color: C.head, letterSpacing: -1, lineHeight: 1,
          }}>
            ARBITRIX
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: C.amber, letterSpacing: 4 }}>
            ADAPT · ANALYZE · ACT · REJECT
          </div>
          <div style={{
            marginTop: 16, fontSize: 11, color: C.muted, lineHeight: 2,
            maxWidth: 380, margin: '16px auto 0',
          }}>
            Auto BUY/SELL engine powered by technical analysis, signal weighting,
            and adaptive position sizing
          </div>
        </div>

        {/* Feature chips */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 7,
          justifyContent: 'center', marginBottom: 28,
        }}>
          {['▲ EMA Trend', '◈ RSI Signal', '◐ MACD Crossover',
            '▲▼ Auto Trade', '◆ Bollinger Bands', '🛡 Stop-Loss'].map(f => (
            <span key={f} style={{
              padding: '4px 12px', background: C.card,
              border: `1px solid ${C.border}`, color: C.muted, fontSize: 9,
            }}>
              {f}
            </span>
          ))}
        </div>

        {/* Auth section */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: '16px 20px', marginBottom: 16 }}>
          {user ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: C.muted }}>
                Signed in as <span style={{ color: C.green }}>{user.email || user.username}</span>
              </div>
              <button onClick={handleLogout} style={{
                background: 'none', border: `1px solid ${C.dim}`, color: C.muted,
                fontFamily: C.mono, fontSize: 9, padding: '4px 10px', cursor: 'pointer',
              }}>Sign out</button>
            </div>
          ) : authMode ? (
            <form onSubmit={handleAuth}>
              <div style={{ fontSize: 8, color: C.muted, letterSpacing: 3, marginBottom: 10 }}>
                {authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </div>
              {authMode === 'register' && (
                <input type="text" placeholder="Username" value={authUser}
                  onChange={e => setAuthUser(e.target.value)} required minLength={3}
                  style={{ width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, color: C.head, fontFamily: C.mono, fontSize: 11, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              )}
              <input type="email" placeholder="Email" value={authEmail}
                onChange={e => setAuthEmail(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, color: C.head, fontFamily: C.mono, fontSize: 11, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              <input type="password" placeholder="Password" value={authPass}
                onChange={e => setAuthPass(e.target.value)} required minLength={6}
                style={{ width: '100%', padding: '10px 12px', background: C.bg, border: `1px solid ${C.border}`, color: C.head, fontFamily: C.mono, fontSize: 11, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              {authErr && <div style={{ color: C.red, fontSize: 9, marginBottom: 6 }}>{authErr}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={authBusy} style={{
                  flex: 1, padding: '8px 0', background: authBusy ? C.dim : C.green, border: 'none', color: C.bg,
                  fontFamily: C.mono, fontSize: 10, fontWeight: 700, cursor: authBusy ? 'not-allowed' : 'pointer',
                }}>{authBusy ? '...' : authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
                <button type="button" onClick={() => { setAuthMode(null); setAuthErr('') }} style={{
                  padding: '8px 12px', background: 'none', border: `1px solid ${C.dim}`, color: C.muted,
                  fontFamily: C.mono, fontSize: 10, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAuthMode('login')} style={{
                flex: 1, padding: '8px 0', background: 'none', border: `1px solid ${C.border}`, color: C.muted,
                fontFamily: C.mono, fontSize: 9, cursor: 'pointer',
              }}>Sign In</button>
              <button onClick={() => setAuthMode('register')} style={{
                flex: 1, padding: '8px 0', background: 'none', border: `1px solid ${C.cyan}40`, color: C.cyan,
                fontFamily: C.mono, fontSize: 9, cursor: 'pointer',
              }}>Create Account</button>
              <span style={{ fontSize: 9, color: C.dim, alignSelf: 'center' }}>or skip →</span>
            </div>
          )}
        </div>

        {/* Capital input */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, padding: '28px 32px' }}>
          <div style={{ fontSize: 8, color: C.muted, letterSpacing: 3, marginBottom: 10 }}>
            STARTING CAPITAL (₹)
          </div>
          <input
            type="number" value={amt} min={1000}
            placeholder="e.g. 10000  (min ₹1,000)"
            onChange={e => { setAmt(e.target.value); setErr('') }}
            onKeyDown={e => { if (e.key === 'Enter') go() }}
            style={{
              width: '100%', padding: '14px 16px',
              background: C.bg, border: `1px solid ${err ? C.red : C.border}`,
              color: C.head, fontFamily: C.mono, fontSize: 22,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {err && <div style={{ color: C.red, fontSize: 10, marginTop: 6 }}>{err}</div>}

          {/* Preset buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {PRESETS.map(v => (
              <button
                key={v}
                onClick={() => { setAmt(String(v)); setErr('') }}
                style={{
                  flex: 1, padding: '8px 0',
                  background: +amt === v ? '#00e67614' : 'transparent',
                  border: `1px solid ${+amt === v ? C.green : C.dim}`,
                  color: +amt === v ? C.green : C.muted,
                  fontFamily: C.mono, fontSize: 9, cursor: 'pointer',
                }}
              >
                ₹{v >= 100000 ? '1L' : v / 1000 + 'K'}
              </button>
            ))}
          </div>

          <button
            onClick={go} disabled={busy}
            style={{
              width: '100%', marginTop: 20, padding: 16,
              background: busy ? C.dim : `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
              border: 'none', color: C.bg,
              fontFamily: C.mono, fontSize: 13, fontWeight: 700,
              letterSpacing: 3, cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? '▌ INITIALISING…' : '▶  DEPLOY CAPITAL'}
          </button>

          <div style={{ marginTop: 14, fontSize: 9, color: C.dim, textAlign: 'center', lineHeight: 2 }}>
            Paper trades only · Not financial advice · Educational use · NSE data via Yahoo Finance
          </div>
        </div>
      </div>
    </div>
  )
}
