# Firebase Configuration Guide for unWalleted

## Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ next to "Project Overview" → "Project settings"
4. Scroll down to "Your apps" section
5. Click "Add app" → "Web" (</>) if you don't have a web app yet
6. Register your app with a nickname (e.g., "unWalleted Web")
7. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...your-actual-api-key...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 2: Update Your Environment File

Open `unWalleted/client/.env` and replace the values with your actual Firebase config:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyD...your-actual-api-key...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## Step 3: Enable Google Authentication

1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Click on "Google" provider
3. Enable it and configure:
   - Project support email: your-email@domain.com
   - Authorized domains: localhost (for development)
4. Save the changes

## Step 4: Restart Your App

After updating the `.env` file:

```bash
cd unWalleted/client
npm start
```

## Step 5: Test Authentication

1. Open http://localhost:3000
2. Click "Sign in with Google"
3. You should now be able to authenticate successfully

## Troubleshooting

- **API key not valid**: Make sure you copied the entire API key from Firebase
- **Auth domain error**: Ensure your domain is authorized in Firebase Authentication settings
- **CORS error**: Make sure you're using the correct Firebase project ID

## Example Configuration

Here's what your `.env` file should look like (with real values):

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_FIREBASE_API_KEY=AIzaSyC2xYz1234567890abcdefghijklmnop
REACT_APP_FIREBASE_AUTH_DOMAIN=my-unwalleted-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=my-unwalleted-app
REACT_APP_FIREBASE_STORAGE_BUCKET=my-unwalleted-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=987654321098
REACT_APP_FIREBASE_APP_ID=1:987654321098:web:abcdef1234567890
``` 