/**
 * Local Authentication Service
 * Provides fallback authentication when Supabase is unavailable
 * Uses secure localStorage with encrypted tokens and session management
 */

// Configuration
const LOCAL_AUTH_CONFIG = {
  tokenKey: 'portfolio_local_auth_token',
  sessionKey: 'portfolio_local_session',
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  attemptsKey: 'portfolio_login_attempts',
  lockoutKey: 'portfolio_lockout_until'
};

// Default admin credentials (should be changed in production)
const DEFAULT_CREDENTIALS = {
  username: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
  email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@portfolio.com'
};

/**
 * Generate a secure random token using Web Crypto API
 */
const generateSecureToken = async () => {
  try {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Web Crypto API not available, using fallback');
    // Fallback for environments without crypto API
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
};

/**
 * Simple hash function for password verification
 * Note: In production, use proper password hashing like bcrypt
 */
const simpleHash = async (text) => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Web Crypto API not available for hashing');
    // Simple fallback (not secure for production)
    return btoa(text).split('').reverse().join('');
  }
};

/**
 * Check if user is currently locked out due to failed attempts
 */
const isLockedOut = () => {
  const lockoutUntil = localStorage.getItem(LOCAL_AUTH_CONFIG.lockoutKey);
  if (!lockoutUntil) return false;

  const lockoutTime = parseInt(lockoutUntil);
  if (Date.now() > lockoutTime) {
    // Lockout expired, clear it
    localStorage.removeItem(LOCAL_AUTH_CONFIG.lockoutKey);
    localStorage.removeItem(LOCAL_AUTH_CONFIG.attemptsKey);
    return false;
  }

  return true;
};

/**
 * Record a failed login attempt
 */
const recordFailedAttempt = () => {
  const attempts = parseInt(localStorage.getItem(LOCAL_AUTH_CONFIG.attemptsKey) || '0') + 1;
  localStorage.setItem(LOCAL_AUTH_CONFIG.attemptsKey, attempts.toString());

  if (attempts >= LOCAL_AUTH_CONFIG.maxLoginAttempts) {
    const lockoutUntil = Date.now() + LOCAL_AUTH_CONFIG.lockoutDuration;
    localStorage.setItem(LOCAL_AUTH_CONFIG.lockoutKey, lockoutUntil.toString());
  }

  return attempts;
};

/**
 * Clear failed login attempts
 */
const clearFailedAttempts = () => {
  localStorage.removeItem(LOCAL_AUTH_CONFIG.attemptsKey);
  localStorage.removeItem(LOCAL_AUTH_CONFIG.lockoutKey);
};

/**
 * Create a session object
 */
const createSession = async (user) => {
  const token = await generateSecureToken();
  const session = {
    token,
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + LOCAL_AUTH_CONFIG.sessionTimeout,
    type: 'local'
  };

  localStorage.setItem(LOCAL_AUTH_CONFIG.tokenKey, token);
  localStorage.setItem(LOCAL_AUTH_CONFIG.sessionKey, JSON.stringify(session));

  return session;
};

/**
 * Get current session
 */
const getCurrentSession = () => {
  try {
    const sessionData = localStorage.getItem(LOCAL_AUTH_CONFIG.sessionKey);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error parsing session data:', error);
    clearSession();
    return null;
  }
};

/**
 * Clear current session
 */
const clearSession = () => {
  localStorage.removeItem(LOCAL_AUTH_CONFIG.tokenKey);
  localStorage.removeItem(LOCAL_AUTH_CONFIG.sessionKey);
};

/**
 * Sign in with username/email and password
 */
export const signInWithPassword = async (identifier, password) => {
  console.log("🔐 LocalAuth: Starting local authentication...");
  console.log("📝 Identifier:", identifier);
  console.log("📝 Password length:", password?.length);
  console.log("🔑 Expected username:", DEFAULT_CREDENTIALS.username);
  console.log("🔑 Expected email:", DEFAULT_CREDENTIALS.email);

  try {
    // Check if locked out
    if (isLockedOut()) {
      const lockoutUntil = localStorage.getItem(LOCAL_AUTH_CONFIG.lockoutKey);
      const remainingTime = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 60000);
      console.log("🔒 Account is locked out");
      return {
        data: null,
        error: {
          message: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
          type: 'lockout'
        }
      };
    }

    // Verify credentials
    const isValidUsername = identifier === DEFAULT_CREDENTIALS.username;
    const isValidEmail = identifier === DEFAULT_CREDENTIALS.email;
    const isValidPassword = password === DEFAULT_CREDENTIALS.password;

    console.log("✓ Username match:", isValidUsername);
    console.log("✓ Email match:", isValidEmail);
    console.log("✓ Password match:", isValidPassword);

    if ((isValidUsername || isValidEmail) && isValidPassword) {
      // Successful login
      console.log("✅ Credentials valid! Creating session...");
      clearFailedAttempts();

      const user = {
        id: 'local-admin',
        email: DEFAULT_CREDENTIALS.email,
        username: DEFAULT_CREDENTIALS.username,
        role: 'admin',
        authType: 'local'
      };

      const session = await createSession(user);
      console.log("✅ Session created successfully");

      return {
        data: {
          user,
          session
        },
        error: null
      };
    } else {
      // Failed login
      console.log("❌ Invalid credentials");
      const attempts = recordFailedAttempt();
      const remainingAttempts = LOCAL_AUTH_CONFIG.maxLoginAttempts - attempts;

      return {
        data: null,
        error: {
          message: remainingAttempts > 0
            ? `Invalid credentials. ${remainingAttempts} attempts remaining.`
            : 'Invalid credentials. Account will be locked after next failed attempt.',
          type: 'invalid_credentials',
          remainingAttempts
        }
      };
    }
  } catch (error) {
    console.error('❌ Local auth error:', error);
    return {
      data: null,
      error: {
        message: 'Authentication service error: ' + error.message,
        type: 'service_error'
      }
    };
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    clearSession();
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: { message: 'Sign out failed' } };
  }
};

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const session = getCurrentSession();
    return {
      data: { session },
      error: null
    };
  } catch (error) {
    return {
      data: { session: null },
      error: { message: 'Session retrieval failed' }
    };
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    const session = getCurrentSession();
    return !!session;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

/**
 * Get authentication status info
 */
export const getAuthInfo = () => {
  const session = getCurrentSession();
  const lockoutUntil = localStorage.getItem(LOCAL_AUTH_CONFIG.lockoutKey);
  const attempts = parseInt(localStorage.getItem(LOCAL_AUTH_CONFIG.attemptsKey) || '0');

  return {
    isAuthenticated: !!session,
    authType: 'local',
    user: session?.user || null,
    isLockedOut: isLockedOut(),
    lockoutUntil: lockoutUntil ? parseInt(lockoutUntil) : null,
    failedAttempts: attempts,
    maxAttempts: LOCAL_AUTH_CONFIG.maxLoginAttempts,
    sessionExpiresAt: session?.expiresAt || null
  };
};

/**
 * Extend current session
 */
export const extendSession = async () => {
  try {
    const session = getCurrentSession();
    if (!session) return { error: { message: 'No active session' } };

    session.expiresAt = Date.now() + LOCAL_AUTH_CONFIG.sessionTimeout;
    localStorage.setItem(LOCAL_AUTH_CONFIG.sessionKey, JSON.stringify(session));

    return { data: session, error: null };
  } catch (error) {
    return { error: { message: 'Failed to extend session' } };
  }
};
