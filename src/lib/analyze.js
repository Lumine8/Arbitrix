/* ═══════════════════════════════════════════
   ARBITRIX — Stock Analysis Engine
   Combines TA indicators into composite signal
═══════════════════════════════════════════ */

import { ema, rsi, macd, bollinger, atr, volatility, stochastic, lastValid } from './ta'
import { ANALYSIS_PARAMS } from './constants'

/**
 * Full analysis of a stock given its price history.
 * Returns signal, confidence, predictions, and component scores.
 */
export function analyzeStock(history, overrides) {
  const P = { ...ANALYSIS_PARAMS, ...overrides }
  if (!history || !Array.isArray(history)) {
    console.warn('Invalid history provided to analyzeStock')
    return null
  }

  if (history.length < 60) {
    return null
  }

  const validHistory = history.filter(h =>
    Number.isFinite(h.close) && Number.isFinite(h.high ?? h.close) && Number.isFinite(h.low ?? h.close)
  )
  if (validHistory.length < 60) {
    return null
  }

  const closes  = validHistory.map(h => h.close)
  const highs   = validHistory.map(h => h.high  ?? h.close * 1.005)
  const lows    = validHistory.map(h => h.low   ?? h.close * 0.995)
  const volumes = validHistory.map(h => h.volume || 0)

  const n = closes.length
  const e9  = ema(closes, P.EMA_FAST)
  const e21 = ema(closes, P.EMA_MEDIUM)
  const e50 = ema(closes, P.EMA_SLOW)
  const rsiA  = rsi(closes, P.RSI_PERIOD)
  const macdD = macd(closes)
  const bbA   = bollinger(closes)
  const atrA  = atr(highs, lows, closes)
  const vol   = volatility(closes)
  const stoch = stochastic(highs, lows, closes, P.STOCH_K_PERIOD, P.STOCH_D_PERIOD)

  const last  = closes[n - 1]
  const rsiV  = lastValid(rsiA) || 50
  const mH    = macdD.histogram[n - 1] || 0
  const mH2   = (n > 1 ? macdD.histogram[n - 2] : 0) || 0
  const bb    = bbA[n - 1]
  const ev9   = e9[n - 1]
  const ev21  = e21[n - 1]
  const ev50  = e50[n - 1]
  const atrV  = atrA[n - 1] || last * 0.02

  // Stochastic values
  const stochK = stoch.k[n - 1] ?? 50
  const stochD = stoch.d[n - 1] ?? 50
  const prevStochK = n >= 2 ? (stoch.k[n - 2] ?? 50) : stochK
  const prevStochD = n >= 2 ? (stoch.d[n - 2] ?? 50) : stochD

  // Volume comparison
  let rv = 0, pv = 0
  for (let i = n - 5; i < n; i++)     if (i >= 0) rv += volumes[i]
  for (let i = n - 10; i < n - 5; i++) if (i >= 0) pv += volumes[i]
  rv /= 5; pv = (pv / 5) || 1

  // Signal components (weighted)
  const s1 = (ev9 > ev21 ? 0.5 : -0.5) + (ev21 > ev50 ? 0.5 : -0.5)
  const s2 = rsiV < 30 ? 1 : rsiV > P.RSI_OVERBOUGHT ? -1 : (rsiV - 50) / 50 * 0.5
  const s3 = mH > 0 && mH > mH2 ? 0.8 : mH > 0 ? 0.3 : mH < 0 && mH < mH2 ? -0.8 : -0.3
  let s4 = 0
  if (bb && bb.upper && bb.lower) {
    if (last > bb.upper) s4 = -0.8
    else if (last < bb.lower) s4 = 0.8
    else s4 = bb.mid ? (bb.mid - last) / (bb.upper - bb.mid) * 0.4 : 0
  }
  const priceDir = (n >= 6 && closes[n - 1] > closes[n - 6]) ? 1 : -1
  const s5 = Math.tanh((rv / pv - 1) * priceDir)

  // Stochastic score: oversold/overbought + %K/%D crossover
  let s6 = 0
  if (stochK < P.STOCH_OVERSOLD) s6 = 0.6
  else if (stochK > P.STOCH_OVERBOUGHT) s6 = -0.6
  else s6 = (stochK - 50) / 50 * 0.3
  // %K crossing above %D = bullish momentum
  if (prevStochK <= prevStochD && stochK > stochD) s6 += 0.4
  // %K crossing below %D = bearish momentum
  if (prevStochK >= prevStochD && stochK < stochD) s6 -= 0.4
  s6 = Math.max(-1, Math.min(1, s6))

  const composite = +(s1 * P.EMA_TREND_WEIGHT + s2 * P.RSI_WEIGHT + s3 * P.MACD_WEIGHT + s4 * P.BOLLINGER_WEIGHT + s5 * P.VOLUME_WEIGHT + s6 * P.STOCH_WEIGHT).toFixed(3)
  const confidence = +Math.min(Math.abs(composite) * 100, P.MAX_CONFIDENCE_PERCENTAGE).toFixed(1)

  const signal = composite > 0.10 ? 'BUY'
    : composite < -0.10 ? 'SELL'
    : 'HOLD'

  const prevClose = n >= 2 ? closes[n - 2] : last
  const todayChg  = (last - prevClose) / prevClose * 100

  return {
    signal, composite, confidence,
    rsi: +rsiV.toFixed(1), atr: +atrV.toFixed(2), vol: +(vol * 100).toFixed(1),
    stochK: +stochK.toFixed(1), stochD: +stochD.toFixed(1),
    ema9: +ev9.toFixed(2), ema21: +ev21.toFixed(2), ema50: +ev50.toFixed(2),
    bb, mH: +mH.toFixed(2),
    scores: {
      trend: +s1.toFixed(2), rsi: +s2.toFixed(2),
      macd: +s3.toFixed(2),  bb:  +s4.toFixed(2), vol: +s5.toFixed(2),
      stoch: +s6.toFixed(2),
    },
    last, todayChg,
  }
}
