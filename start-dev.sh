#!/bin/bash

# EventSphere Startup Script
# This script helps you start the development environment

echo "🚀 EventSphere Development Environment"
echo "======================================"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    pnpm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && pnpm install && cd ..
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo "   Required: DATABASE_URL, Firebase credentials"
    echo ""
    read -p "Press Enter after updating .env to continue..."
fi

# Check if Prisma client is generated
if [ ! -d "node_modules/.prisma" ]; then
    echo "🔧 Generating Prisma Client..."
    pnpm prisma:generate
fi

# Ask if user wants to run migrations
echo ""
read -p "Do you want to run database migrations? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Running database migrations..."
    pnpm prisma:migrate
fi

# Ask if user wants to seed database
echo ""
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Starting development servers..."
echo "================================"
echo "Backend API: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo "================================"
echo ""

# Start both servers using tmux or just instructions
if command -v tmux &> /dev/null; then
    echo "Starting servers in tmux sessions..."
    tmux new-session -d -s eventsphere-backend 'cd server && pnpm dev'
    tmux new-session -d -s eventsphere-frontend 'pnpm dev'
    echo ""
    echo "✅ Servers started in background!"
    echo ""
    echo "To view backend logs: tmux attach -t eventsphere-backend"
    echo "To view frontend logs: tmux attach -t eventsphere-frontend"
    echo "To stop servers: tmux kill-session -t eventsphere-backend && tmux kill-session -t eventsphere-frontend"
else
    echo "📝 Manual start required (tmux not found):"
    echo ""
    echo "Terminal 1: cd server && pnpm dev"
    echo "Terminal 2: pnpm dev"
fi

echo ""
echo "Happy coding! 🎉"
