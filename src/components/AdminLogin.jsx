import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithCredentials,
  getAuthInfo,
} from "../services/HybridAuthService";

const AdminLogin = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState(null);
  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const info = await getAuthInfo();
        setAuthInfo(info);
        if (info.isAuthenticated) {
          navigate("/admin/dashboard");
        }
      } catch (err) {
        console.error("Auth check error:", err);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please enter both username/email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use hybrid authentication service
      const result = await signInWithCredentials(identifier, password);

      if (result.data && !result.error) {
        // Success - redirect to dashboard
        navigate("/admin/dashboard");
      } else {
        // Handle different error types
        if (result.error?.type === "lockout") {
          setError(result.error.message);
        } else if (result.error?.type === "invalid_credentials") {
          setError(result.error.message);
        } else {
          setError(result.error?.message || "Login failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
      <div className="relative p-8 w-96 rounded-xl border backdrop-blur-sm border-neutral-800 bg-neutral-900/30">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Admin Login
        </h2>

        {/* Authentication Status Indicator */}
        {authInfo && (
          <div className="mb-4 p-3 rounded-lg border">
            <div
              className={`flex items-center gap-2 text-sm ${
                authInfo.supabaseAvailable
                  ? "text-green-400 border-green-700/30 bg-green-900/20"
                  : "text-amber-400 border-amber-700/30 bg-amber-900/20"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  authInfo.supabaseAvailable ? "bg-green-400" : "bg-amber-400"
                } animate-pulse`}
              ></div>
              <span>
                {authInfo.supabaseAvailable
                  ? "Online mode - Full admin features available"
                  : "Offline mode - Limited admin features"}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 text-red-400 text-center bg-red-500/10 border border-red-700/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Username or Email"
              disabled={loading}
              className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent disabled:opacity-50 transition-all"
              autoComplete="username"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent disabled:opacity-50 transition-all"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
