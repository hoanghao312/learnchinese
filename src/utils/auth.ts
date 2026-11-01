import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Add required Google Workspace scopes
// provider.addScope('https://www.googleapis.com/auth/drive.file');

const TOKEN_KEY = 'google_drive_access_token';
const EXPIRY_KEY = 'google_drive_token_expiry';

let isSigningIn = false;

// Khôi phục token từ localStorage nếu chưa hết hạn
const getCachedToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  
  if (token && expiry) {
    const expiryTime = parseInt(expiry, 10);
    // Để dư 5 phút (300000ms) trước khi hết hạn
    if (new Date().getTime() < expiryTime - 300000) {
      return token;
    } else {
      // Đã hết hạn, xóa token
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    }
  }
  return null;
};

let cachedAccessToken: string | null = getCachedToken();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = getCachedToken();
      cachedAccessToken = token;
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      cachedAccessToken = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (scopes?: string[]): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    
    // Kiểm tra xem đã có token hợp lệ chưa
    const existingToken = getCachedToken();
    if (existingToken && auth.currentUser) {
        cachedAccessToken = existingToken;
        return { user: auth.currentUser, accessToken: existingToken };
    }
    
    // Scopes are already added to provider above, but we can add more if requested
    if (scopes) {
        scopes.forEach(scope => provider.addScope(scope));
    }
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    
    // Lưu vào localStorage, token thường có thời hạn 1 giờ (3600 giây)
    localStorage.setItem(TOKEN_KEY, cachedAccessToken);
    localStorage.setItem(EXPIRY_KEY, (new Date().getTime() + 3600 * 1000).toString());

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/user-cancelled' ||
      (error.message && error.message.includes('user-cancelled')) ||
      (error.message && error.message.includes('IdP denied access'))
    ) {
      console.log('Sign in cancelled by user.');
      return null;
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  cachedAccessToken = getCachedToken();
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
};
