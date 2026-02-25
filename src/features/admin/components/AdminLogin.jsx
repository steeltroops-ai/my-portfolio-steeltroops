import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import {
  signInWithCredentials,
  getAuthInfo,
} from "../services/HybridAuthService";
import { blogQueryKeys } from "@/features/blog/hooks/useBlogQueries";
import { getAllPosts } from "@/features/blog/services/HybridBlogService";

const AdminLogin = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const emailInputRef = useRef(null);
  const queryClient = useQueryClient();
  const codePrefetched = useRef(false);

  // Mount animation
  useEffect(() => {
    setMounted(true);
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  // UI & DATA PREFETCHING: Load the Dashboard resources while user is typing
  // This ensures the "Code" and "Data" are ready before they sogar click login.
  const handleIntelligencePreheat = useCallback(() => {
    if (codePrefetched.current) return;

    console.log("⚡ Initiating Intelligence Preheating (UI + Data)...");
    codePrefetched.current = true;

    // 1. Warm up the JS bundles (Lazy Components)
    import("../components/AdminDashboard");
    import("../layouts/AdminLayout");
    import("../components/Analytics");
    import("../components/MessageCenter");

    // 2. Warm up the Data Caches (Optimistic Fetching)
    // We fetch these in the background. Even if they fail due to no token,
    // they'll be ready the moment login succeeds and the token is set.
    queryClient.prefetchQuery({
      queryKey: blogQueryKeys.allPosts({ limit: 100 }),
      queryFn: () => getAllPosts({ limit: 100 }),
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch critical stats
    import("@/shared/analytics/useAnalyticsStats").then(({ fetchStats }) => {
      queryClient.prefetchQuery({
        queryKey: ["analytics-stats"],
        queryFn: fetchStats,
        staleTime: 5 * 60 * 1000,
      });
    });

    // Prefetch unread messages
    import("../hooks/useContactMessages").then(({ fetchContactMessages }) => {
      queryClient.prefetchQuery({
        queryKey: ["contactMessages", "all"],
        queryFn: () => fetchContactMessages("all"),
        staleTime: 5 * 60 * 1000,
      });
    });
  }, [queryClient]);

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const info = await getAuthInfo();
        setAuthInfo(info);
        if (info.isAuthenticated) {
          handleIntelligencePreheat();
          navigate("/admin/dashboard");
        }
      } catch (err) {
        console.error("Auth check error:", err);
      }
    };

    checkAuth();
  }, [navigate, handleIntelligencePreheat]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!identifier && !password) {
      setError("Please enter both username/email and password");
      return;
    }
    if (!identifier) {
      setError("Please enter your username or email");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError("");

    // Ensure preheating is definitely active
    handleIntelligencePreheat();

    try {
      console.log("=== LOGIN ATTEMPT ===");
      console.log("Username/Email:", identifier);

      // Use hybrid authentication service
      const result = await signInWithCredentials(identifier, password);

      if (result && result.data && !result.error) {
        console.log("✓ Login successful!");

        // Disable analytics for admin session
        localStorage.setItem("portfolio_admin_bypass", "true");

        // Navigate immediately to the pre-heated dashboard
        navigate("/admin/dashboard");
      } else {
        console.error("✗ Login failed:", result.error);
        if (result.error?.type === "config_error") {
          setError(
            "Authentication service is not configured. Please check your environment variables."
          );
        } else {
          setError(result.error?.message || "Invalid email or password");
        }
      }
    } catch (err) {
      console.error("✗ Login exception:", err);
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
      <div
        className={`relative p-6 w-11/12 max-w-xs rounded-2xl border border-white/10 backdrop-blur-[2px] bg-white/5 shadow-2xl transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <h2 className="text-2xl font-bold text-white mb-1.5 text-center">
          Admin Login
        </h2>
        <p className="text-neutral-400 text-xs text-center mb-5">
          Sign in to access your dashboard
        </p>

        {authInfo && (
          <div className="flex justify-center mb-6">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-md text-[10px] font-medium transition-all ${
                authInfo.neonAvailable
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  authInfo.neonAvailable
                    ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]"
                    : "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]"
                }`}
              ></div>
              <span>
                {authInfo.neonAvailable
                  ? "Database Online"
                  : "Database Offline"}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 backdrop-blur-sm">
              <span className="text-red-400 text-xs">⚠</span>
              <p className="text-[11px] text-red-400">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs font-medium text-neutral-300 mb-1.5"
            >
              Email
            </label>
            <input
              ref={emailInputRef}
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (error) setError("");
              }}
              onFocus={handleIntelligencePreheat}
              placeholder="Enter your email"
              disabled={loading}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-white/10 backdrop-blur-md bg-white/5 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-400/30 focus:bg-white/10 disabled:opacity-50 transition-all duration-200"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-neutral-300 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                onFocus={handleIntelligencePreheat}
                placeholder="Enter your password"
                disabled={loading}
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-white/10 backdrop-blur-md bg-white/5 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-400/30 focus:bg-white/10 disabled:opacity-50 transition-all duration-200"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !identifier.trim() || !password.trim()}
            onMouseEnter={handleIntelligencePreheat}
            className="w-full py-2.5 px-4 text-sm rounded-xl border border-purple-400/30 backdrop-blur-[2px] bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-400/40 disabled:bg-white/5 disabled:text-neutral-500 disabled:border-white/10 disabled:cursor-not-allowed text-white font-semibold transition-all duration-300 flex items-center justify-center shadow-md shadow-purple-500/5 hover:shadow-purple-500/10"
          >
            {loading ? "Processing..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
