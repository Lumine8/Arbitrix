/* ═══════════════════════════════════════════
   ARBITRIX — Design Tokens & Stock Universe
════════════════════════════════════════════ */

// ═════════════════════════════════════════════
// TIME INTERVALS (in milliseconds)
// ═════════════════════════════════════════════
export const INTERVALS = {
  AUTO_SCAN: 30000,
  PRICE_REFRESH: 45000,
  LOAD_NEXT_TRADE: 400,
  REJECT_DELAY: 200,
};

// ═════════════════════════════════════════════
// TRADING PARAMETERS
// ═════════════════════════════════════════════
export const TRADING_PARAMS = {
  MAX_ALLOCATION_PER_TRADE: 0.3,
  STOP_LOSS_PERCENTAGE: 0.05,
  MIN_CONFIDENCE_FOR_TRADE: 30,
  BUY_SELL_THRESHOLD: 0.1,
};

// ═════════════════════════════════════════════
// ANALYSIS PARAMETERS
// ═════════════════════════════════════════════
export const ANALYSIS_PARAMS = {
  EMA_TREND_WEIGHT: 0.24,
  RSI_WEIGHT: 0.17,
  MACD_WEIGHT: 0.20,
  BOLLINGER_WEIGHT: 0.14,
  VOLUME_WEIGHT: 0.10,
  STOCH_WEIGHT: 0.15,

  RSI_PERIOD: 14,
  RSI_OVERBOUGHT: 70,

  EMA_FAST: 9,
  EMA_MEDIUM: 21,
  EMA_SLOW: 50,

  STOCH_K_PERIOD: 14,
  STOCH_D_PERIOD: 3,
  STOCH_OVERBOUGHT: 80,
  STOCH_OVERSOLD: 20,

  BOLLINGER_PERIOD: 20,
  BOLLINGER_STD_DEV: 2,

  ATR_PERIOD: 14,
  VOLATILITY_LOOKBACK: 20,
  TRADING_DAYS_PER_YEAR: 252,

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
════════════════════════════════════════════ */

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
   PROXY SERVICES FOR CORS BYPASS
════════════════════════════════════════════ */

export const PROXIES = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
  (url) =>
    `https://jsonpeep.vercel.app/api/proxy?url=${encodeURIComponent(url)}`,
];

/* ═══════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */

export function stockInfo(sym) {
  return (
    STOCKS.find((s) => s.s === sym) || { s: sym, n: sym, sec: "—", p: 1000 }
  );
}

export function fc(n) {
  if (n == null) return "—";
  return (
    "\u20B9" +
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
