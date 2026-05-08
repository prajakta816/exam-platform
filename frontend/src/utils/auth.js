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
  const token = sessionStorage.getItem("token");
  if (!token) return null;
  
  const decoded = decodeToken(token);
  if (!decoded) return null;

  // Check if token is expired
  const currentTime = Date.now() / 1000;
  if (decoded.exp < currentTime) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    return null;
  }

  const userJson = sessionStorage.getItem("user");
  const parsedUser = userJson ? JSON.parse(userJson) : null;

  return {
    id: decoded.id,
    role: decoded.role,
    name: parsedUser ? parsedUser.name : (decoded.name || "User")
  };
};
