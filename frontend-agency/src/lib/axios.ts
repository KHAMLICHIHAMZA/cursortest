import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const MODULE_403_MSG = "Ce module n'est pas activé pour votre compte.";

function isModule403(err: any): boolean {
  const msg = err?.response?.data?.message || err?.response?.data?.error || '';
  return /module|not included|non inclus/i.test(String(msg));
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.data?.message && Array.isArray(error.response.data.message)) {
      error.response.data.message = error.response.data.message.join(' • ');
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    if (error.response?.status === 403 && isModule403(error)) {
      window.alert(MODULE_403_MSG);
    }
    return Promise.reject(error);
  }
);

export default api;






