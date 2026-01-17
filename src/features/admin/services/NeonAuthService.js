// Neon Auth Service - Replaces SupabaseAuthService
import { authApi, getToken, removeToken } from '@/lib/neon';

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const result = await authApi.login(email, password);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error signing in with email:', error);
    return { data: null, error };
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email, password, metadata = {}) => {
  try {
    const result = await authApi.register(email, password, metadata.displayName);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error signing up with email:', error);
    return { data: null, error };
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    await authApi.logout();
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    removeToken(); // Ensure token is removed even on error
    return { error };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const result = await authApi.getCurrentUser();
    return { data: result.user, error: null };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { data: null, error };
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    const result = await authApi.verifyToken();
    return result.authenticated;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Admin login
 */
export const adminLogin = async (email, password) => {
  try {
    const result = await authApi.login(email, password);
    
    if (result.success && result.user?.role !== 'admin') {
      await authApi.logout();
      throw new Error('Unauthorized: Admin access required');
    }

    return { success: true };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Legacy login function for backward compatibility
 */
export const login = async (username, password) => {
  const email = username.includes('@') ? username : `${username}@portfolio.com`;
  const result = await adminLogin(email, password);
  return result.success;
};

/**
 * Legacy logout function for backward compatibility
 */
export const logout = () => {
  removeToken();
  authApi.logout().catch(() => {}); // Fire and forget
};

/**
 * Enhanced authentication check
 */
export const isAuthenticatedLegacy = async () => {
  try {
    if (!getToken()) return false;
    
    const result = await authApi.verifyToken();
    return result.authenticated && result.isAdmin;
  } catch (error) {
    console.error('Authentication check error:', error);
    return false;
  }
};

/**
 * Initialize admin user (run once during setup)
 */
export const initializeAdminUser = async (email = 'admin@portfolio.com', password = 'admin123') => {
  try {
    const result = await authApi.register(email, password, email.split('@')[0]);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error initializing admin user:', error);
    return { data: null, error };
  }
};

/**
 * Listen to authentication state changes (simplified - no real-time updates with Neon)
 */
export const onAuthStateChange = (callback) => {
  // Initial check
  authApi.verifyToken()
    .then(result => {
      callback(result.authenticated ? 'SIGNED_IN' : 'SIGNED_OUT', result);
    })
    .catch(() => {
      callback('SIGNED_OUT', null);
    });

  // Return no-op unsubscribe function
  return () => {};
};
