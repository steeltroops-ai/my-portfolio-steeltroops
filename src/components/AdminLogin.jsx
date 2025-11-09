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

    try {
      console.log("=== LOGIN ATTEMPT ===");
      console.log("Username/Email:", identifier);
      console.log("Password length:", password.length);

      // Use hybrid authentication service
      const result = await signInWithCredentials(identifier, password);

      console.log("Login result:", JSON.stringify(result, null, 2));

      if (result && result.data && !result.error) {
        // Success
        console.log("✓ Login successful!");
        console.log("✓ Redirecting to dashboard");
        navigate("/admin/dashboard");
      } else {
        // Handle different error types
        console.error("✗ Login failed:", result.error);
        if (result.error?.type === "config_error") {
          setError("Supabase is not configured. Please check your environment variables.");
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
      <div className="relative p-8 w-96 rounded-xl border border-white/10 backdrop-blur-[2px] bg-white/5">
        <h2 className="text-2xl font-bold text-white mb-3 text-center">
          Admin Login
        </h2>

        {authInfo && (
          <div className="flex justify-center mb-6">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-md text-[10px] font-medium ${authInfo.supabaseAvailable
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${authInfo.supabaseAvailable
                  ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                  : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                  }`}
              ></div>
              <span>{authInfo.supabaseAvailable ? "Online" : "Offline"}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/30 backdrop-blur-md bg-red-500/10 text-[11px] font-medium text-red-400">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-white/70 mb-2">
              Email
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              className="w-full p-3 rounded-lg border border-white/10 backdrop-blur-md bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 disabled:opacity-50 transition-all"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              className="w-full p-3 rounded-lg border border-white/10 backdrop-blur-md bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 disabled:opacity-50 transition-all"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg border border-purple-400/30 backdrop-blur-[2px] bg-purple-500/20 hover:bg-purple-500/30 hover:border-purple-400/50 disabled:bg-white/5 disabled:border-white/10 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center justify-center shadow-lg shadow-purple-500/10"
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
