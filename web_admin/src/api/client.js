import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle genuine Token Expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isLoginPage = window.location.pathname === '/' || window.location.pathname.endsWith('/login');
      const errDetail = (error.response.data?.detail || '').toLowerCase();
      
      // Hanya logout jika token autentikasi sesi benar-benar expired/invalid
      const isAuthError = errDetail.includes('token') || errDetail.includes('not authenticated') || errDetail.includes('expired') || error.config?.url?.includes('/api/auth/me');
      
      if (!isLoginPage && isAuthError) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
