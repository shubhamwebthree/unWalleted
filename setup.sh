#!/bin/bash

echo "🚀 Setting up unWalleted Task Reward System"
echo "=============================================="

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

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Copy environment files
echo "⚙️  Setting up environment files..."

if [ ! -f .env ]; then
    cp env.example .env
    echo "📝 Created .env file from template"
    echo "⚠️  Please edit .env with your Firebase and Flow credentials"
else
    echo "✅ .env file already exists"
fi

if [ ! -f client/.env ]; then
    cp client/env.example client/.env
    echo "📝 Created client/.env file from template"
    echo "⚠️  Please edit client/.env with your Firebase credentials"
else
    echo "✅ client/.env file already exists"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Firebase service account credentials"
echo "2. Edit client/.env with your Firebase web app credentials"
echo "3. Configure Flow blockchain settings in .env"
echo "4. Deploy smart contracts: npm run deploy"
echo "5. Start the application: npm run dev"
echo ""
echo "For more information, check the README.md file" 