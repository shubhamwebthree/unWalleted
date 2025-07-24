# unWalleted - Task Reward System on Flow

A complete task reward system built on Flow blockchain that allows users to earn TASK tokens by completing daily social media tasks without managing a wallet or private keys.

## 🚀 Features

### Authentication & Onboarding
- **Passwordless Authentication**: Magic.link email-based authentication
- **Session Management**: JWT-based secure sessions
- **Walletless Experience**: No private key management required

### Task System
- **Daily Tasks**: 5 different social media tasks refreshed daily
- **Task Types**:
  - Tweet on X (10 TASK tokens)
  - Write LinkedIn Blog/Thread (15 TASK tokens)
  - Upload YouTube Short (20 TASK tokens)
  - Telegram Group Chat (8 TASK tokens)
  - WhatsApp Group Chat (8 TASK tokens)

### Blockchain Integration
- **Flow Blockchain**: Native Flow token rewards
- **Sponsored Transactions**: Backend handles all blockchain interactions
- **Smart Contracts**: Cadence contracts for safe token operations
- **Real-time Balance**: Live token balance updates

### User Experience
- **Mobile-First Design**: Beautiful responsive UI with Tailwind CSS
- **Real-time Updates**: Live task completion and balance updates
- **Task History**: Complete history of completed tasks and rewards
- **Progress Tracking**: Daily completion stats and streaks

## 🏗️ Architecture

```
unWalleted/
├── contracts/          # Flow Cadence smart contracts
│   ├── TaskToken.cdc    # Main reward token contract
│   └── FungibleToken.cdc      # Token interface
├── server/            # Node.js backend API
│   ├── services/      # Business logic services
│   └── index.js       # Main server file
├── client/            # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── contexts/   # React contexts
│   │   └── App.js      # Main app
│   └── public/         # Static assets
├── flow.json          # Flow configuration
└── package.json       # Project dependencies
```

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express**: API server
- **Magic Admin SDK**: Authentication verification
- **JWT**: Session management
- **Flow Client Library (FCL)**: Blockchain integration
- **Helmet**: Security middleware

### Frontend
- **React**: User interface
- **Magic SDK**: Passwordless authentication
- **Flow Client Library (FCL)**: Frontend blockchain integration
- **Tailwind CSS**: Styling and responsive design
- **Axios**: HTTP client
- **React Router**: Navigation
- **React Hot Toast**: Notifications

### Blockchain
- **Flow Blockchain**: Smart contract platform
- **Cadence**: Smart contract language
- **TaskToken**: Custom fungible token contract

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Flow CLI (for contract deployment)
- Magic.link account and API keys

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd unWalleted
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure environment variables**
   ```bash
   # Edit server environment
   cp env.example .env
   # Edit client environment
   cp client/env.example client/.env
   ```

4. **Set up Magic.link**
   - Create a Magic.link project at [dashboard.magic.link](https://dashboard.magic.link/)
   - Get your Publishable Key and Secret Key
   - Update environment variables

5. **Deploy smart contracts**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Environment Variables

#### Server (.env)
```env
# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Flow Blockchain Configuration
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_ADMIN_ADDRESS=your-admin-address
FLOW_ADMIN_PRIVATE_KEY=your-admin-private-key
TASK_TOKEN_ADDRESS=your-contract-address

# Magic.link Configuration
MAGIC_SECRET_KEY=your-magic-secret-key
```

#### Client (client/.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001

# Magic.link Configuration
REACT_APP_MAGIC_PUBLISHABLE_KEY=your-magic-publishable-key
```

## 🔧 Development

### Available Scripts

```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build frontend
npm run build

# Deploy smart contracts
npm run deploy

# Test smart contracts
npm run test
```

### Project Structure

```
unWalleted/
├── contracts/
│   ├── TaskToken.cdc    # Main reward token contract
│   └── FungibleToken.cdc      # Token interface
├── server/
│   ├── index.js              # Main server file
│   ├── services/
│   │   └── flowService.js    # Flow blockchain service
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.js            # Main React app
│   │   ├── index.js          # React entry point
│   │   ├── contexts/
│   │   │   └── AuthContext.js # Authentication context
│   │   ├── components/
│   │   │   └── Navbar.js     # Navigation component
│   │   ├── pages/
│   │   │   ├── Login.js      # Login page
│   │   │   ├── Dashboard.js  # Main dashboard
│   │   │   └── TaskHistory.js # Task history page
│   │   └── App.css           # Main styles
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── tailwind.config.js    # Tailwind configuration
│   └── package.json
├── flow.json                 # Flow configuration
├── package.json             # Root package.json
├── setup.sh                 # Setup script
├── deploy.sh                # Deployment script
└── README.md                # This file
```

## 🔐 Security Features

- **Magic.link Authentication**: Secure passwordless authentication
- **JWT Tokens**: Stateless session management
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Sponsored Transactions**: Backend handles all blockchain operations
- **Cadence Language**: Type-safe smart contracts

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   - Set `NODE_ENV=production`
   - Use production Magic.link project
   - Configure production Flow network
   - Set secure JWT secret

2. **Database Integration**
   - Replace in-memory storage with database
   - Implement user account persistence
   - Add task completion logging

3. **Smart Contract Deployment**
   ```bash
   flow deploy --network=mainnet
   ```

4. **Application Deployment**
   - Deploy backend to cloud platform (Heroku, AWS, etc.)
   - Deploy frontend to CDN (Netlify, Vercel, etc.)
   - Configure environment variables

## 📱 User Journey

1. **Authentication**: User enters email and receives Magic link
2. **Task Display**: User sees daily task list with rewards
3. **Task Completion**: User completes tasks and submits proof
4. **Reward Distribution**: Backend mints TASK tokens to user's Flow account
5. **Balance Update**: User sees updated token balance in real-time

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the Flow documentation: https://docs.onflow.org/

## 🔮 Roadmap

- [ ] Database integration for production
- [ ] Advanced task verification
- [ ] Social features and leaderboards
- [ ] Mobile app development
- [ ] Additional task types
- [ ] Token staking and governance
- [ ] Cross-chain integration
# unWalleted
