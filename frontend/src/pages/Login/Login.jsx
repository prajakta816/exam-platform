import './Login.css';
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import API from "../../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      sessionStorage.setItem("token", token);
      // Fetch user data after google login
      API.get("/user/profile/me", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        sessionStorage.setItem("user", JSON.stringify(res.data));
        navigate("/board");
      }).catch(() => {
        setError("Social login failed. Please try again.");
      });
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    try {
      const res = await API.post("/auth/login", { email, password });
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/board");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Invalid credentials or login failed.";
      setError(errorMsg);
      if (errorMsg.includes("verify your email")) {
        // We can prompt them to click the resend button.
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) return setError("Please enter your email address first");
    setResendLoading(true);
    setResendMessage("");
    try {
      const res = await API.post("/auth/resend-otp", { email });
      setResendMessage(res.data.message);
      setIsVerifying(true);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend verification OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    try {
      const res = await API.post("/auth/verify-otp", { email, otp });
      setResendMessage("Account verified successfully! Logging you in...");
      setTimeout(() => {
        sessionStorage.setItem("token", res.data.token);
        sessionStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/board");
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Welcome Back</h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center mb-4 border border-red-100">
            {error}
            {error.includes("verify your email") && (
              <button 
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="block mx-auto mt-2 text-indigo-600 hover:text-indigo-800 font-bold underline disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </button>
            )}
          </div>
        )}

        {resendMessage && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center mb-4 border border-green-100">
            {resendMessage}
          </div>
        )}

        {isVerifying ? (
          <div className="py-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Verify Your Email</h3>
            <p className="text-gray-600 mb-6 text-center text-sm">
              We've sent a 6-digit OTP to <strong>{email}</strong>. Please enter it below.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Verify OTP & Login
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold transition bg-transparent border-none cursor-pointer disabled:opacity-50"
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </button>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50"
                  placeholder="you@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Sign In
            </button>
          </form>
        )}

        <div className="mt-4 flex items-center justify-between">
          <Link to="/forgot-password" size="sm" className="text-sm text-indigo-600 hover:text-indigo-800 transition">
            Forgot password?
          </Link>
        </div>

        <div className="mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg shadow-sm transition transform hover:-translate-y-0.5"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-semibold transition">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
