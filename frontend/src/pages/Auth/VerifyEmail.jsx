import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../../services/api";
import { Check, X, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await API.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(res.data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 text-center">
        {status === "verifying" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Verifying your email...</h2>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <Check className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Verified!</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <Link
              to="/login"
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <X className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Verification Failed</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <Link
              to="/register"
              className="mt-6 text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Try registering again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
