# ARBITRIX — Technology Stack

## Current Stack

### Frontend
- **React 18** — UI framework
- **Vite** — Build tool and dev server
- **Recharts** — Interactive charting and data visualization

### Backend
- **Node.js 18+** — JavaScript runtime
- **Express.js** — Web framework
- **MongoDB** — NoSQL database (users, trades, logs)
- **Mongoose** — MongoDB ODM
- **JWT** — Stateless authentication
- **bcryptjs** — Password hashing
- **node-fetch** — HTTP client for Yahoo Finance proxy
- **dotenv** — Environment configuration

### Development
- **Nodemon** — Auto-restart backend on changes

## Dependencies (0 vulnerabilities)

### Frontend (`package.json`)
- react, react-dom 18
- recharts
- vite, @vitejs/plugin-react

### Backend (`server/package.json`)
- express
- mongoose
- jsonwebtoken
- bcryptjs
- node-fetch
- dotenv
- nodemon (dev)

## Data Sources
- **Yahoo Finance API** — Stock OHLCV data (via backend proxy, no API key required)

## Future Considerations

When extending ARBITRIX beyond paper trading, consider:

### Real-time Data
- WebSocket connections for live price feeds
- Polygon.io or Zerodha Kite Connect for Indian markets
- Alpaca for US markets

### Database Scaling
- PostgreSQL for relational data (user accounts, transactions)
- Redis for caching and session storage
- TimescaleDB for time-series data

### ML/AI (when needed)
- brain.js — Lightweight neural nets (pure JS, no native deps)
- onnxruntime-node — ONNX model inference
- TensorFlow.js — Only if GPU acceleration is required

### Infrastructure
- Docker for containerization
- CI/CD via GitHub Actions
- Cloud deployment (AWS/GCP/Azure)
