/* ═══════════════════════════════════════════
   ARBITRIX — Main App
   Auto-trading engine, state management, wiring
═══════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { C, STOCKS, stockInfo, uid, fc, shortSym, INTERVALS, TRADING_PARAMS } from './lib/constants'
import { analyzeStock } from './lib/analyze'
import { fetchStock } from './lib/fetch'
import { getMe, executeTradeOnServer } from './lib/trading'
import { Setup } from './components/Setup'
import { WatchlistPanel } from './components/WatchlistPanel'
import { Toasts } from './components/UI'

const TradingPanel  = lazy(() => import('./components/TradingPanel').then(m => ({ default: m.TradingPanel })))
const HoldingsPanel = lazy(() => import('./components/HoldingsPanel').then(m => ({ default: m.HoldingsPanel })))
const ConfirmModal  = lazy(() => import('./components/ConfirmModal').then(m => ({ default: m.ConfirmModal })))
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })))

export default function App() {
  const [screen,       setScreen]       = useState('setup')
  const [user,         setUser]         = useState(null)
  const [capital,      setCapital]      = useState(0)
  const [cash,         setCash]         = useState(0)
  const [holdings,     setHoldings]     = useState({})
  const [trades,       setTrades]       = useState([])
  const [stockMap,     setStockMap]     = useState({})
  const [analyses,     setAnalyses]     = useState({})
  const [watchlist,    setWatchlist]    = useState([])
  const [selected,     setSelected]     = useState(null)
  const [qty,          setQty]          = useState('1')
  const [slPct,        setSlPct]        = useState('5')
  const [pending,      setPending]      = useState(null)
  const [loadMsg,      setLoadMsg]      = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [notifs,       setNotifs]       = useState([])
  const [scanStatus,   setScanStatus]   = useState('ARMED')
  const [settings,     setSettings]     = useState({
    autoEnabled:   true,
    confirmBuy:    true,
    confirmSell:   true,
    stopLossAuto:  true,
    notifications: true,
  })

  const queue      = useRef([])
  const processing = useRef(false)
  const refreshing = useRef(false)
  const sessionIdR = useRef(`session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
  const settingsR  = useRef(settings)
  const cashR      = useRef(cash)
  const holdingsR  = useRef(holdings)
  const analysesR  = useRef(analyses)
  const stockMapR  = useRef(stockMap)

  /* ── Sync refs with React state ── */
  useEffect(() => { settingsR.current = settings }, [settings])
  useEffect(() => { cashR.current = cash }, [cash])
  useEffect(() => { holdingsR.current = holdings }, [holdings])
  useEffect(() => { analysesR.current = analyses }, [analyses])
  useEffect(() => { stockMapR.current = stockMap }, [stockMap])

  /* ── Check for existing auth on mount ── */
  useEffect(() => {
    getMe().then(u => { if (u) setUser(u) })
  }, [])

  const autoCount = trades.filter(t => t.isAuto).length

  /* ── Notify toast ── */
  const notify = useCallback((type, msg, detail) => {
    if (!settingsR.current.notifications && type !== 'SL') return
    const n = { id: uid(), type, msg, detail: detail || '' }
    setNotifs(p => [n, ...p].slice(0, 6))
    setTimeout(() => setNotifs(p => p.filter(x => x.id !== n.id)), 5000)
  }, [])

  /* ── Helper functions for trade execution ── */
  const executeBuy = useCallback((symbol, qty, price, analysis, isAuto) => {
    const cost = qty * price
    if (cost > cashR.current) {
      notify('INFO', `Insufficient funds for ${shortSym(symbol)}`,
        `Need ${fc(cost)}, have ${fc(cashR.current)}`)
      return false
    }

    setCash(c => c - cost)
    setHoldings(h => {
      const prev = h[symbol] || { qty: 0, avgPrice: 0 }
      const nq = prev.qty + qty
      const na = (prev.qty * prev.avgPrice + qty * price) / nq
      return { ...h, [symbol]: { qty: nq, avgPrice: +na.toFixed(2) } }
    })
    setTrades(t => [{
      id: uid(), type: 'BUY', symbol, name: stockMapR.current[symbol]?.name || symbol, qty: qty, price, total: cost,
      time: new Date().toLocaleTimeString('en-IN'),
      signal: analysis ? analysis.signal : 'BUY',
      confidence: analysis ? analysis.confidence : 0,
      isAuto, note: '',
    }, ...t])
    notify('BUY', `${qty}×${shortSym(symbol)} @ ${fc(price)}`,
      `Signal: ${analysis ? analysis.signal : 'BUY'} · Conf: ${analysis ? analysis.confidence : 0}%`)

    // Fire-and-forget backend trade logging
    if (user) {
      executeTradeOnServer(sessionIdR.current, {
        type: 'BUY', stock: symbol, qty, price,
        decision_confidence: analysis?.confidence || 0,
        execution_mode: isAuto ? 'AUTO' : 'MANUAL',
      }).catch(() => {})
    }

    return true
  }, [notify, user])

  const executeSell = useCallback((symbol, qty, price, analysis, isAuto) => {
    const h = holdingsR.current[symbol]
    if (!h || h.qty < qty) return false

    const proceeds = qty * price
    const pnl      = (price - h.avgPrice) * qty
    setCash(c => c + proceeds)
    setHoldings(h2 => {
      const nq = h.qty - qty
      const next = { ...h2 }
      if (nq === 0) delete next[symbol]
      else next[symbol] = { ...h, qty: nq }
      return next
    })
    setTrades(t => [{
      id: uid(), type: 'SELL', symbol, name: stockMapR.current[symbol]?.name || symbol, qty: qty, price, pnl, total: proceeds,
      time: new Date().toLocaleTimeString('en-IN'),
      signal: analysis ? analysis.signal : 'SELL',
      isAuto, note: '',
    }, ...t])
    notify('SELL', `${qty}×${shortSym(symbol)} @ ${fc(price)}`, `P&L: ${fc(pnl)}`)

    // Fire-and-forget backend trade logging
    if (user) {
      executeTradeOnServer(sessionIdR.current, {
        type: 'SELL', stock: symbol, qty, price,
        decision_confidence: analysis?.confidence || 0,
        execution_mode: isAuto ? 'AUTO' : 'MANUAL',
      }).catch(() => {})
    }

    return true
  }, [notify, user])

  /* ── Execute trade ── */
  const executeTrade = useCallback((type, symbol, tradeQty, price, analysis, isAuto) => {
    const n  = parseInt(tradeQty, 10)
    if (!n || n < 1) return

    if (type === 'BUY') {
      executeBuy(symbol, n, price, analysis, isAuto)
    } else {
      executeSell(symbol, n, price, analysis, isAuto)
    }
  }, [executeBuy, executeSell])

  /* ── Load next pending confirmation ── */
  const loadNext = useCallback(() => {
    if (processing.current) return
    const next = queue.current.shift()
    if (!next) { setPending(null); processing.current = false; return }
    processing.current = true

    const a = analysesR.current[next.symbol] || {}
    next.reason = `${next.type} signal: composite=${a.composite || '?'}, conf=${a.confidence || '?'}%`

    setPending({ ...next, id: uid() })
    processing.current = false
  }, [])

  /* ── Auto scan ── */
  const runScan = useCallback(() => {
    const s = settingsR.current
    if (!s.autoEnabled) return

    setScanStatus('SCANNING')
    const allA  = analysesR.current
    const allSM = stockMapR.current
    const allH  = holdingsR.current
    const curCash = cashR.current
    let signals = 0

    for (const [symbol, a] of Object.entries(allA)) {
      if (!a) continue
      const stk = allSM[symbol]
      if (!stk) continue
      const price = stk.price
      const h = allH[symbol]
      const isMock = stk.source === 'mock'

      // Stop-loss check
      if (s.stopLossAuto && h && h.qty > 0) {
        const stopLossPct = parseFloat(slPct) / 100 || TRADING_PARAMS.STOP_LOSS_PERCENTAGE
        const slPrice = h.avgPrice * (1 - stopLossPct)
        if (price < slPrice) {
          executeTrade('SELL', symbol, h.qty, price, a, true)
          notify('SL', `Stop-loss: ${shortSym(symbol)}`,
            `Price ${fc(price)} hit SL ${fc(slPrice)}`)
          continue
        }
      }

      // BUY signal
      if (a.signal === 'BUY' && a.confidence > TRADING_PARAMS.MIN_CONFIDENCE_FOR_TRADE) {
        const maxAlloc = curCash * TRADING_PARAMS.MAX_ALLOCATION_PER_TRADE
        const shares   = Math.max(1, Math.floor(maxAlloc / price))
        if (shares * price > curCash) continue
        const alreadyQ = queue.current.some(q => q.symbol === symbol && q.type === 'BUY')
        if (alreadyQ) continue
        signals++
        if (isMock) {
          notify('INFO', `Signal for ${shortSym(symbol)}: ${a.signal} (${a.confidence}%)`, 'Data is simulated — auto-trade skipped')
        } else if (s.confirmBuy) {
          queue.current.push({
            type: 'BUY', symbol, name: stk.name,
            qty: shares, price, analysis: a,
          })
        } else {
          executeTrade('BUY', symbol, shares, price, a, true)
        }
      }

      // SELL signal
      if (a.signal === 'SELL' && h && h.qty > 0) {
        const alreadyQ = queue.current.some(q => q.symbol === symbol && q.type === 'SELL')
        if (alreadyQ) continue
        signals++
        if (isMock) {
          notify('INFO', `Signal for ${shortSym(symbol)}: ${a.signal}`, 'Data is simulated — auto-trade skipped')
        } else if (s.confirmSell) {
          queue.current.push({
            type: 'SELL', symbol, name: stk.name,
            qty: h.qty, price, analysis: a,
          })
        } else {
          executeTrade('SELL', symbol, h.qty, price, a, true)
        }
      }
    }

    setScanStatus(signals > 0 ? `SIGNALS: ${signals}` : 'ARMED')
    if (queue.current.length > 0 && !processing.current) loadNext()
  }, [executeTrade, notify, loadNext])

  /* ── Pick stocks for capital amount ── */
  function pickStocks(amount) {
    const eligible = STOCKS.filter(s => s.p <= amount * 0.4)
    if (eligible.length === 0) return STOCKS.slice(0, 5).map(s => s.s)
    const maxPicks = Math.min(6, Math.floor(amount / 1000))
    const count    = Math.max(4, Math.min(maxPicks, 6))
    return eligible.slice(0, count).map(s => s.s)
  }

  /* ── Start trading session ── */
  async function handleStart(amount) {
    setCapital(amount)
    setCash(amount)
    setScreen('trading')
    setLoadMsg('Loading stocks…')

    const picks = pickStocks(amount)
    setWatchlist(picks)

    await Promise.all(picks.map(async (symbol) => {
      setLoadMsg(`Loading ${shortSym(symbol)}…`)
      const data = await fetchStock(symbol)
      const analysis = analyzeStock(data.history)
      setStockMap(m => ({ ...m, [symbol]: data }))
      if (analysis) setAnalyses(a => ({ ...a, [symbol]: analysis }))
    }))

    setLoadMsg('')
    setSelected(picks[0])
  }

  /* ── Auto-scan timer ── */
  useEffect(() => {
    if (screen !== 'trading') return
    const timer = setInterval(runScan, INTERVALS.AUTO_SCAN)
    return () => clearInterval(timer)
  }, [screen, runScan])

  /* ── Initial scan when analyses are ready ── */
  useEffect(() => {
    if (screen !== 'trading') return
    const loaded = Object.keys(analyses).length
    if (loaded > 0 && loaded === watchlist.length) runScan()
  }, [analyses, watchlist.length, screen, runScan])

  /* ── Price refresh every 45s ── */
  useEffect(() => {
    if (screen !== 'trading' || watchlist.length === 0) return
    const timer = setInterval(async () => {
      if (refreshing.current) return
      refreshing.current = true
      try {
        await Promise.all(watchlist.map(async (symbol) => {
          const data = await fetchStock(symbol)
          const analysis = analyzeStock(data.history)
          setStockMap(m => ({ ...m, [symbol]: data }))
          if (analysis) setAnalyses(a => ({ ...a, [symbol]: analysis }))
        }))
      } finally {
        refreshing.current = false
      }
    }, INTERVALS.PRICE_REFRESH)
    return () => clearInterval(timer)
  }, [screen, watchlist])

  /* ── Confirmation handlers ── */
  function handleConfirm() {
    if (!pending) return
    executeTrade(pending.type, pending.symbol, pending.qty, pending.price, pending.analysis, true)
    setPending(null)
    processing.current = false
    setTimeout(loadNext, INTERVALS.LOAD_NEXT_TRADE)
  }
  function handleReject() {
    setPending(null)
    processing.current = false
    setTimeout(loadNext, INTERVALS.REJECT_DELAY)
  }
  function handleAutoAll() {
    setSettings(s => ({ ...s, confirmBuy: false, confirmSell: false }))
    settingsR.current = { ...settingsR.current, confirmBuy: false, confirmSell: false }
    handleConfirm()
  }

  /* ── Manual buy/sell from trading panel ── */
  function handleManualBuy(symbol, tradeQty, price, analysis) {
    executeTrade('BUY', symbol, tradeQty, price, analysis, false)
  }
  function handleManualSell(symbol, tradeQty, price, analysis) {
    executeTrade('SELL', symbol, tradeQty, price, analysis, false)
  }

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  if (screen === 'setup') {
    return <Setup onStart={handleStart} user={user} setUser={setUser} />
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: C.bg, fontFamily: C.mono, overflow: 'hidden',
    }}>
      {/* Global styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Main grid: 3 columns */}
      <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontFamily: C.mono, fontSize: 11 }}>Loading…</div>}>
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '220px 1fr 220px',
        overflow: 'hidden',
      }}>
        <WatchlistPanel
          watchlist={watchlist}
          stockMap={stockMap}
          analyses={analyses}
          selected={selected}
          onSelect={setSelected}
          scanStatus={scanStatus}
          onScanNow={runScan}
          settings={settings}
          onOpenSettings={() => setShowSettings(true)}
          cash={cash}
          capital={capital}
          autoCount={autoCount}
        />

        <TradingPanel
          selected={selected}
          stockMap={stockMap}
          analyses={analyses}
          holdings={holdings}
          qty={qty}
          onQtyChange={setQty}
          slPct={slPct}
          onSlPctChange={setSlPct}
          onBuy={handleManualBuy}
          onSell={handleManualSell}
          loadMsg={loadMsg}
        />

        <HoldingsPanel
          holdings={holdings}
          stockMap={stockMap}
          trades={trades}
          selected={selected}
          onSelect={setSelected}
          autoCount={autoCount}
        />
      </div>
      </Suspense>

      {/* Modals */}
      <Suspense fallback={null}>
        {pending && (
          <ConfirmModal
            trade={pending}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onAutoAll={handleAutoAll}
          />
        )}
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </Suspense>

      {/* Toast notifications */}
      <Toasts notifs={notifs} />
    </div>
  )
}
