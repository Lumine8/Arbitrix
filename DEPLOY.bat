@echo off
REM ═══════════════════════════════════════════════════════════════
REM ARBITRIX - QUICK START DEPLOYMENT (Windows)
REM ═══════════════════════════════════════════════════════════════

title ARBITRIX Deployment

color 0a
echo.
echo   ╔═══════════════════════════════════════════════════════════════╗
echo   ║         ARBITRIX TRADING SYSTEM - DEPLOYMENT                 ║
echo   ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Step 1: Check Prerequisites
echo STEP 1: Checking Prerequisites
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    color 0c
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo OK: Node.js %NODE_VERSION%

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm not found
    color 0c
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo OK: npm %NPM_VERSION%

echo.

REM Step 2: Install Dependencies
echo STEP 2: Installing Dependencies
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if not exist "node_modules" (
    echo Installing root packages...
    call npm install
    echo OK: Root packages installed
) else (
    echo OK: Root packages already installed
)

echo.

if not exist "server\node_modules" (
    echo Installing server packages...
    cd server
    call npm install
    cd ..
    echo OK: Server packages installed
) else (
    echo OK: Server packages already installed
)

echo.

REM Step 3: Environment Setup
echo STEP 3: Environment Configuration
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if not exist "server\.env" (
    echo Creating server\.env file...
    (
        echo # MongoDB Connection
        echo MONGODB_URI=mongodb://localhost:27017/arbitrix
        echo.
        echo # Server Port
        echo PORT=5000
        echo.
        echo # JWT Secret
        echo JWT_SECRET=arbitrix_secret_key_change_in_production
    ) > server\.env
    echo OK: Created server\.env
    echo    Update MONGODB_URI and JWT_SECRET as needed
) else (
    echo OK: server\.env already exists
)

echo.

REM Step 4: Validation
echo STEP 4: Module Validation
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd server
node validate.js
if %ERRORLEVEL% NEQ 0 (
    echo Validation failed. Check errors above.
    cd ..
    color 0c
    pause
    exit /b 1
)
cd ..

echo.

REM Step 5: Summary
color 0a
echo DEPLOYMENT SUMMARY
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo All checks passed! Ready to start ARBITRIX.
echo.
echo SYSTEM COMPONENTS:
echo    OK: Node.js Runtime
echo    OK: Express Server (Backend)
echo    OK: React Frontend
echo    OK: Decision Engine
echo    OK: Learning Engine
echo    OK: Paper Trading Engine
echo.
echo NEXT STEPS:
echo.
echo 1. Start Backend:
echo    cd server ^& npm start
echo.
echo 2. Start Frontend (new terminal):
echo    npm run dev
echo.
echo 3. Open http://localhost:5173
echo.
echo ═════════════════════════════════════════════════════════════════
pause
