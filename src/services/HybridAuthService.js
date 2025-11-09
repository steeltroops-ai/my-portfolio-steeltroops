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
 * Hybrid sign in function
 * Tries Supabase first, falls back to local authentication
 */
export const signInWithCredentials = async (identifier, password) => {
  console.log("🔐 HybridAuth: Starting authentication...");
  console.log("📝 Identifier:", identifier);
  console.log("📝 Password length:", password?.length);

  // ALWAYS try local auth first for now since Supabase credentials are invalid
  console.log("🔄 Trying local authentication...");

  try {
    const localResult = await localSignIn(identifier, password);
    console.log("📋 Local auth result:", JSON.stringify(localResult, null, 2));

    if (localResult && localResult.data && !localResult.error) {
      console.log("✅ Local auth successful!");
      return {
        data: localResult.data,
        error: null,
        authType: "local",
      };
    }

    console.log("❌ Local auth failed:", localResult?.error?.message);
  } catch (localError) {
    console.error("❌ Local auth exception:", localError);
  }

  // If local auth fails, try Supabase as backup
  try {
    const supabaseAvail = await isSupabaseAvailable();
    console.log("📡 Supabase available:", supabaseAvail);

    if (supabaseAvail) {
      console.log("🔄 Trying Supabase authentication...");

      // Try email-based sign in first
      let result = await supabaseSignIn(identifier, password);

      // If email sign in fails, try username-based sign in
      if (result.error) {
        console.log("⚠️ Email auth failed, trying username auth...");
        result = await supabaseSignInCredentials(identifier, password);
      }

      if (!result.error) {
        console.log("✅ Supabase auth successful!");
        return {
          ...result,
          authType: "supabase",
        };
      }

      console.warn("⚠️ Supabase auth failed:", result.error?.message);
    }
  } catch (supabaseError) {
    console.warn("⚠️ Supabase error:", supabaseError.message);
  }

  // Both failed
  return {
    data: null,
    error: {
      message: "Invalid credentials. Please use: admin / admin123",
      type: "auth_failed",
    },
  };
};

/**
 * Hybrid sign out function
 */
export const signOut = async () => {
  try {
    const results = await Promise.allSettled([
      supabaseSignOut(),
      localSignOut(),
    ]);

    // Return success if at least one sign out succeeded
    const hasError = results.every(
      (result) => result.status === "rejected" || result.value?.error
    );

    return {
      error: hasError ? { message: "Sign out partially failed" } : null,
    };
  } catch (error) {
    console.error("Hybrid sign out error:", error);
    return {
      error: { message: "Sign out failed" },
    };
  }
};

/**
 * Get current session from either Supabase or local storage
 */
export const getSession = async () => {
  try {
    // Check Supabase first
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

    // Fall back to local session
    const localSession = await localGetSession();
    if (localSession.data?.session) {
      return {
        data: {
          session: {
            ...localSession.data.session,
            authType: "local",
          },
        },
        error: null,
      };
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
 * Check if user is authenticated in either system
 */
export const isAuthenticated = async () => {
  try {
    // Check Supabase first
    if (await isSupabaseAvailable()) {
      const supabaseAuth = await supabaseIsAuthenticated();
      if (supabaseAuth) return true;
    }

    // Check local authentication
    return await localIsAuthenticated();
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
};

/**
 * Get comprehensive authentication information
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

    // If not authenticated via Supabase, check local auth
    if (!authInfo.isAuthenticated) {
      const localAuth = localGetAuthInfo();
      if (localAuth.isAuthenticated) {
        authInfo = {
          ...authInfo,
          authType: "local",
          user: localAuth.user,
          isAuthenticated: true,
          ...localAuth,
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
 * Extend current session (local auth only)
 */
export const extendSession = async () => {
  try {
    const authInfo = await getAuthInfo();

    if (authInfo.authType === "local") {
      return await localExtendSession();
    }

    // Supabase handles session extension automatically
    return { data: null, error: null };
  } catch (error) {
    return { error: { message: "Failed to extend session" } };
  }
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
