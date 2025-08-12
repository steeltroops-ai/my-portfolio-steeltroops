import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, adminLogin } from '../services/SupabaseAuthService';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Try new authentication first
      const result = await adminLogin(email, password);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        // Fallback to legacy authentication for backward compatibility
        const legacySuccess = await login(email, password);
        if (legacySuccess) {
          navigate('/admin/dashboard');
        } else {
          setError(result.error || 'Invalid email or password');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
      <div className="relative p-8 w-96 rounded-xl border backdrop-blur-sm border-neutral-800 bg-neutral-900/30">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h2>
        {error && (
          <div className="mb-4 p-2 text-red-500 text-center bg-red-500/10 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              disabled={loading}
              className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
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
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;