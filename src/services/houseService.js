import api from './api';

export const houseService = {
  getHouses: async () => {
    const response = await api.get('/houses');
    return response.data.houses;
  },

  createHouse: async (name) => {
    const response = await api.post('/houses', { name });
    return response.data.house;
  },

  getHouse: async (houseId) => {
    const response = await api.get(`/houses/${houseId}`);
    return response.data.house;
  },

  updateHouse: async (houseId, name) => {
    const response = await api.put(`/houses/${houseId}`, { name });
    return response.data.house;
  },

  deleteHouse: async (houseId) => {
    await api.delete(`/houses/${houseId}`);
  },

  inviteMember: async (houseId, email) => {
    const response = await api.post(`/houses/${houseId}/invite`, { email });
    return response.data;
  },

  joinByCode: async (code) => {
    const response = await api.post('/houses/join', { code });
    return response.data.house;
  },

  removeMember: async (houseId, userId) => {
    await api.delete(`/houses/${houseId}/members/${userId}`);
  },

  regenerateCode: async (houseId) => {
    const response = await api.post(`/houses/${houseId}/regenerate-code`);
    return response.data.invite_code;
  },

  getPendingInvitations: async () => {
    const response = await api.get('/houses/invitations/pending');
    return response.data.invitations;
  },

  acceptInvitation: async (invitationId) => {
    const response = await api.post(`/houses/invitations/${invitationId}/accept`);
    return response.data;
  },

  declineInvitation: async (invitationId) => {
    await api.post(`/houses/invitations/${invitationId}/decline`);
  },
};
