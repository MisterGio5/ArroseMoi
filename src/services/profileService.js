import api from './api';

export const profileService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  updateApiKeys: async (openaiApiKey, plantnetApiKey) => {
    const response = await api.put('/profile/api-keys', {
      openaiApiKey,
      plantnetApiKey,
    });
    return response.data;
  },

  deleteApiKeys: async (keyType) => {
    const response = await api.delete('/profile/api-keys', {
      data: { keyType },
    });
    return response.data;
  },
};
