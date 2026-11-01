interface Window {
  googleAuth?: {
    token: string | null;
    signIn: (scopes: string[]) => Promise<void>;
    signOut: () => Promise<void>;
  }
}
