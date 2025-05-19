import axios, { AxiosRequestConfig } from 'axios';
import { fetchCSRFToken } from './csrf';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: include cookies with every request
});

// Add request interceptor to include CSRF token
api.interceptors.request.use(
  async (config) => {
    // Only add CSRF token for non-GET methods that might modify data
    if (config.method !== 'get') {
      try {
        const csrfToken = await fetchCSRFToken();
        config.headers['X-CSRFToken'] = csrfToken;
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 403 errors (could be due to CSRF or authentication issues)
    if (error.response && error.response.status === 403) {
      console.error('Authentication error:', error.response.data);
      
      // If we get a 403 on auth-status, we might need to redirect to login
      if (error.config.url.includes('auth-status')) {
        // Check if we're already on the login page to avoid redirect loops
        if (!window.location.pathname.includes('login')) {
          console.log('Redirecting to login due to authentication failure');
          // Use a timeout to avoid immediate redirect that might cause issues
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to make authenticated GET requests
export const fetchData = async (endpoint: string, config?: AxiosRequestConfig) => {
  try {
    const response = await api.get(endpoint, config);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
};

// Helper function to make authenticated POST requests
export const postData = async (endpoint: string, data: any, config?: AxiosRequestConfig) => {
  try {
    const response = await api.post(endpoint, data, config);
    return response.data;
  } catch (error) {
    console.error(`Error posting data to ${endpoint}:`, error);
    throw error;
  }
};

// Helper function to make authenticated PUT requests
export const putData = async (endpoint: string, data: any, config?: AxiosRequestConfig) => {
  try {
    const response = await api.put(endpoint, data, config);
    return response.data;
  } catch (error) {
    console.error(`Error updating data at ${endpoint}:`, error);
    throw error;
  }
};

// Helper function to make authenticated DELETE requests
export const deleteData = async (endpoint: string, config?: AxiosRequestConfig) => {
  try {
    const response = await api.delete(endpoint, config);
    return response.data;
  } catch (error) {
    console.error(`Error deleting data at ${endpoint}:`, error);
    throw error;
  }
};

export default api;
