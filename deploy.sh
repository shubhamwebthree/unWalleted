#!/bin/bash

echo "🚀 Deploying unWalleted Smart Contracts to Flow"
echo "================================================"

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo "❌ Flow CLI is not installed. Please install Flow CLI first."
    echo "Visit: https://docs.onflow.org/flow-cli/install/"
    exit 1
fi

echo "✅ Flow CLI is installed"

# Check if flow.json exists
if [ ! -f flow.json ]; then
    echo "❌ flow.json not found. Please configure your Flow settings first."
    exit 1
fi

# Check if contracts directory exists
if [ ! -d contracts ]; then
    echo "❌ contracts directory not found"
    exit 1
fi

echo "📦 Deploying contracts to testnet..."

# Deploy to testnet
flow deploy --network=testnet

if [ $? -eq 0 ]; then
    echo "✅ Contracts deployed successfully to testnet!"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with the deployed contract addresses"
    echo "2. Start the application: npm run dev"
else
    echo "❌ Failed to deploy contracts"
    exit 1
fi 