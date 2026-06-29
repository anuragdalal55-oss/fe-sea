import axios from 'axios';

const BASE_URL = 'https://sea-be.onrender.com/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const SEA_TOKEN_KEY = 'sea_ediss_token';
const SEA_USER_KEY = 'sea_ediss_user';

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(SEA_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(SEA_TOKEN_KEY);
      localStorage.removeItem(SEA_USER_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
