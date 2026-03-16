/* ═══════════════════════════════════════════
   ARBITRIX — Design Tokens & Stock Universe
═══════════════════════════════════════════ */

// ═════════════════════════════════════════════
// TIME INTERVALS (in milliseconds)
// ═════════════════════════════════════════════
export const INTERVALS = {
  AUTO_SCAN: 30000,      // 30 seconds
  PRICE_REFRESH: 45000,  // 45 seconds
  LOAD_NEXT_TRADE: 400,  // 400ms
  REJECT_DELAY: 200,     // 200ms
};

// ═════════════════════════════════════════════
// TRADING PARAMETERS
// ═════════════════════════════════════════════
export const TRADING_PARAMS = {
  MAX_ALLOCATION_PER_TRADE: 0.30,  // 30% of cash per trade
  STOP_LOSS_PERCENTAGE: 0.05,      // 5% stop-loss
  MIN_CONFIDENCE_FOR_TRADE: 30,    // Minimum confidence % to consider a trade
  BUY_SELL_THRESHOLD: 0.10,        // Signal threshold for BUY/SELL
};

// ═════════════════════════════════════════════
// ANALYSIS PARAMETERS
// ═════════════════════════════════════════════
export const ANALYSIS_PARAMS = {
  // Signal component weights
  EMA_TREND_WEIGHT: 0.28,
  RSI_WEIGHT: 0.20,
  MACD_WEIGHT: 0.24,
  BOLLINGER_WEIGHT: 0.16,
  VOLUME_WEIGHT: 0.12,
  
  // Entropy attenuation
  ENTROPY_ATTENUATION_FACTOR: 0.4,
  
  // Prediction parameters
  PREDICTION_DAILY_DRIFT_FACTOR: 0.6,
  PREDICTION_VOLATILITY_SCALAR: 1 / Math.sqrt(252),  // Annualized to daily
  PREDICTION_CONFIDENCE_BAND_FACTOR: 0.18,
  
  // RSI parameters
  RSI_PERIOD: 14,
  RSI_OVERBOUGHT: 70,
  RSI_OVERSOLD: 30,
  
  // EMA periods
  EMA_FAST: 9,
  EMA_MEDIUM: 21,
  EMA_SLOW: 50,
  
  // Bollinger Bands
  BOLLINGER_PERIOD: 20,
  BOLLINGER_STD_DEV: 2,
  
  // ATR
  ATR_PERIOD: 14,
  
  // Volume comparison
  VOLUME_SHORT_TERM: 5,
  VOLUME_MEDIUM_TERM: 5,
  
  // Volatility
  VOLATILITY_LOOKBACK: 20,
  TRADING_DAYS_PER_YEAR: 252,
  
  // Feature vector normalization
  FEATURE_VECTOR_SIZE: 5,
  
  // Confidence scaling
  MAX_CONFIDENCE_PERCENTAGE: 88,
};

// ═════════════════════════════════════════════
// DESIGN TOKENS
// ═════════════════════════════════════════════
export const C = {
  bg: "#03060a",
  panel: "#070b11",
  card: "#0a0e16",
  border: "#0f1c28",
  hi: "#162534",
  green: "#00e676",
  red: "#ff4040",
  amber: "#ffb300",
  blue: "#4fc3f7",
  purple: "#ce93d8",
  teal: "#4db6ac",
  orange: "#ff7043",
  gold: "#ffd700",
  cyan: "#00bcd4",
  muted: "#4a6272",
  dim: "#122030",
  dimmer: "#090f18",
  text: "#8fa8bb",
  head: "#d8eeff",
  mono: "'Space Mono', monospace",
  serif: "'Syne', sans-serif",
};

/* ═══════════════════════════════════════════
   STOCK UNIVERSE
   p = approximate base price (used by mock
   fallback when Yahoo Finance is unreachable)
═══════════════════════════════════════════ */

