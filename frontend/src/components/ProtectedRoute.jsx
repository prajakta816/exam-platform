import { Navigate } from "react-router-dom";
import { getLocalUser } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const user = getLocalUser();

  if (!user) {
    // Clear potentially corrupted data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return children;
}