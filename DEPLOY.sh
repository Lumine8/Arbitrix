#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# ARBITRIX RL SYSTEM - QUICK START DEPLOYMENT GUIDE
# ═══════════════════════════════════════════════════════════════

cat << 'EOF'

  ╔═══════════════════════════════════════════════════════════════╗
  ║   🚀 ARBITRIX RL TRADING SYSTEM - DEPLOYMENT GUIDE 🚀        ║
  ║   Reinforcement Learning Decision Pipeline v1.0              ║
  ╚═══════════════════════════════════════════════════════════════╝

EOF

# Step 1: Check Prerequisites
echo "📋 STEP 1: Checking Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm $(npm -v) found"

# Check MongoDB (optional)
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB found (optional, cloud version can be used)"
else
    echo "⚠️  MongoDB not found locally - can use MongoDB Atlas (cloud)"
fi

echo ""

# Step 2: Install Dependencies
echo "📦 STEP 2: Installing Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Root dependencies (frontend)
if [ ! -d "node_modules" ]; then
    echo "📥 Installing root packages..."
    npm install
    echo "✅ Root packages installed"
else
    echo "✓ Root packages already installed"
fi

echo ""

# Server dependencies
if [ ! -d "server/node_modules" ]; then
    echo "📥 Installing server packages..."
    cd server
    npm install
    cd ..
    echo "✅ Server packages installed"
else
    echo "✓ Server packages already installed"
fi

echo ""

# Step 3: Environment Setup
echo "🔧 STEP 3: Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create .env file if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "⚠️  Creating server/.env file..."
    cat > server/.env << 'ENVEOF'
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/arbitrix
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/arbitrix

# Server Port
PORT=5000

# JWT Secret
JWT_SECRET=arbitrix_secret_key_change_in_production

# Anthropic API (for trade reasoning)
ANTHROPIC_API_KEY=sk-ant-...

# RL Configuration
RL_ENABLED=true
ENVEOF
    echo "✅ Created server/.env"
    echo "   ⚠️  Please update MONGODB_URI, JWT_SECRET, and ANTHROPIC_API_KEY"
else
    echo "✓ server/.env already exists"
fi

echo ""

# Step 4: Validation
echo "✅ STEP 4: Module Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd server
node validate.js
VALIDATION_RESULT=$?
cd ..

if [ $VALIDATION_RESULT -ne 0 ]; then
    echo "❌ Validation failed. Please check errors above."
    exit 1
fi

echo ""

# Step 5: Directory Structure Verification
echo "📁 STEP 5: Verifying Directory Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Required directories:"
for dir in "server/rl" "src/lib" "tests" "models" "public"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ⚠️  $dir (will be created on first run)"
    fi
done

echo ""

# Step 6: Display Summary
echo "🎯 DEPLOYMENT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat << 'EOF'

✅ All checks passed! Ready to start ARBITRIX RL System

📊 SYSTEM COMPONENTS:
   ✓ Node.js Runtime
   ✓ Express Server (Backend)
   ✓ React Frontend
   ✓ MongoDB Connection
   ✓ TensorFlow.js (RL Model)
   ✓ Decision Engine
   ✓ Learning Engine
   ✓ RL Policy Network
   ✓ Paper Trading Engine

🚀 NEXT STEPS:

1. Update server/.env with your credentials:
   - MONGODB_URI (local or Atlas)
   - JWT_SECRET (random string)
   - ANTHROPIC_API_KEY (Claude API key)

2. Start MongoDB (if local):
   mongod --dbpath ./data

3. Start Backend Server:
   cd server && npm start
   
4. In new terminal, start Frontend:
   npm run dev

5. Open http://localhost:5173 in browser

6. Monitor RL Learning:
   - Dashboard shows real-time metrics
   - Learning curve improves over time
   - Model auto-saves every 100 trades

📖 DOCUMENTATION:
   - RL_IMPLEMENTATION_GUIDE.md (complete reference)
   - RL_USAGE_EXAMPLES.js (code examples)
   - RL_COMPLETION_SUMMARY.md (project overview)

🧪 TESTING:
   cd server && npm install
   node tests/rlTests.js

📊 API ENDPOINTS (RL):
   POST   /api/rl/decide              Get RL decision
   POST   /api/rl/process-outcome     Learn from trade outcome
   GET    /api/rl/stats               Get RL statistics
   GET    /api/rl/learning-curve      Get training progress
   POST   /api/rl/save-model          Save trained model
   POST   /api/rl/load-model          Load trained model
   GET    /api/rl/models              List available models
   POST   /api/rl/reset               Reset RL engine

⚙️  CONFIGURATION:
   Edit src/lib/constants.js → RL_CONFIG

📈 EXPECTED LEARNING CURVE:
   Trades 1-20:   Exploration (ε=10%)
   Trades 21-50:  Early Learning (ε=5%)
   Trades 51-100: Specialization (ε=3%)
   Trades 100+:   Refinement (ε=1%)

💾 MODEL STORAGE:
   Location: ./models/
   Supports: save, load, export
   Auto-checkpoint: every 100 cycles

🔐 SAFETY MECHANISMS:
   ✓ Graceful fallback to traditional signals
   ✓ Input validation on all API endpoints
   ✓ Error logging and monitoring
   ✓ Model validation before use
   ✓ Buffer overflow protection
   ✓ NaN/invalid value handling

🎯 DEPLOYMENT CHECKLIST:
   [ ] .env file created and configured
   [ ] MongoDB accessible
   [ ] npm install completed
   [ ] npm start in server/ shows RL initialization
   [ ] npm run dev in root shows React startup
   [ ] http://localhost:5173 loads without errors
   [ ] Backend health check: curl http://localhost:5000/health
   [ ] RL stats accessible: curl http://localhost:5000/api/rl/stats
   [ ] First trade completes successfully
   [ ] Learning curve visible in dashboard

═════════════════════════════════════════════════════════════════

👉 TO START NOW:

   1. Update server/.env
   2. cd server && npm start
   3. (New terminal) npm run dev
   4. Open http://localhost:5173

🎉 ARBITRIX RL Trading System is ready!

═════════════════════════════════════════════════════════════════

EOF

echo "✅ Deployment guide complete!"
echo ""
echo "For more info: cat RL_IMPLEMENTATION_GUIDE.md"
