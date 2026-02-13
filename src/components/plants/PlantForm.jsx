import { useState, useEffect } from 'react';
import { usePlants } from '../../contexts/PlantContext';
import { Button } from '../common/Button';
import { Input, Select, Textarea } from '../common/Input';
import { PLANT_TYPES, SUN_EXPOSURE, ROOM_LABELS } from '../../utils/constants';

export const PlantForm = ({ plant, onCancel }) => {
  const { addPlant, updatePlant, identifyPlant } = usePlants();
  const [loading, setLoading] = useState(false);
  const [identifyStatus, setIdentifyStatus] = useState('');
  const [aiTips, setAiTips] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    sun: '',
    room: '',
    frequency: 7,
    lastWatered: new Date().toISOString().split('T')[0],
    notes: '',
    photo: null,
  });

  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    if (plant) {
      setFormData({
        name: plant.name || '',
        type: plant.type || '',
        sun: plant.sun || '',
        room: plant.room || '',
        frequency: plant.frequency || 7,
        lastWatered: plant.lastWatered
          ? new Date(plant.lastWatered).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        notes: plant.notes || '',
        photo: plant.photo || null,
      });
    }
  }, [plant]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files?.[0]) {
      setPhotoFile(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleIdentify = async () => {
    if (!photoFile) {
      alert('Choisis d\'abord une photo.');
      return;
    }

    setIdentifyStatus('Analyse en cours...');
    setAiTips(null);

    const formDataObj = new FormData();
    formDataObj.append('images[]', photoFile);

    try {
      const result = await identifyPlant(formDataObj);

      if (result.warning) {
        setIdentifyStatus(result.warning);
        return;
      }

      if (result.prefill) {
        setFormData((prev) => ({
          ...prev,
          name: result.prefill.name || prev.name,
          type: result.prefill.type || prev.type,
          sun: result.prefill.sun || prev.sun,
          room: result.prefill.room || prev.room,
          frequency: result.prefill.frequency || prev.frequency,
          notes: result.prefill.notes || prev.notes,
        }));

        if (result.prefill.care_tips) {
          setAiTips(result.prefill.care_tips);
        }
      }

      const confidence = Number(result.confidence || 0);
      setIdentifyStatus(
        confidence >= 0.5
          ? `Plante reconnue (${Math.round(confidence * 100)}%).`
          : 'Reconnaissance incertaine, vérifie les infos.'
      );
    } catch (error) {
      alert(error.message);
      setIdentifyStatus('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoData = formData.photo;

      // Convert photo file to base64 if new file selected
      if (photoFile) {
        photoData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(photoFile);
        });
      }

      const plantData = {
        ...formData,
        photo: photoData,
        indoor: formData.type === 'interieur',
      };

      if (plant) {
        await updatePlant(plant.id, plantData);
      } else {
        await addPlant(plantData);
      }

      // Reset form
      setFormData({
        name: '',
        type: '',
        sun: '',
        room: '',
        frequency: 7,
        lastWatered: new Date().toISOString().split('T')[0],
        notes: '',
        photo: null,
      });
      setPhotoFile(null);
      setIdentifyStatus('');
      setAiTips(null);

      if (onCancel) onCancel();
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Input
        label="Nom de la plante"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Ex : Monstera deliciosa"
        required
      />

      <Select
        label="Type de plante"
        name="type"
        value={formData.type}
        onChange={handleChange}
        options={[
          { value: '', label: 'Choisir un type' },
          ...Object.entries(PLANT_TYPES).map(([value, label]) => ({ value, label })),
        ]}
        required
      />

      <Select
        label="Exposition au soleil"
        name="sun"
        value={formData.sun}
        onChange={handleChange}
        options={[
          { value: '', label: 'Choisir une exposition' },
          ...Object.entries(SUN_EXPOSURE).map(([value, label]) => ({ value, label })),
        ]}
        required
      />

      <Select
        label="Pièce / emplacement"
        name="room"
        value={formData.room}
        onChange={handleChange}
        options={[
          { value: '', label: 'Choisir un emplacement' },
          ...Object.entries(ROOM_LABELS).map(([value, label]) => ({ value, label })),
        ]}
        required
      />

      <Input
        label="Fréquence d'arrosage (jours)"
        name="frequency"
        type="number"
        min="1"
        max="60"
        value={formData.frequency}
        onChange={handleChange}
        required
      />

      <Input
        label="Date du dernier arrosage"
        name="lastWatered"
        type="date"
        value={formData.lastWatered}
        onChange={handleChange}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="font-medium text-ink">Photo</label>
        <input
          type="file"
          name="photo"
          accept="image/*"
          onChange={handleChange}
          className="px-2 py-2 rounded-xl border border-forest/20 bg-white text-sm"
        />
      </div>

      <div className="flex items-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={handleIdentify}>
          Identifier par photo
        </Button>
        {identifyStatus && (
          <span className="text-sm text-ink/70">{identifyStatus}</span>
        )}
      </div>

      {aiTips && aiTips.length > 0 && (
        <div className="col-span-full bg-white/70 border border-dashed border-forest/25 rounded-2xl p-3.5 text-sm text-ink/80">
          <strong>Conseils IA</strong>
          <ul className="mt-2 pl-4 space-y-1 list-disc">
            {aiTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      <Textarea
        label="Notes"
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        placeholder="Conseils, taille, engrais..."
        rows={3}
        className="md:col-span-2 lg:col-span-3"
      />

      <div className="flex gap-3 md:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'En cours...' : plant ? 'Mettre à jour' : 'Enregistrer la plante'}
        </Button>
        {plant && onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
};
