import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { plantService } from '../services/plantService';
import { useAuth } from './AuthContext';
import { useHouses } from './HouseContext';

const PlantContext = createContext(null);

export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlants must be used within a PlantProvider');
  }
  return context;
};

export const PlantProvider = ({ children }) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const { currentHouseId } = useHouses();

  const loadPlants = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      const data = await plantService.getAllPlants(currentHouseId);
      setPlants(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading plants:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentHouseId]);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  const addPlant = async (plantData) => {
    try {
      const newPlant = await plantService.createPlant(plantData);
      setPlants((prev) => [newPlant, ...prev]);
      return newPlant;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updatePlant = async (id, plantData) => {
    try {
      const updatedPlant = await plantService.updatePlant(id, plantData);
      setPlants((prev) =>
        prev.map((plant) => (plant.id === id ? updatedPlant : plant))
      );
      return updatedPlant;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deletePlant = async (id) => {
    try {
      await plantService.deletePlant(id);
      setPlants((prev) => prev.filter((plant) => plant.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const markAsWatered = async (id) => {
    try {
      const updatedPlant = await plantService.markAsWatered(id);
      setPlants((prev) =>
        prev.map((plant) => (plant.id === id ? updatedPlant : plant))
      );
      return updatedPlant;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const updatedPlant = await plantService.toggleFavorite(id);
      setPlants((prev) =>
        prev.map((plant) => (plant.id === id ? updatedPlant : plant))
      );
      return updatedPlant;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const duplicatePlant = async (plant) => {
    const clonedPlant = {
      ...plant,
      name: `${plant.name} (copie)`,
      id: undefined,
    };
    return addPlant(clonedPlant);
  };

  const getAiCare = async (id) => {
    try {
      const updatedPlant = await plantService.getAiCare(id);
      setPlants((prev) =>
        prev.map((plant) => (plant.id === id ? updatedPlant : plant))
      );
      return updatedPlant;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const markAsRepotted = async (id) => {
    try {
      const updatedPlant = await plantService.markAsRepotted(id);
      setPlants((prev) =>
        prev.map((plant) => (plant.id === id ? updatedPlant : plant))
      );
      return updatedPlant;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const markAsFertilized = async (id) => {
    try {
      const updatedPlant = await plantService.markAsFertilized(id);
      setPlants((prev) =>
        prev.map((plant) => (plant.id === id ? updatedPlant : plant))
      );
      return updatedPlant;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const diagnosePlant = async (id, formData) => {
    try {
      const result = await plantService.diagnosePlant(id, formData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const identifyPlant = async (formData) => {
    try {
      const result = await plantService.identifyPlant(formData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    plants,
    loading,
    error,
    loadPlants,
    addPlant,
    updatePlant,
    deletePlant,
    markAsWatered,
    markAsRepotted,
    markAsFertilized,
    toggleFavorite,
    duplicatePlant,
    identifyPlant,
    getAiCare,
    diagnosePlant,
  };

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
};
