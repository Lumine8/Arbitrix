/* ═══════════════════════════════════════════
   ARBITRIX — Technical Analysis Engine
   EMA, SMA, RSI, MACD, Bollinger, ATR
═══════════════════════════════════════════ */

export function ema(prices, n) {
  const k = 2 / (n + 1)
  const out = []
  for (let i = 0; i < prices.length; i++) {
    out.push(i === 0 ? prices[i] : prices[i] * k + out[i - 1] * (1 - k))
  }
  return out
}

export function sma(prices, n) {
  const out = []
  for (let i = 0; i < prices.length; i++) {
    if (i < n - 1) { out.push(null); continue }
    let sum = 0
    for (let j = i - n + 1; j <= i; j++) sum += prices[j]
    out.push(sum / n)
  }
  return out
}

export function rsi(prices, n = 14) {
  const out = []
  for (let i = 0; i < n; i++) out.push(null)
  let g = 0, l = 0
  for (let i = 1; i <= n; i++) {
    const d = prices[i] - prices[i - 1]
    d > 0 ? (g += d) : (l -= d)
  }
  let ag = g / n, al = l / n
  out.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al))
  for (let i = n + 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1]
    ag = (ag * (n - 1) + Math.max(d, 0)) / n
    al = (al * (n - 1) + Math.max(-d, 0)) / n
    out.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al))
  }
  return out
}

export function macd(prices) {
  const ef = ema(prices, 12)
  const es = ema(prices, 26)
  const line = prices.map((_, i) => ef[i] - es[i])
  const signal = ema(line, 9)
  const histogram = line.map((v, i) => v - signal[i])
  return { line, signal, histogram }
}

// Import constants for Bollinger Bands parameters
// Note: We'll import these at the top of the file to avoid circular dependencies
// For now, we'll keep the values but add comments indicating they should come from constants

export function bollinger(prices) {
  const mid = sma(prices, 20) // TODO: Replace with ANALYSIS_PARAMS.BOLLINGER_PERIOD
  const out = []
  for (let i = 0; i < prices.length; i++) {
    if (i < 19) { out.push({ mid: null, upper: null, lower: null }); continue } // TODO: Replace 19 with BOLLINGER_PERIOD - 1
    const mn = mid[i]
    const sl = prices.slice(i - 19, i + 1) // TODO: Replace 19 with BOLLINGER_PERIOD - 1
    let variance = 0
    for (const v of sl) variance += (v - mn) * (v - mn)
    const sd = Math.sqrt(variance / 20) // TODO: Replace 20 with BOLLINGER_PERIOD
    out.push({
      mid: +mn.toFixed(2),
      upper: +(mn + 2 * sd).toFixed(2), // TODO: Replace 2 with BOLLINGER_STD_DEV
      lower: +(mn - 2 * sd).toFixed(2), // TODO: Replace 2 with BOLLINGER_STD_DEV
    })
  }
  return out
}

// Import constants for ATR parameters
// Note: We'll import these at the top of the file to avoid circular dependencies
// For now, we'll keep the values but add comments indicating they should come from constants

export function atr(highs, lows, closes) {
  const tr = []
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { tr.push(highs[i] - lows[i]); continue }
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ))
  }
  return ema(tr, 14) // TODO: Replace 14 with ANALYSIS_PARAMS.ATR_PERIOD
}

// Import constants for volatility parameters
// Note: We'll import these at the top of the file to avoid circular dependencies
// For now, we'll keep the values but add comments indicating they should come from constants

export function volatility(prices) {
  const ret = []
  for (let i = 1; i < prices.length; i++) ret.push(Math.log(prices[i] / prices[i - 1]))
  const sl = ret.slice(-20) // TODO: Replace 20 with ANALYSIS_PARAMS.VOLATILITY_LOOKBACK
  let mn = 0
  for (const v of sl) mn += v
  mn /= sl.length
  let variance = 0
  for (const v of sl) variance += (v - mn) * (v - mn)
  return Math.sqrt(variance / sl.length) * Math.sqrt(252) // TODO: Replace 252 with ANALYSIS_PARAMS.TRADING_DAYS_PER_YEAR
}

export function lastValid(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined) return arr[i]
  }
  return 0
}