export const STOCKS = [
  { s: "RELIANCE.NS", n: "Reliance Industries", sec: "Energy", p: 2900 },
  { s: "TCS.NS", n: "Tata Consultancy", sec: "IT", p: 3800 },
  { s: "HDFCBANK.NS", n: "HDFC Bank", sec: "Banking", p: 1650 },
  { s: "INFY.NS", n: "Infosys", sec: "IT", p: 1800 },
  { s: "ICICIBANK.NS", n: "ICICI Bank", sec: "Banking", p: 1200 },
  { s: "HINDUNILVR.NS", n: "Hindustan Unilever", sec: "FMCG", p: 2400 },
  { s: "ITC.NS", n: "ITC Ltd", sec: "FMCG", p: 430 },
  { s: "SBIN.NS", n: "SBI", sec: "Banking", p: 780 },
  { s: "BHARTIARTL.NS", n: "Bharti Airtel", sec: "Telecom", p: 1600 },
  { s: "BAJFINANCE.NS", n: "Bajaj Finance", sec: "Finance", p: 7000 },
  { s: "WIPRO.NS", n: "Wipro", sec: "IT", p: 560 },
  { s: "HCLTECH.NS", n: "HCL Tech", sec: "IT", p: 1700 },
  { s: "TATAMOTORS.NS", n: "Tata Motors", sec: "Auto", p: 940 },
  { s: "AXISBANK.NS", n: "Axis Bank", sec: "Banking", p: 1100 },
  { s: "KOTAKBANK.NS", n: "Kotak Mahindra", sec: "Banking", p: 1800 },
  { s: "IRCTC.NS", n: "IRCTC", sec: "Travel", p: 780 },
  { s: "RVNL.NS", n: "Rail Vikas Nigam", sec: "Infra", p: 450 },
  { s: "TATAPOWER.NS", n: "Tata Power", sec: "Energy", p: 400 },
  { s: "ZOMATO.NS", n: "Zomato", sec: "Tech", p: 230 },
  { s: "SUZLON.NS", n: "Suzlon Energy", sec: "Energy", p: 55 },
  { s: "IRFC.NS", n: "IRFC", sec: "Finance", p: 185 },
  { s: "PAYTM.NS", n: "Paytm", sec: "Fintech", p: 650 },
];

/* ═══════════════════════════════════════════
   REAL-TIME PRICE FETCH
   Routes through a CORS proxy so browser
   requests to Yahoo Finance don't get blocked.
   Falls back to an empty object on failure —
   fetch.js will use mock data instead.
═══════════════════════════════════════════ */

// ═════════════════════════════════════════════
// PROXY SERVICES FOR CORS BYPASS
// ═════════════════════════════════════════════
export const PROXIES = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
  (url) => `https://jsonpeep.vercel.app/api/proxy?url=${encodeURIComponent(url)}`,
];

export async function fetchPrices(symbols) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;

  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(url), {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;

      const w = await res.json();
      const raw = w.contents ? JSON.parse(w.contents) : w;
      const results = raw?.quoteResponse?.result;

      if (!Array.isArray(results) || results.length === 0) continue;

      const prices = {};
      for (const stock of results) {
        prices[stock.symbol] = {
          price: stock.regularMarketPrice,
          change: stock.regularMarketChangePercent,
          volume: stock.regularMarketVolume,
        };
      }
      return prices;
    } catch (_) {
      continue;
    }
  }

  return {}; // fetch.js mock fallback will kick in
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */

export function stockInfo(sym) {
  return (
    STOCKS.find((s) => s.s === sym) || { s: sym, n: sym, sec: "—", p: 1000 }
  );
}

export function fc(n) {
  if (n == null) return "—";
  return (
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function fp(n) {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export function cl(n, colors = C) {
  return n >= 0 ? colors.green : colors.red;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function shortSym(s) {
  return s ? s.replace(".NS", "") : "";
}
