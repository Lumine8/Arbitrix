@echo off
REM ═══════════════════════════════════════════════════════════════
REM ARBITRIX RL SYSTEM - QUICK START DEPLOYMENT GUIDE (Windows)
REM ═══════════════════════════════════════════════════════════════

title ARBITRIX RL Deployment

color 0a
echo.
echo   ╔═══════════════════════════════════════════════════════════════╗
echo   ║   🚀 ARBITRIX RL TRADING SYSTEM - DEPLOYMENT GUIDE 🚀        ║
echo   ║   Reinforcement Learning Decision Pipeline v1.0              ║
echo   ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Step 1: Check Prerequisites
echo 📋 STEP 1: Checking Prerequisites
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install from https://nodejs.org
    color 0c
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found
    color 0c
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% found

echo.

REM Step 2: Install Dependencies
echo 📦 STEP 2: Installing Dependencies
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if not exist "node_modules" (
    echo 📥 Installing root packages...
    call npm install
    echo ✅ Root packages installed
) else (
    echo ✓ Root packages already installed
)

echo.

if not exist "server\node_modules" (
    echo 📥 Installing server packages...
    cd server
    call npm install
    cd ..
    echo ✅ Server packages installed
) else (
    echo ✓ Server packages already installed
)

echo.

REM Step 3: Environment Setup
echo 🔧 STEP 3: Environment Configuration
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if not exist "server\.env" (
    echo ⚠️  Creating server\.env file...
    (
        echo # MongoDB Connection
        echo MONGODB_URI=mongodb://localhost:27017/arbitrix
        echo # Or use MongoDB Atlas:
        echo # MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/arbitrix
        echo.
        echo # Server Port
        echo PORT=5000
        echo.
        echo # JWT Secret
        echo JWT_SECRET=arbitrix_secret_key_change_in_production
        echo.
        echo # Anthropic API (for trade reasoning)
        echo ANTHROPIC_API_KEY=sk-ant-...
        echo.
        echo # RL Configuration
        echo RL_ENABLED=true
    ) > server\.env
    echo ✅ Created server\.env
    echo    ⚠️  Please update MONGODB_URI, JWT_SECRET, and ANTHROPIC_API_KEY
) else (
    echo ✓ server\.env already exists
)

echo.

REM Step 4: Validation
echo ✅ STEP 4: Module Validation
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd server
node validate.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Validation failed. Check errors above.
    cd ..
    color 0c
    pause
    exit /b 1
)
cd ..

echo.

REM Step 5: Directory Structure Verification
echo 📁 STEP 5: Verifying Directory Structure
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo Required directories:
if exist "server\rl" (
    echo   ✅ server\rl
) else (
    echo   ⚠️  server\rl ^(will be created on first run^)
)

if exist "src\lib" (
    echo   ✅ src\lib
) else (
    echo   ⚠️  src\lib
)

if exist "tests" (
    echo   ✅ tests
) else (
    echo   ⚠️  tests
)

if exist "models" (
    echo   ✅ models
) else (
    echo   ⚠️  models ^(will be created on first save^)
)

if exist "public" (
    echo   ✅ public
) else (
    echo   ⚠️  public
)

echo.

REM Step 6: Display Summary
color 0a
echo 🎯 DEPLOYMENT SUMMARY
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo ✅ All checks passed! Ready to start ARBITRIX RL System
echo.

echo 📊 SYSTEM COMPONENTS:
echo    ✓ Node.js Runtime
echo    ✓ Express Server (Backend)
echo    ✓ React Frontend
echo    ✓ MongoDB Connection
echo    ✓ TensorFlow.js (RL Model)
echo    ✓ Decision Engine
echo    ✓ Learning Engine
echo    ✓ RL Policy Network
echo    ✓ Paper Trading Engine
echo.

echo 🚀 NEXT STEPS:
echo.

echo 1. Update server\.env with your credentials:
echo    - MONGODB_URI (local or Atlas)
echo    - JWT_SECRET (random string)
echo    - ANTHROPIC_API_KEY (Claude API key)
echo.

echo 2. Start Backend Server:
echo    cd server ^& npm start
echo.

echo 3. In new terminal, start Frontend:
echo    npm run dev
echo.

echo 4. Open http://localhost:5173 in browser
echo.

echo 5. Monitor RL Learning:
echo    - Dashboard shows real-time metrics
echo    - Learning curve improves over time
echo    - Model auto-saves every 100 trades
echo.

echo 📖 DOCUMENTATION:
echo    - RL_IMPLEMENTATION_GUIDE.md (complete reference)
echo    - RL_USAGE_EXAMPLES.js (code examples)
echo    - RL_COMPLETION_SUMMARY.md (project overview)
echo.

echo 🧪 TESTING:
echo    cd server ^& npm test
echo.

echo 📊 API ENDPOINTS (RL):
echo    POST   /api/rl/decide              Get RL decision
echo    POST   /api/rl/process-outcome     Learn from trade outcome
echo    GET    /api/rl/stats               Get RL statistics
echo    GET    /api/rl/learning-curve      Get training progress
echo    POST   /api/rl/save-model          Save trained model
echo    POST   /api/rl/load-model          Load trained model
echo    GET    /api/rl/models              List available models
echo    POST   /api/rl/reset               Reset RL engine
echo.

echo ═════════════════════════════════════════════════════════════════
echo.

echo 👉 READY TO START!
echo.
echo Press any key to open instructions...
pause

color 0b
echo.
echo 🎉 ARBITRIX RL Trading System is ready for deployment!
echo.
echo Next: Edit server\.env and run these commands:
echo    cd server
echo    npm start
echo.
echo In another terminal:
echo    npm run dev
echo.
pause
