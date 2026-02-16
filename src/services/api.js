import axios from 'axios';
import { storage } from '../lib/native/storage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token en mémoire pour l'interceptor synchrone
// Mis à jour par authService.login/register/logout/initToken
api._memoryToken = null;

// Ajoute le token aux requêtes (lecture synchrone depuis la mémoire)
api.interceptors.request.use(
  (config) => {
    if (api._memoryToken) {
      config.headers.Authorization = `Bearer ${api._memoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Gère les erreurs 401 (token expiré) — deduplicate redirects
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      api._memoryToken = null;
      await storage.removeItem('token');
      await storage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
