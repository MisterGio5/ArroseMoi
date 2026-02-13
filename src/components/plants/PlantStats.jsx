import { usePlants } from '../../contexts/PlantContext';
import { isDue, nextWateringDate, formatDate } from '../../utils/dateUtils';

export const PlantStats = () => {
  const { plants } = usePlants();

  const duePlants = plants.filter((plant) => isDue(plant));
  const nextReminders = plants
    .map((plant) => ({
      ...plant,
      nextDate: nextWateringDate(plant),
    }))
    .sort((a, b) => a.nextDate - b.nextDate)
    .slice(0, 5);

  return (
    <div className="bg-card rounded-3xl p-5 md:p-6 shadow-custom border border-forest/8 space-y-4">
      <div>
        <span className="block text-3xl md:text-4xl font-bold text-forest">
          {plants.length}
        </span>
        <span className="block text-sm text-ink/65">Plantes suivies</span>
      </div>

      <div>
        <span className="block text-3xl md:text-4xl font-bold text-forest">
          {duePlants.length}
        </span>
        <span className="block text-sm text-ink/65">À arroser</span>
      </div>

      <div>
        <span className="block text-3xl md:text-4xl font-bold text-forest">
          {nextReminders.length > 0 ? formatDate(nextReminders[0].nextDate) : '-'}
        </span>
        <span className="block text-sm text-ink/65">Prochain rappel</span>
      </div>

      {/* Upcoming list */}
      <div>
        <span className="block text-sm text-ink/65 mb-2">Prochains arrosages</span>
        <ul className="space-y-1.5 text-sm text-ink/80">
          {nextReminders.length === 0 && <li>Aucune plante</li>}
          {nextReminders.map((plant) => (
            <li key={plant.id} className="flex justify-between gap-2">
              <span className="truncate">{plant.name}</span>
              <span className="whitespace-nowrap">{formatDate(plant.nextDate)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
