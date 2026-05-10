import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.1.5:5000/api",
});

// attach token automatically
API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;