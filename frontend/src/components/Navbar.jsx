import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <Link to="/board">Dashboard</Link>
      <button onClick={logout}>Logout</button>
    </div>
  );
}