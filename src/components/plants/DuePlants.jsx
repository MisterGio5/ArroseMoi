import { usePlants } from '../../contexts/PlantContext';
import { Button } from '../common/Button';
import { isDue, formatDate } from '../../utils/dateUtils';
import { PLANT_TYPES } from '../../utils/constants';

export const DuePlants = () => {
  const { plants, markAsWatered } = usePlants();
  const duePlants = plants.filter((plant) => isDue(plant));

  const handleWater = async (plantId) => {
    try {
      await markAsWatered(plantId);
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleWaterAll = async () => {
    try {
      await Promise.all(duePlants.map((plant) => markAsWatered(plant.id)));
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
  };

  if (duePlants.length === 0) {
    return (
      <p className="text-ink/70 text-center py-4">
        Aucune plante n'est à arroser aujourd'hui.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleWaterAll}>
          Tout marquer arrosé
        </Button>
      </div>

      {duePlants.map((plant) => (
        <div
          key={plant.id}
          className="p-4 bg-card rounded-2xl border border-forest/12 flex items-center justify-between gap-4"
        >
          <div>
            <strong className="text-ink block">{plant.name}</strong>
            <span className="text-sm text-ink/70">
              {PLANT_TYPES[plant.type] || plant.type} • Dernier arrosage :{' '}
              {formatDate(plant.lastWatered || plant.last_watered)}
            </span>
          </div>
          <Button size="sm" onClick={() => handleWater(plant.id)}>
            Arrosée
          </Button>
        </div>
      ))}
    </div>
  );
};
