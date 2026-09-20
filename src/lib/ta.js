/* ═══════════════════════════════════════════
   ARBITRIX — Technical Analysis Engine
   EMA, SMA, RSI, MACD, Bollinger, ATR, Stochastic
════════════════════════════════════════════ */

import { ANALYSIS_PARAMS as P } from './constants'

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

export function bollinger(prices) {
  const period = P.BOLLINGER_PERIOD
  const stdDev = P.BOLLINGER_STD_DEV
  const mid = sma(prices, period)
  const out = []
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) { out.push({ mid: null, upper: null, lower: null }); continue }
    const mn = mid[i]
    const sl = prices.slice(i - period + 1, i + 1)
    let variance = 0
    for (const v of sl) variance += (v - mn) * (v - mn)
    const sd = Math.sqrt(variance / period)
    out.push({
      mid: +mn.toFixed(2),
      upper: +(mn + stdDev * sd).toFixed(2),
      lower: +(mn - stdDev * sd).toFixed(2),
    })
  }
  return out
}

export function atr(highs, lows, closes) {
  const period = P.ATR_PERIOD
  const tr = []
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { tr.push(highs[i] - lows[i]); continue }
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ))
  }
  return ema(tr, period)
}

export function volatility(prices) {
  const lookback = P.VOLATILITY_LOOKBACK
  const daysPerYear = P.TRADING_DAYS_PER_YEAR
  const ret = []
  for (let i = 1; i < prices.length; i++) ret.push(Math.log(prices[i] / prices[i - 1]))
  const sl = ret.slice(-lookback)
  let mn = 0
  for (const v of sl) mn += v
  mn /= sl.length
  let variance = 0
  for (const v of sl) variance += (v - mn) * (v - mn)
  return Math.sqrt(variance / sl.length) * Math.sqrt(daysPerYear)
}

export function stochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
  const rawK = []
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) { rawK.push(null); continue }
    let hh = -Infinity, ll = Infinity
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (highs[j] > hh) hh = highs[j]
      if (lows[j] < ll) ll = lows[j]
    }
    rawK.push(hh === ll ? 50 : ((closes[i] - ll) / (hh - ll)) * 100)
  }
  const dLine = []
  for (let i = 0; i < rawK.length; i++) {
    if (i < dPeriod - 1 || rawK[i] === null) { dLine.push(null); continue }
    let sum = 0, cnt = 0
    for (let j = i - dPeriod + 1; j <= i; j++) {
      if (rawK[j] !== null) { sum += rawK[j]; cnt++ }
    }
    dLine.push(cnt === dPeriod ? sum / dPeriod : null)
  }
  return { k: rawK, d: dLine }
}

export function lastValid(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined) return arr[i]
  }
  return 0
}
