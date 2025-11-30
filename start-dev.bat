@echo off
REM EventSphere Startup Script for Windows
REM This script helps you start the development environment

echo.
echo ========================================
echo  EventSphere Development Environment
echo ========================================
echo.

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call pnpm install
)

if not exist "server\node_modules\" (
    echo Installing backend dependencies...
    cd server
    call pnpm install
    cd ..
)

REM Check if .env exists
if not exist ".env" (
    echo.
    echo WARNING: No .env file found!
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo .env file created. Please edit it with your configuration.
    echo Required: DATABASE_URL, Firebase credentials
    echo.
    pause
)

REM Check if Prisma client is generated
if not exist "node_modules\.prisma\" (
    echo Generating Prisma Client...
    call pnpm prisma:generate
)

REM Ask if user wants to run migrations
echo.
set /p MIGRATE="Do you want to run database migrations? (y/n): "
if /i "%MIGRATE%"=="y" (
    echo Running database migrations...
    call pnpm prisma:migrate
)

REM Ask if user wants to seed database
echo.
set /p SEED="Do you want to seed the database with sample data? (y/n): "
if /i "%SEED%"=="y" (
    echo Seeding database...
    call npx prisma db seed
)

echo.
echo ========================================
echo  Setup complete!
echo ========================================
echo.
echo Starting development servers...
echo ================================
echo Backend API: http://localhost:3000
echo Frontend: http://localhost:5173
echo ================================
echo.
echo Open TWO terminal windows:
echo.
echo Terminal 1: cd server ^&^& pnpm dev
echo Terminal 2: pnpm dev
echo.
echo Press Ctrl+C in each terminal to stop servers
echo.
echo Happy coding!
pause
