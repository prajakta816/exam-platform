import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, ArrowLeft, RefreshCw } from "lucide-react";
import API from "../../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    setError("");
    try {
      const res = await API.post(`/auth/reset-password/${token}`, { password });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Reset Password</h2>
        <p className="text-gray-600 text-center mb-6">Enter your new password below.</p>
        
        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center mb-4 border border-green-100">
            {message}. Redirecting to login...
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" /> Reset Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
