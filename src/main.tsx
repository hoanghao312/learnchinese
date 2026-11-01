

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { googleSignIn, logout, initAuth, getAccessToken } from './utils/auth.ts';

// We store the token in this property directly.
window.googleAuth = {
  token: null,
  signIn: async (scopes: string[]) => {
    const result = await googleSignIn(scopes);
    if (result) {
      window.googleAuth!.token = result.accessToken;
    }
  },
  signOut: async () => {
    await logout();
    window.googleAuth!.token = null;
  }
};



// Ensure token is populated immediately if cached
getAccessToken().then(token => {
  if (token) {
    window.googleAuth!.token = token;
  }
});

// Initialize auth state
initAuth(
  (user, token) => {
    window.googleAuth!.token = token;
  },
  () => {
    window.googleAuth!.token = null;
  }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
