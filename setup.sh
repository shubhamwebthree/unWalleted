#!/bin/bash

echo "🚀 Setting up unWalleted - Task Reward System on Flow"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo "⚠️  Flow CLI is not installed. You'll need it for smart contract deployment."
    echo "   Install it from: https://docs.onflow.org/flow-cli/install/"
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..

echo "✅ Dependencies installed successfully!"

# Create environment files
echo "🔧 Setting up environment files..."

# Create server .env if it doesn't exist
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created server .env file"
else
    echo "ℹ️  Server .env file already exists"
fi

# Create client .env if it doesn't exist
if [ ! -f client/.env ]; then
    cp client/env.example client/.env
    echo "✅ Created client .env file"
else
    echo "ℹ️  Client .env file already exists"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Set up Magic.link authentication:"
echo "   - Go to https://dashboard.magic.link/"
echo "   - Create a new project"
echo "   - Get your Publishable Key and Secret Key"
echo "   - Update the environment files with your keys"
echo ""
echo "2. Configure your environment variables:"
echo "   - Edit .env (server configuration)"
echo "   - Edit client/.env (client configuration)"
echo ""
echo "3. Deploy smart contracts:"
echo "   ./deploy.sh"
echo ""
echo "4. Start the application:"
echo "   npm run dev"
echo ""
echo "🌐 The app will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "✨ Setup complete! Happy coding!" 