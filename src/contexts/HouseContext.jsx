import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { houseService } from '../services/houseService';
import { useAuth } from './AuthContext';

const HouseContext = createContext(null);

export const useHouses = () => {
  const context = useContext(HouseContext);
  if (!context) {
    throw new Error('useHouses must be used within a HouseProvider');
  }
  return context;
};

export const HouseProvider = ({ children }) => {
  const [houses, setHouses] = useState([]);
  const [currentHouseId, setCurrentHouseId] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const loadHouses = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await houseService.getHouses();
      setHouses(data);

      // Restore saved house selection
      const saved = localStorage.getItem('currentHouseId');
      if (saved && data.find((h) => h.id === Number(saved))) {
        setCurrentHouseId(Number(saved));
      }
    } catch (err) {
      console.error('Error loading houses:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadPendingInvitations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await houseService.getPendingInvitations();
      setPendingInvitations(data);
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadHouses();
    loadPendingInvitations();
  }, [loadHouses, loadPendingInvitations]);

  const switchHouse = (houseId) => {
    setCurrentHouseId(houseId);
    if (houseId) {
      localStorage.setItem('currentHouseId', String(houseId));
    } else {
      localStorage.removeItem('currentHouseId');
    }
  };

  const createHouse = async (name) => {
    const house = await houseService.createHouse(name);
    setHouses((prev) => [...prev, house]);
    return house;
  };

  const joinByCode = async (code) => {
    const house = await houseService.joinByCode(code);
    await loadHouses();
    return house;
  };

  const acceptInvitation = async (id) => {
    await houseService.acceptInvitation(id);
    await loadHouses();
    await loadPendingInvitations();
  };

  const declineInvitation = async (id) => {
    await houseService.declineInvitation(id);
    setPendingInvitations((prev) => prev.filter((inv) => inv.id !== id));
  };

  const value = {
    houses,
    currentHouseId,
    pendingInvitations,
    loading,
    switchHouse,
    createHouse,
    joinByCode,
    loadHouses,
    acceptInvitation,
    declineInvitation,
    loadPendingInvitations,
  };

  return <HouseContext.Provider value={value}>{children}</HouseContext.Provider>;
};
