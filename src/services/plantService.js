import api from './api';

export const plantService = {
  getAllPlants: async (houseId) => {
    const params = houseId ? `?houseId=${houseId}` : '';
    const response = await api.get(`/plants${params}`);
    return response.data.plants;
  },

  getPlant: async (id) => {
    const response = await api.get(`/plants/${id}`);
    return response.data.plant;
  },

  createPlant: async (plantData) => {
    const response = await api.post('/plants', plantData);
    return response.data.plant;
  },

  updatePlant: async (id, plantData) => {
    const response = await api.put(`/plants/${id}`, plantData);
    return response.data.plant;
  },

  deletePlant: async (id) => {
    await api.delete(`/plants/${id}`);
  },

  markAsWatered: async (id) => {
    const response = await api.patch(`/plants/${id}/water`);
    return response.data.plant;
  },

  toggleFavorite: async (id) => {
    const response = await api.patch(`/plants/${id}/favorite`);
    return response.data.plant;
  },

  getAiCare: async (id) => {
    const response = await api.post(`/plants/${id}/ai-care`);
    return response.data.plant;
  },

  markAsRepotted: async (id) => {
    const response = await api.patch(`/plants/${id}/repot`);
    return response.data.plant;
  },

  markAsFertilized: async (id) => {
    const response = await api.patch(`/plants/${id}/fertilize`);
    return response.data.plant;
  },

  diagnosePlant: async (id, formData) => {
    const response = await api.post(`/plants/${id}/diagnose`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  identifyPlant: async (formData) => {
    const response = await api.post('/plants/identify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
