import api from './api';
import { storage } from '../lib/native/storage';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    await storage.setItem('token', token);
    await storage.setItem('user', JSON.stringify(user));
    // Met à jour le token en mémoire pour l'interceptor axios (synchrone)
    api._memoryToken = token;
    return { token, user };
  },

  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    const { token, user } = response.data;
    await storage.setItem('token', token);
    await storage.setItem('user', JSON.stringify(user));
    api._memoryToken = token;
    return { token, user };
  },

  logout: async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    api._memoryToken = null;
  },

  getCurrentUser: async () => {
    const userStr = await storage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: async () => {
    return await storage.getItem('token');
  },

  // Charge le token en mémoire au démarrage (appelé une fois dans AuthContext)
  initToken: async () => {
    const token = await storage.getItem('token');
    api._memoryToken = token;
    return token;
  },
};
