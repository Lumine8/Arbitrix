/* ═══════════════════════════════════════════
   ARBITRIX — Main App
   Auto-trading engine, state management, wiring
═══════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react'
import { C, STOCKS, stockInfo, uid, fc, shortSym, INTERVALS, TRADING_PARAMS } from './lib/constants'
import { analyzeStock } from './lib/analyze'
import { makeRLFS } from './lib/piec'
import { fetchStock } from './lib/fetch'
import { callAI, getTradeReasoning, getBestPickReason, getAlternativeComparison } from './lib/ai'
import { Setup } from './components/Setup'
import { WatchlistPanel } from './components/WatchlistPanel'
import { TradingPanel } from './components/TradingPanel'
import { HoldingsPanel } from './components/HoldingsPanel'
import { ConfirmModal } from './components/ConfirmModal'
import { SettingsPanel } from './components/SettingsPanel'
import { Toasts } from './components/UI'

export default function App() {
  const [screen,       setScreen]       = useState('setup')
  const [capital,      setCapital]      = useState(0)
  const [cash,         setCash]         = useState(0)
  const [holdings,     setHoldings]     = useState({})
  const [trades,       setTrades]       = useState([])
  const [stockMap,     setStockMap]     = useState({})
  const [analyses,     setAnalyses]     = useState({})
  const [watchlist,    setWatchlist]    = useState([])
  const [aiPicks,      setAIPicks]      = useState(null)
  const [selected,     setSelected]     = useState(null)
  const [qty,          setQty]          = useState('1')
  const [slPct,        setSlPct]        = useState('5')
  const [pending,      setPending]      = useState(null)
  const [loadMsg,      setLoadMsg]      = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [notifs,       setNotifs]       = useState([])
  const [tradeNote,    setTradeNote]    = useState('')
  const [scanStatus,   setScanStatus]   = useState('ARMED')
  const [settings,     setSettings]     = useState({
    autoEnabled:   true,
    confirmBuy:    true,
    confirmSell:   true,
    showWhy:       true,
    stopLossAuto:  true,
    notifications: true,
  })

// Using useRef for values that need to be accessed in callbacks but don't cause re-renders
const rlfsMap    = useRef({})
const queue      = useRef([])
const processing = useRef(false)
const settingsR  = useRef(settings)
const cashR      = useRef(cash)
const holdingsR  = useRef(holdings)
const analysesR  = useRef(analyses)
const stockMapR  = useRef(stockMap)

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
       tier: analysis ? analysis.tier : 'STABLE',
       isAuto, note: '',
     }, ...t])
     notify('BUY', `${qty}×${shortSym(symbol)} @ ${fc(price)}`,
       `Signal: ${analysis ? analysis.signal : 'BUY'} · Conf: ${analysis ? analysis.confidence : 0}%`)

     if (!isAuto && analysis) {
       setTradeNote('Analysing trade…')
       getTradeReasoning('BUY', stockMapR.current[symbol]?.name || symbol, symbol, analysis).then(note => setTradeNote(note))
     }
     
     return true
   }, [notify]);

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
     
     return true
   }, [notify]);

   /* ── Execute trade ── */
   const executeTrade = useCallback((type, symbol, tradeQty, price, analysis, isAuto) => {
     const n  = parseInt(tradeQty, 10)
     if (!n || n < 1) return
     
     if (type === 'BUY') {
       executeBuy(symbol, n, price, analysis, isAuto)
     } else {
       executeSell(symbol, n, price, analysis, isAuto)
     }
   }, [executeBuy, executeSell, notify])

  /* ── Load next pending confirmation ── */
  const loadNext = useCallback(async () => {
    if (processing.current) return
    const next = queue.current.shift()
    if (!next) { setPending(null); processing.current = false; return }
    processing.current = true

    if (settingsR.current.showWhy) {
      const a    = analysesR.current[next.symbol] || {}
      const allA = analysesR.current
      const others = Object.entries(allA)
        .filter(([k, v]) => k !== next.symbol && v && v.signal === next.type)
        .map(([k, v]) => ({ sym: shortSym(k), composite: v.composite, confidence: v.confidence }))

      const reason = await getBestPickReason(next.type, next.name, next.symbol, a, others)
      const vsAlt  = await getAlternativeComparison(next.type, next.name, others)
      next.reason = reason
      next.vsAlt  = vsAlt
    } else {
      const a = analysesR.current[next.symbol] || {}
      next.reason = `${next.type} signal: composite=${a.composite || '?'}, conf=${a.confidence || '?'}%`
      next.vsAlt  = []
    }

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

       // Stop-loss check
       const slPrice = h.avgPrice * (1 - TRADING_PARAMS.STOP_LOSS_PERCENTAGE)
       if (s.stopLossAuto && h && price < slPrice) {
         executeTrade('SELL', symbol, h.qty, price, a, true)
         notify('SL', `Stop-loss: ${shortSym(symbol)}`,
           `Price ${fc(price)} hit SL ${fc(slPrice)}`)
         continue
       }

       // BUY signal
       if (a.signal === 'BUY' && a.tier !== 'REJECTED' && a.confidence > TRADING_PARAMS.MIN_CONFIDENCE_FOR_TRADE) {
         const maxAlloc = curCash * TRADING_PARAMS.MAX_ALLOCATION_PER_TRADE * (a.omega || 1)
        const shares   = Math.max(1, Math.floor(maxAlloc / price))
        if (shares * price > curCash) continue
        const alreadyQ = queue.current.some(q => q.symbol === symbol && q.type === 'BUY')
        if (alreadyQ) continue
        signals++
        if (s.confirmBuy) {
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
        if (s.confirmSell) {
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
  async function pickStocks(amount) {
    const eligible = STOCKS.filter(s => s.p <= amount * 0.4)
    if (eligible.length === 0) return STOCKS.slice(0, 5).map(s => s.s)
    const maxPicks = Math.min(6, Math.floor(amount / 1000))
    const count    = Math.max(4, Math.min(maxPicks, 6))

    try {
      const raw = await callAI(
        'Return ONLY a JSON array of stock symbols, no markdown, no extra text.',
        `User has ₹${amount} to invest in NSE stocks.\n` +
        `Available stocks (symbol, price, sector): ${JSON.stringify(eligible.map(s => ({ s: s.s, p: s.p, sec: s.sec })))}\n` +
        `Pick the best ${count} stocks for this budget. Consider diversification, liquidity, and sector balance.\n` +
        `Return format: ["RELIANCE.NS", "TCS.NS", ...]`
      )
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
      const picks = JSON.parse(clean)
      if (Array.isArray(picks) && picks.length > 0) return picks.slice(0, count)
    } catch (_) {}

    // Fallback: filter by price
    return eligible.slice(0, count).map(s => s.s)
  }

  /* ── Start trading session ── */
  async function handleStart(amount) {
    setCapital(amount)
    setCash(amount)
    setScreen('trading')
    setLoadMsg('AI selecting stocks for your budget…')

    const picks = await pickStocks(amount)
    setWatchlist(picks)

    // AI explanation of picks
    callAI(
      'Indian equity analyst. 3-4 sentences max.',
      `User has ₹${amount} to invest. We picked: ${picks.map(s => shortSym(s)).join(', ')}.\n` +
      `Explain why this selection is well-balanced for this budget — sector diversity, risk level, and growth potential.`
    ).then(text => setAIPicks(text))

    // Load data for all picks
    for (const symbol of picks) {
      setLoadMsg(`Loading ${shortSym(symbol)}…`)
      const data = await fetchStock(symbol)
      if (!rlfsMap.current[symbol]) rlfsMap.current[symbol] = makeRLFS()
      const analysis = analyzeStock(data.history, rlfsMap.current[symbol])
      setStockMap(m => ({ ...m, [symbol]: data }))
      if (analysis) setAnalyses(a => ({ ...a, [symbol]: analysis }))
    }

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
      for (const symbol of watchlist) {
        const data = await fetchStock(symbol)
        if (!rlfsMap.current[symbol]) rlfsMap.current[symbol] = makeRLFS()
        const analysis = analyzeStock(data.history, rlfsMap.current[symbol])
        setStockMap(m => ({ ...m, [symbol]: data }))
        if (analysis) setAnalyses(a => ({ ...a, [symbol]: analysis }))
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
    setTradeNote('')
    executeTrade('BUY', symbol, tradeQty, price, analysis, false)
  }
  function handleManualSell(symbol, tradeQty, price, analysis) {
    setTradeNote('')
    executeTrade('SELL', symbol, tradeQty, price, analysis, false)
  }

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  if (screen === 'setup') {
    return <Setup onStart={handleStart} />
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
          aiPicks={aiPicks}
          qty={qty}
          onQtyChange={setQty}
          slPct={slPct}
          onSlPctChange={setSlPct}
          onBuy={handleManualBuy}
          onSell={handleManualSell}
          tradeNote={tradeNote}
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

      {/* Modals */}
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

      {/* Toast notifications */}
      <Toasts notifs={notifs} />
    </div>
  )
}
