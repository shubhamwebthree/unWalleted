# Backend Server

This is the backend for the walletless Flow DApp.

## Structure

- .env: Environment variables
- signer.js: Transaction signing logic
- src/
  - app.js: Main Express app
  - auth/authController.js: Authentication logic
  - db/db.js: Database connection
  - flow/flowService.js: Flow blockchain service
  - routes/index.js: API routes
  - utils/helpers.js: Utility functions 