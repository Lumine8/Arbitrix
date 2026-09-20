#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# ARBITRIX - QUICK START DEPLOYMENT
# ═══════════════════════════════════════════════════════════════

cat << 'EOF'

  ╔═══════════════════════════════════════════════════════════════╗
  ║         ARBITRIX TRADING SYSTEM - DEPLOYMENT                 ║
  ╚═══════════════════════════════════════════════════════════════╝

EOF

# Step 1: Check Prerequisites
echo "STEP 1: Checking Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Install Node.js 18+ from https://nodejs.org"
    exit 1
fi
echo "OK: Node.js $(node -v)"

if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found"
    exit 1
fi
echo "OK: npm $(npm -v)"

echo ""

# Step 2: Install Dependencies
echo "STEP 2: Installing Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "node_modules" ]; then
    echo "Installing root packages..."
    npm install
    echo "OK: Root packages installed"
else
    echo "OK: Root packages already installed"
fi

echo ""

if [ ! -d "server/node_modules" ]; then
    echo "Installing server packages..."
    cd server
    npm install
    cd ..
    echo "OK: Server packages installed"
else
    echo "OK: Server packages already installed"
fi

echo ""

# Step 3: Environment Setup
echo "STEP 3: Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "server/.env" ]; then
    echo "Creating server/.env file..."
    cat > server/.env << 'ENVEOF'
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/arbitrix

# Server Port
PORT=5000

# JWT Secret
JWT_SECRET=arbitrix_secret_key_change_in_production
ENVEOF
    echo "OK: Created server/.env"
    echo "   Update MONGODB_URI and JWT_SECRET as needed"
else
    echo "OK: server/.env already exists"
fi

echo ""

# Step 4: Validation
echo "STEP 4: Module Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd server
node validate.js
VALIDATION_RESULT=$?
cd ..

if [ $VALIDATION_RESULT -ne 0 ]; then
    echo "Validation failed. Check errors above."
    exit 1
fi

echo ""

# Step 5: Summary
echo "DEPLOYMENT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat << 'EOF'

All checks passed! Ready to start ARBITRIX.

SYSTEM COMPONENTS:
   OK: Node.js Runtime
   OK: Express Server (Backend)
   OK: React Frontend
   OK: Decision Engine
   OK: Learning Engine
   OK: Paper Trading Engine

NEXT STEPS:

1. Start Backend:
   cd server && npm start

2. Start Frontend (new terminal):
   npm run dev

3. Open http://localhost:5173

════════════════════════════════════════════════════════════════

EOF

echo "Deployment complete!"
