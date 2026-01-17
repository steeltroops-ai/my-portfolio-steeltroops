/**
 * Hybrid Authentication Service
 * Uses Neon database authentication with fallback support
 */

import {
  signInWithEmail as neonSignIn,
  signOut as neonSignOut,
  isAuthenticated as neonIsAuthenticated,
  getCurrentUser as neonGetCurrentUser,
} from "./NeonAuthService";

import { getToken } from "@/lib/neon";

// Check if Neon API is available
const isNeonAvailable = async () => {
  try {
    // Check if we have a token and can verify it
    if (getToken()) {
      const result = await neonGetCurrentUser();
      return !result.error || result.error.message !== "Unauthorized";
    }
    // If no token, assume Neon is available for login
    return true;
  } catch (error) {
    console.warn("Neon auth unavailable:", error.message);
    return false;
  }
};

/**
 * Sign in with credentials (email/password)
 */
export const signInWithCredentials = async (identifier, password) => {
  console.log("Neon Auth: Starting authentication...");
  console.log("Email:", identifier);

  try {
    const neonAvail = await isNeonAvailable();
    console.log("Neon available:", neonAvail);

    if (!neonAvail) {
      return {
        data: null,
        error: {
          message: "Authentication service is not available",
          type: "config_error",
        },
      };
    }

    console.log("Authenticating with Neon...");
    const result = await neonSignIn(identifier, password);

    if (!result.error && result.data) {
      console.log("Neon auth successful!");
      return {
        ...result,
        authType: "neon",
      };
    }

    console.warn("Neon auth failed:", result.error?.message);
    return {
      data: null,
      error: {
        message: result.error?.message || "Invalid email or password",
        type: "auth_failed",
      },
    };
  } catch (error) {
    console.error("Neon auth error:", error);
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
 * Sign out
 */
export const signOut = async () => {
  try {
    const result = await neonSignOut();
    return result;
  } catch (error) {
    console.error("Sign out error:", error);
    return {
      error: { message: "Sign out failed" },
    };
  }
};

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const user = await neonGetCurrentUser();
    if (user.data && !user.error) {
      return {
        data: {
          session: {
            user: user.data,
            authType: "neon",
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
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    return await neonIsAuthenticated();
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
};

/**
 * Get authentication information
 */
export const getAuthInfo = async () => {
  try {
    let authInfo = {
      neonAvailable: await isNeonAvailable(),
      authType: null,
      user: null,
      isAuthenticated: false,
    };

    if (authInfo.neonAvailable && getToken()) {
      const user = await neonGetCurrentUser();
      if (user.data && !user.error) {
        authInfo = {
          ...authInfo,
          authType: "neon",
          user: user.data,
          isAuthenticated: true,
        };
      }
    }

    return authInfo;
  } catch (error) {
    console.error("Get auth info error:", error);
    return {
      neonAvailable: false,
      authType: null,
      user: null,
      isAuthenticated: false,
      error: error.message,
    };
  }
};

/**
 * Extend current session (handled automatically by token expiration)
 */
export const extendSession = async () => {
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

/**
 * Auth state change listener
 */
export const onAuthStateChange = (callback) => {
  // Initial check
  isAuthenticated().then((authenticated) => {
    callback(authenticated ? "SIGNED_IN" : "SIGNED_OUT", null);
  });

  // For token changes, use storage events
  const handleStorageChange = (event) => {
    if (event.key === "neon_auth_token") {
      callback(event.newValue ? "SIGNED_IN" : "SIGNED_OUT", null);
    }
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
};
