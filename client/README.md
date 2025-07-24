# Frontend Client

This is the React frontend for the walletless Flow DApp.

## Structure

- .env: Environment variables
- package.json: Frontend dependencies
- public/index.html: HTML template
- src/
  - App.jsx: Main app component
  - main.jsx: Entry point
  - components/
    - BalanceDisplay.jsx: Shows user balance
    - WalletConnect.jsx: Wallet connect UI
  - context/WalletContext.jsx: React context for wallet state
  - pages/Home.jsx: Home page
  - services/flowService.js: Flow blockchain service 