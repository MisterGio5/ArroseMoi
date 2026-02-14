import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlants } from '../../contexts/PlantContext';
import { Button } from '../common/Button';
import { isDue, describePlant } from '../../utils/dateUtils';
import { PLANT_TYPES, SUN_EXPOSURE, ROOM_LABELS } from '../../utils/constants';

export const PlantCard = ({ plant, onEdit }) => {
  const navigate = useNavigate();
  const { markAsWatered, toggleFavorite, deletePlant, duplicatePlant } = usePlants();
  const [loading, setLoading] = useState(false);

  const handleCardClick = () => {
    navigate(`/plant/${plant.id}`);
  };

  const stopProp = (handler) => (e) => {
    e.stopPropagation();
    handler();
  };

  const handleWater = async () => {
    setLoading(true);
    try {
      await markAsWatered(plant.id);
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      await toggleFavorite(plant.id);
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Supprimer "${plant.name}" ?`)) {
      try {
        await deletePlant(plant.id);
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicatePlant(plant);
    } catch (error) {
      alert('Erreur lors de la duplication');
    }
  };

  const plantIsDue = isDue(plant);

  return (
    <article
      onClick={handleCardClick}
      className="bg-card rounded-2xl overflow-hidden border border-forest/12 shadow-card animate-rise hover:shadow-xl transition-shadow cursor-pointer"
    >
      {/* Image */}
      <div
        className="min-h-[120px] bg-gradient-to-br from-leaf to-sun flex items-center justify-center text-forest/70 font-semibold text-sm border-b border-forest/8"
        style={
          plant.photo
            ? {
                backgroundImage: `url(${plant.photo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}
        }
      >
        {!plant.photo && 'Photo'}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-lg text-ink">{plant.name}</h3>
          <span className="px-2.5 py-1 bg-leaf/40 text-forest text-xs rounded-full whitespace-nowrap">
            {plant.favorite && '\u2605 '}
            {PLANT_TYPES[plant.type] || plant.type}
          </span>
        </div>

        <p className="text-sm text-ink/70">
          {SUN_EXPOSURE[plant.sun] || plant.sun} &bull; {ROOM_LABELS[plant.room] || plant.room}
        </p>

        <p className="text-sm text-ink/80">
          {describePlant(plant)} &bull; {plant.frequency}j
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {plantIsDue && (
            <Button size="sm" onClick={stopProp(handleWater)} disabled={loading}>
              {loading ? 'En cours...' : 'Arrosée'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={stopProp(handleFavorite)}
            className={plant.favorite ? 'bg-sun/20 border-sun' : ''}
          >
            {plant.favorite ? '\u2605 Favori' : '\u2606 Favori'}
          </Button>
          <Button variant="ghost" size="sm" onClick={stopProp(handleDuplicate)}>
            Dupliquer
          </Button>
          <Button variant="ghost" size="sm" onClick={stopProp(() => onEdit(plant))}>
            Modifier
          </Button>
          <Button variant="ghost" size="sm" onClick={stopProp(handleDelete)}>
            Supprimer
          </Button>
        </div>
      </div>
    </article>
  );
};
