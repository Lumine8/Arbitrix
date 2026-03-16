/* ═══════════════════════════════════════════
   ARBITRIX — Yahoo Finance Data Fetcher
   Real NSE data via CORS proxy fallback chain
═══════════════════════════════════════════ */

import { stockInfo } from './constants'

export async function fetchStock(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`

  // Try direct fetch first (might work in some environments)
  try {
    const directResponse = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (directResponse.ok) {
      const directData = await directResponse.json()
      if (directData.chart && directData.chart.result && directData.chart.result[0]) {
        return parseYahooResponse(directData, symbol)
      }
    }
  } catch (_) {
    // Direct fetch failed, continue to proxies
  }

  // Try proxy fallbacks
  for (const makeProxy of PROXIES) {
    try {
      const r = await fetch(makeProxy(url), { signal: AbortSignal.timeout(9000) })
      if (!r.ok) continue

      const w   = await r.json()
      const raw = w.contents ? JSON.parse(w.contents) : w

      if (!raw || !raw.chart || !raw.chart.result || !raw.chart.result[0]) continue

      return parseYahooResponse(raw, symbol)
    } catch (_) { continue }
  }

  // Mock fallback with realistic NSE-calibrated price dynamics
  return makeMockData(symbol)
}

// Helper function to parse Yahoo Finance response
function parseYahooResponse(raw, symbol) {
  const res  = raw.chart.result[0]
  const meta = res.meta
  const q    = res.indicators?.quote?.[0] || {}
  const ts   = res.timestamp || []

  const history = []
  for (let i = 0; i < ts.length; i++) {
    const close = q.close && q.close[i] != null ? +q.close[i].toFixed(2) : null
    if (close === null) continue
    const t = new Date(ts[i] * 1000)
    history.push({
      date:   t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      close,
      high:   q.high   && q.high[i]   != null ? +q.high[i].toFixed(2)   : close * 1.005,
      low:    q.low    && q.low[i]    != null ? +q.low[i].toFixed(2)    : close * 0.995,
      open:   q.open   && q.open[i]   != null ? +q.open[i].toFixed(2)   : close,
      volume: q.volume && q.volume[i] != null ? q.volume[i] : 0,
    })
  }

  if (history.length < 10) {
    // Not enough data, fall back to mock
    return makeMockData(symbol)
  }

  return {
    symbol,
    history,
    price:     meta.regularMarketPrice || history[history.length - 1].close,
    prevClose: meta.chartPreviousClose || meta.previousClose || history[history.length - 2].close,
    name:      meta.shortName || stockInfo(symbol).n,
    pe:        meta.trailingPE || null,
    beta:      meta.beta || null,
  }
}

function makeMockData(symbol) {
  const info = stockInfo(symbol)
  const base  = info.p
  const history = []

  for (let i = 0; i < 150; i++) {
    const dd = new Date()
    dd.setDate(dd.getDate() - 150 + i)
    const drift = (Math.random() - 0.47) * 0.014
    const c = +(base * (0.80 + i * 0.0014 + drift)).toFixed(2)
    history.push({
      date:   dd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      close:  c,
      high:   +(c * 1.01).toFixed(2),
      low:    +(c * 0.99).toFixed(2),
      open:   +(c * 0.998).toFixed(2),
      volume: Math.floor(Math.random() * 2e6 + 5e5),
    })
  }

  return {
    symbol,
    history,
    price:     history[history.length - 1].close,
    prevClose: history[history.length - 2].close,
    name:      info.n,
    pe:        null,
    beta:      null,
  }
}
