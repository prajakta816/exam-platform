// Manual JWT Decoding Helper
export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Token decoding failed:", error);
    return null;
  }
};

export const getLocalUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  const decoded = decodeToken(token);
  if (!decoded) return null;

  // Check if token is expired
  const currentTime = Date.now() / 1000;
  if (decoded.exp < currentTime) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }

  return {
    id: decoded.id,
    role: decoded.role,
    name: decoded.name || localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).name : "User"
  };
};
