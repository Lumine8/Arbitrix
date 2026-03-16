/* ═══════════════════════════════════════════
   ARBITRIX — Full Stock Analysis Engine
   Combines TA + PIEC Entropy + RLFS + S-ADR
═══════════════════════════════════════════ */

import { ema, rsi, macd, bollinger, atr, volatility, lastValid } from './ta'
import { marketEntropy, rlfsStep, sadr } from './piec'
import { ANALYSIS_PARAMS } from './constants'

/**
 * Full analysis of a stock given its price history and RLFS monitor state.
 * Returns signal, confidence, PIEC metrics, predictions, and component scores.
 */
export function analyzeStock(history, mon) {
  // Input validation
  if (!history || !Array.isArray(history)) {
    console.warn('Invalid history provided to analyzeStock')
    return null
  }
  
  if (history.length < 40) {
    // Not enough data for meaningful analysis
    return null
  }
  
  // Validate history items have required properties
  for (let i = 0; i < Math.min(history.length, 5); i++) {
    const item = history[i]
    if (item && typeof item === 'object') {
      if (item.close == null && (item.high == null || item.low == null || item.open == null)) {
        console.warn('History item missing required price data')
        // Continue anyway as we have fallbacks
      }
    }
  }
  
  // Validate mon parameter
  if (!mon || typeof mon !== 'object') {
    console.warn('Invalid monitor provided to analyzeStock')
    // Create a default monitor if needed
    mon = { beta: 1.2, gamma: 0.25, drift: 0, prev: null }
  }

  const closes  = history.map(h => h.close)
  const highs   = history.map(h => h.high  || h.close * 1.005)
  const lows    = history.map(h => h.low   || h.close * 0.995)
  const volumes = history.map(h => h.volume || 0)

   const n = closes.length
   const e9  = ema(closes, ANALYSIS_PARAMS.EMA_FAST)
   const e21 = ema(closes, ANALYSIS_PARAMS.EMA_MEDIUM)
   const e50 = ema(closes, ANALYSIS_PARAMS.EMA_SLOW)
   const rsiA  = rsi(closes, ANALYSIS_PARAMS.RSI_PERIOD)
   const macdD = macd(closes)
   const bbA   = bollinger(closes)
   const atrA  = atr(highs, lows, closes)
   const vol   = volatility(closes)

  const last  = closes[n - 1]
  const rsiV  = lastValid(rsiA) || 50
  const mH    = macdD.histogram[n - 1] || 0
  const mH2   = (n > 1 ? macdD.histogram[n - 2] : 0) || 0
  const bb    = bbA[n - 1]
  const ev9   = e9[n - 1]
  const ev21  = e21[n - 1]
  const ev50  = e50[n - 1]
  const atrV  = atrA[n - 1] || last * 0.02

  // Volume comparison
  let rv = 0, pv = 0
  for (let i = n - 5; i < n; i++)     if (i >= 0) rv += volumes[i]
  for (let i = n - 10; i < n - 5; i++) if (i >= 0) pv += volumes[i]
  rv /= 5; pv = (pv / 5) || 1

  // PIEC entropy
  const ent = marketEntropy(closes)

  // Normalised feature vector for RLFS
  const rsiN  = rsiV / 100
  const macdN = Math.tanh(mH / (atrV * 0.1 || 1)) * 0.5 + 0.5
  const bbP   = (bb && bb.upper && bb.lower) ? (last - bb.lower) / (bb.upper - bb.lower) : 0.5
  const emaS  = ev50 ? Math.tanh((ev9 - ev50) / ev50 * 10) * 0.5 + 0.5 : 0.5
  const volR  = Math.tanh(rv / pv - 1) * 0.5 + 0.5
  const fv    = [rsiN, macdN, bbP, emaS, volR]

  const rlfsResult = rlfsStep(mon, fv)
  const sadrResult = sadr(rlfsResult.drift)

   // Signal components (weighted)
   const s1 = (ev9 > ev21 ? 0.5 : -0.5) + (ev21 > ev50 ? 0.5 : -0.5)   // EMA trend
   const s2 = rsiV < 30 ? 1 : rsiV > ANALYSIS_PARAMS.RSI_OVERBOUGHT ? -1 : (rsiV - 50) / 50 * 0.5  // RSI
   const s3 = mH > 0 && mH > mH2 ? 0.8 : mH > 0 ? 0.3 : mH < 0 && mH < mH2 ? -0.8 : -0.3 // MACD
   let s4 = 0
   if (bb && bb.upper && bb.lower) {
     if (last > bb.upper) s4 = -0.8
     else if (last < bb.lower) s4 = 0.8
     else s4 = bb.mid ? (bb.mid - last) / (bb.upper - bb.mid) * 0.4 : 0
   }
   const priceDir = (n >= 6 && closes[n - 1] > closes[n - 6]) ? 1 : -1
   const s5 = Math.tanh((rv / pv - 1) * priceDir)                        // Volume

   const raw       = s1 * ANALYSIS_PARAMS.EMA_TREND_WEIGHT + s2 * ANALYSIS_PARAMS.RSI_WEIGHT + s3 * ANALYSIS_PARAMS.MACD_WEIGHT + s4 * ANALYSIS_PARAMS.BOLLINGER_WEIGHT + s5 * ANALYSIS_PARAMS.VOLUME_WEIGHT
   const attn      = 1 - ent.normalized * ANALYSIS_PARAMS.ENTROPY_ATTENUATION_FACTOR
   const composite = +(raw * attn * sadrResult.omega).toFixed(3)
   const confidence = +Math.min(Math.abs(composite) * 100, ANALYSIS_PARAMS.MAX_CONFIDENCE_PERCENTAGE).toFixed(1)

  const signal = sadrResult.tier === 'REJECTED' ? 'HOLD'
    : composite > 0.10 ? 'BUY'
    : composite < -0.10 ? 'SELL'
    : 'HOLD'

   // 10-day prediction with confidence bands
   const dailyDrift = (composite * vol * ANALYSIS_PARAMS.PREDICTION_DAILY_DRIFT_FACTOR) / ANALYSIS_PARAMS.TRADING_DAYS_PER_YEAR
   const dailyVol   = vol / Math.sqrt(ANALYSIS_PARAMS.TRADING_DAYS_PER_YEAR)
   const seed       = closes[n - 1] + closes[n - 2] + (n > 2 ? closes[n - 3] : 0)
   const prediction = []
   let price = last
   for (let i = 0; i < 10; i++) {
     const xr    = Math.sin(seed * 9301 + i * 49297 + 233) * 0.5
     const noise = (xr - Math.floor(xr) - 0.5) * dailyVol * last
     price = price * (1 + dailyDrift) + noise
     const sp  = atrV * (1 + i * ANALYSIS_PARAMS.PREDICTION_CONFIDENCE_BAND_FACTOR)
     const d   = new Date()
     d.setDate(d.getDate() + i + 1)
     prediction.push({
       date:  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
       pred:  +price.toFixed(2),
       upper: +(price + sp).toFixed(2),
       lower: +(price - sp).toFixed(2),
     })
   }

  const prevClose = n >= 2 ? closes[n - 2] : last
  const todayChg  = (last - prevClose) / prevClose * 100

  return {
    signal, composite, confidence,
    tier: sadrResult.tier, omega: sadrResult.omega,
    rlfs: rlfsResult.rlfs, drift: rlfsResult.drift, ent,
    rsi: +rsiV.toFixed(1), atr: +atrV.toFixed(2), vol: +(vol * 100).toFixed(1),
    ema9: +ev9.toFixed(2), ema21: +ev21.toFixed(2), ema50: +ev50.toFixed(2),
    bb, mH: +mH.toFixed(2),
    scores: {
      trend: +s1.toFixed(2), rsi: +s2.toFixed(2),
      macd: +s3.toFixed(2),  bb:  +s4.toFixed(2), vol: +s5.toFixed(2),
    },
    prediction,
    targetPrice: prediction.length > 0 ? prediction[prediction.length - 1].pred : null,
    last, todayChg,
  }
}
