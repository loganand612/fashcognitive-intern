import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/", // Django backend URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Allows sending cookies if needed
});

export default api;
