import axios from "axios";

const api = axios.create({
  baseURL: "/api/", // Use relative URL instead of hardcoded localhost
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Allows sending cookies if needed
});

export default api;
