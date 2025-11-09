/**
 * Hybrid Authentication Service
 * Tries Supabase authentication first, falls back to local authentication
 */

import {
  signInWithEmail as supabaseSignIn,
  login as supabaseSignInCredentials,
  signOut as supabaseSignOut,
  isAuthenticated as supabaseIsAuthenticated,
  getCurrentUser as supabaseGetCurrentUser,
} from "./SupabaseAuthService";

import {
  signInWithPassword as localSignIn,
  signOut as localSignOut,
  getSession as localGetSession,
  isAuthenticated as localIsAuthenticated,
  getAuthInfo as localGetAuthInfo,
  extendSession as localExtendSession,
} from "./LocalAuthService";

// Check if Supabase is available
const isSupabaseAvailable = async () => {
  try {
    // Try to get current user to test Supabase connectivity
    const result = await supabaseGetCurrentUser();
    return !result.error || result.error.message !== "Supabase not configured";
  } catch (error) {
    console.warn("Supabase auth unavailable:", error.message);
    return false;
  }
};

/**
 * Sign in function - ONLY uses Supabase authentication
 */
export const signInWithCredentials = async (identifier, password) => {
  console.log("🔐 Supabase Auth: Starting authentication...");
  console.log("📝 Email:", identifier);

  try {
    const supabaseAvail = await isSupabaseAvailable();
    console.log("📡 Supabase available:", supabaseAvail);

    if (!supabaseAvail) {
      return {
        data: null,
        error: {
          message: "Supabase authentication is not configured",
          type: "config_error",
        },
      };
    }

    console.log("🔄 Authenticating with Supabase...");

    // Use email-based sign in
    const result = await supabaseSignIn(identifier, password);

    if (!result.error && result.data) {
      console.log("✅ Supabase auth successful!");
      return {
        ...result,
        authType: "supabase",
      };
    }

    console.warn("⚠️ Supabase auth failed:", result.error?.message);
    return {
      data: null,
      error: {
        message: result.error?.message || "Invalid email or password",
        type: "auth_failed",
      },
    };
  } catch (error) {
    console.error("❌ Supabase error:", error);
    return {
      data: null,
      error: {
        message: error.message || "Authentication failed",
        type: "auth_error",
      },
    };
  }
};

/**
 * Sign out function - ONLY uses Supabase
 */
export const signOut = async () => {
  try {
    const result = await supabaseSignOut();
    return result;
  } catch (error) {
    console.error("Sign out error:", error);
    return {
      error: { message: "Sign out failed" },
    };
  }
};

/**
 * Get current session from Supabase ONLY
 */
export const getSession = async () => {
  try {
    if (await isSupabaseAvailable()) {
      const user = await supabaseGetCurrentUser();
      if (user.data && !user.error) {
        return {
          data: {
            session: {
              user: user.data,
              authType: "supabase",
            },
          },
          error: null,
        };
      }
    }

    return {
      data: { session: null },
      error: null,
    };
  } catch (error) {
    console.error("Get session error:", error);
    return {
      data: { session: null },
      error: { message: "Session retrieval failed" },
    };
  }
};

/**
 * Check if user is authenticated via Supabase ONLY
 */
export const isAuthenticated = async () => {
  try {
    if (await isSupabaseAvailable()) {
      return await supabaseIsAuthenticated();
    }
    return false;
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
};

/**
 * Get authentication information from Supabase ONLY
 */
export const getAuthInfo = async () => {
  try {
    const supabaseAvailable = await isSupabaseAvailable();
    let authInfo = {
      supabaseAvailable,
      authType: null,
      user: null,
      isAuthenticated: false,
    };

    if (supabaseAvailable) {
      const user = await supabaseGetCurrentUser();
      if (user.data && !user.error) {
        authInfo = {
          ...authInfo,
          authType: "supabase",
          user: user.data,
          isAuthenticated: true,
        };
      }
    }

    return authInfo;
  } catch (error) {
    console.error("Get auth info error:", error);
    return {
      supabaseAvailable: false,
      authType: null,
      user: null,
      isAuthenticated: false,
      error: error.message,
    };
  }
};

/**
 * Extend current session - Supabase handles this automatically
 */
export const extendSession = async () => {
  // Supabase handles session extension automatically
  return { data: null, error: null };
};

/**
 * Get user role for authorization
 */
export const getUserRole = async () => {
  try {
    const session = await getSession();
    const user = session.data?.session?.user;

    if (!user) return null;

    // For Supabase users, check user metadata
    if (session.data.session.authType === "supabase") {
      return user.user_metadata?.role || user.app_metadata?.role || "user";
    }

    // For local users, return the role from user object
    return user.role || "user";
  } catch (error) {
    console.error("Get user role error:", error);
    return null;
  }
};

/**
 * Check if user has admin privileges
 */
export const isAdmin = async () => {
  try {
    const role = await getUserRole();
    return role === "admin";
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
};

// Export auth state change listener (for React hooks)
export const onAuthStateChange = (callback) => {
  // For local auth, we'll use storage events
  const handleStorageChange = (event) => {
    if (event.key === "portfolio_local_session") {
      callback("SIGNED_IN", event.newValue ? JSON.parse(event.newValue) : null);
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // Return unsubscribe function
  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
};
