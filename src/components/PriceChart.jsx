/* ═══════════════════════════════════════════
   ARBITRIX — Price Chart Component
   Historical prices + EMA + Bollinger + Forecast
═══════════════════════════════════════════ */

import {
  ComposedChart, Area, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import { C, fc } from '../lib/constants'
import { ema, bollinger } from '../lib/ta'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`,
      padding: '8px 12px', fontFamily: C.mono, fontSize: 10, minWidth: 140,
    }}>
      <div style={{ color: C.muted, marginBottom: 5 }}>{label}</div>
      {d.price  && <div style={{ color: C.text }}>Price    <span style={{ color: C.head, float: 'right' }}>{fc(d.price)}</span></div>}
      {d.pred   && <div style={{ color: C.amber }}>Forecast <span style={{ float: 'right' }}>{fc(d.pred)}</span></div>}
      {d.ema21  && <div style={{ color: '#7ecfff' }}>EMA21    <span style={{ float: 'right' }}>{fc(d.ema21)}</span></div>}
    </div>
  )
}

export function PriceChart({ stockData, analysis, holdingAvg }) {
  if (!stockData || !stockData.history || stockData.history.length === 0) {
    return (
      <div style={{
        height: 220, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: C.dim, fontSize: 11,
      }}>
        Loading chart…
      </div>
    )
  }

  const hist   = stockData.history
  const closes = hist.map(h => h.close)
  const e21    = ema(closes, 21)
  const e50    = ema(closes, 50)
  const bbA    = bollinger(closes)

  const N     = 55
  const start = hist.length > N ? hist.length - N : 0
  const combined = []

  for (let i = start; i < hist.length; i++) {
    combined.push({
      date:  hist[i].date,
      price: hist[i].close,
      ema21: +e21[i].toFixed(2),
      ema50: +e50[i].toFixed(2),
      bbUp:  bbA[i].upper,
      bbLow: bbA[i].lower,
    })
  }

  if (analysis && analysis.prediction) {
    for (const p of analysis.prediction) {
      combined.push({ date: p.date, pred: p.pred, predUp: p.upper, predLow: p.lower })
    }
  }

  const allVals = combined.flatMap(d => [d.price, d.pred, d.bbUp].filter(Boolean))
  const mn = allVals.length ? Math.min(...allVals) * 0.993 : 0
  const mx = allVals.length ? Math.max(...allVals) * 1.007 : 1

  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={combined} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={C.green} stopOpacity={0.08} />
              <stop offset="100%" stopColor={C.green} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={C.amber} stopOpacity={0.08} />
              <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.dimmer} strokeDasharray="2 8" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: C.dim, fontSize: 8, fontFamily: C.mono }}
            tickLine={false} axisLine={false} interval="preserveStartEnd"
          />
          <YAxis
            domain={[mn, mx]}
            tick={{ fill: C.dim, fontSize: 8, fontFamily: C.mono }}
            tickLine={false} axisLine={false} width={54}
            tickFormatter={v => `₹${(v / 1000).toFixed(1)}K`}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area dataKey="bbUp"    stroke="none" fill="none" dot={false} />
          <Area dataKey="bbLow"   stroke={C.blue} strokeWidth={0.4} strokeDasharray="2 4" fill={C.blue} fillOpacity={0.03} dot={false} />
          <Area dataKey="predUp"  stroke="none" fill="none" dot={false} />
          <Area dataKey="predLow" stroke={C.amber} strokeWidth={0.4} strokeDasharray="2 4" fill={C.amber} fillOpacity={0.04} dot={false} />
          <Line dataKey="ema21"   stroke="#7ecfff" strokeWidth={1} dot={false} strokeDasharray="4 2" />
          <Line dataKey="ema50"   stroke="#ce93d8" strokeWidth={1} dot={false} strokeDasharray="4 2" />
          <Area dataKey="price"   stroke={C.green} strokeWidth={2} fill="url(#gP)" dot={false} />
          <Area dataKey="pred"    stroke={C.amber} strokeWidth={2} strokeDasharray="5 3" fill="url(#gF)" dot={false} />
          {holdingAvg != null && (
            <ReferenceLine
              y={holdingAvg} stroke={C.amber} strokeDasharray="4 4" strokeWidth={1}
              label={{ value: 'entry', position: 'right', fill: C.amber, fontSize: 8, fontFamily: C.mono }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 3,
        fontSize: 8, color: C.muted, fontFamily: C.mono,
      }}>
        {[
          ['─', C.green,   'Price'],
          ['╌', C.amber,   'Forecast'],
          ['╌', '#7ecfff', 'EMA21'],
          ['╌', '#ce93d8', 'EMA50'],
          ['╌', C.blue,    'BB'],
        ].map(([sym, col, label]) => (
          <span key={label}>
            <span style={{ color: col }}>{sym}{sym} </span>{label}
          </span>
        ))}
      </div>
    </div>
  )
}
