import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlants } from '../contexts/PlantContext';
import { useHouses } from '../contexts/HouseContext';
import { Header } from '../components/layout/Header';
import { Panel, PanelHeader } from '../components/layout/Panel';
import { Button } from '../components/common/Button';
import { PLANT_TYPES, SUN_EXPOSURE, ROOM_LABELS } from '../utils/constants';
import { formatDate, describePlant, isDue } from '../utils/dateUtils';

const DIFFICULTY_LABELS = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
const HUMIDITY_LABELS = { faible: 'Faible', moyenne: 'Moyenne', 'élevée': 'Haute' };

const fieldClass =
  'w-full bg-white/60 border border-forest/20 rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf';
const selectClass = fieldClass + ' appearance-none';

const InfoItem = ({ label, value, icon, editing, editNode }) => (
  <div className="flex items-start gap-3 py-2.5">
    {icon && <span className="text-lg mt-0.5">{icon}</span>}
    <div className="min-w-0 flex-1">
      <p className="text-xs text-ink/50 uppercase tracking-wide">{label}</p>
      {editing ? (
        <div className="mt-1">{editNode}</div>
      ) : (
        <p className="text-sm font-medium text-ink mt-0.5">{value || '—'}</p>
      )}
    </div>
  </div>
);

const buildEditData = (plant) => ({
  name: plant.name || '',
  type: plant.type || '',
  sun: plant.sun || '',
  room: plant.room || '',
  frequency: plant.frequency || 7,
  notes: plant.notes || '',
  difficulty: plant.difficulty || '',
  humidity: plant.humidity || '',
  idealTemp: plant.idealTemp || '',
  indoor: plant.indoor ?? true,
  toxic: plant.toxic ?? false,
  repottingFrequency: plant.repottingFrequency || '',
  fertilizerFrequency: plant.fertilizerFrequency || '',
  lastRepotted: plant.lastRepotted || '',
  lastFertilized: plant.lastFertilized || '',
  acquiredDate: plant.acquiredDate || '',
  houseId: plant.houseId || '',
});

export const PlantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants, markAsWatered, getAiCare, updatePlant, diagnosePlant } = usePlants();
  const { houses } = useHouses();
  const [plant, setPlant] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [waterLoading, setWaterLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [diagnosisPhotos, setDiagnosisPhotos] = useState([]);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);

  useEffect(() => {
    const found = plants.find((p) => p.id === Number(id));
    if (found) {
      setPlant(found);
    } else if (plants.length > 0) {
      navigate('/dashboard');
    }
  }, [id, plants, navigate]);

  if (!plant) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <p className="text-ink/50">Chargement...</p>
      </div>
    );
  }

  const handleWater = async () => {
    setWaterLoading(true);
    try {
      await markAsWatered(plant.id);
    } catch {
      alert('Erreur lors de la mise à jour');
    } finally {
      setWaterLoading(false);
    }
  };

  const handleAiCare = async () => {
    setAiLoading(true);
    try {
      await getAiCare(plant.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la génération IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleStartEdit = () => {
    setEditData(buildEditData(plant));
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditData({});
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDiagnose = async () => {
    if (diagnosisPhotos.length === 0) {
      alert('Ajoute au moins une photo pour le diagnostic.');
      return;
    }
    setDiagnosing(true);
    setDiagnosis(null);
    try {
      const formData = new FormData();
      for (const file of diagnosisPhotos) {
        formData.append('images[]', file);
      }
      const result = await diagnosePlant(plant.id, formData);
      setDiagnosis(result.diagnosis);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du diagnostic');
    } finally {
      setDiagnosing(false);
    }
  };

  const handleChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let photoData = plant.photo;
      if (photoFile) {
        photoData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(photoFile);
        });
      }

      const payload = {
        ...editData,
        photo: photoData,
        frequency: Number(editData.frequency) || plant.frequency,
        repottingFrequency: editData.repottingFrequency ? Number(editData.repottingFrequency) : null,
        fertilizerFrequency: editData.fertilizerFrequency ? Number(editData.fertilizerFrequency) : null,
      };
      await updatePlant(plant.id, payload);
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const plantIsDue = isDue(plant);

  // Date helper: format a date string for input[type="date"]
  const toInputDate = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Header />

        {/* Back + Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            Retour
          </Button>
          {!editing && plantIsDue && (
            <Button size="sm" onClick={handleWater} disabled={waterLoading}>
              {waterLoading ? 'En cours...' : 'Marquer arrosée'}
            </Button>
          )}
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={saving}>
                Annuler
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleStartEdit}>
              Modifier
            </Button>
          )}
        </div>

        {/* Hero */}
        <Panel className="mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="relative w-full md:w-64 h-48 md:h-64 shrink-0">
              <div
                className="w-full h-full rounded-2xl bg-gradient-to-br from-leaf to-sun flex items-center justify-center text-forest/50 font-semibold"
                style={
                  (photoPreview || plant.photo)
                    ? {
                        backgroundImage: `url(${photoPreview || plant.photo})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {}
                }
              >
                {!photoPreview && !plant.photo && 'Pas de photo'}
              </div>
              {editing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl cursor-pointer hover:bg-black/40 transition-colors">
                  <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
                    {plant.photo || photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-ink/50 uppercase tracking-wide">Nom</label>
                    <input
                      type="text"
                      className={fieldClass}
                      value={editData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-xs text-ink/50 uppercase tracking-wide">Type</label>
                      <select
                        className={selectClass}
                        value={editData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                      >
                        <option value="">—</option>
                        {Object.entries(PLANT_TYPES).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-xs text-ink/50 uppercase tracking-wide">Difficulté</label>
                      <select
                        className={selectClass}
                        value={editData.difficulty}
                        onChange={(e) => handleChange('difficulty', e.target.value)}
                      >
                        <option value="">—</option>
                        {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.toxic}
                        onChange={(e) => handleChange('toxic', e.target.checked)}
                        className="accent-leaf w-4 h-4"
                      />
                      Toxique pour les animaux
                    </label>
                  </div>
                  <div>
                    <label className="text-xs text-ink/50 uppercase tracking-wide">Notes</label>
                    <textarea
                      className={fieldClass + ' resize-none'}
                      rows={2}
                      value={editData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-ink">{plant.name}</h1>
                    {plant.favorite && <span className="text-2xl">&#9733;</span>}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-leaf/30 text-forest text-sm rounded-full">
                      {PLANT_TYPES[plant.type] || plant.type}
                    </span>
                    {plant.difficulty && (
                      <span className="px-3 py-1 bg-sun/30 text-forest text-sm rounded-full">
                        {DIFFICULTY_LABELS[plant.difficulty] || plant.difficulty}
                      </span>
                    )}
                    {plant.toxic && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        Toxique animaux
                      </span>
                    )}
                  </div>

                  <p className={`text-lg font-medium mb-2 ${plantIsDue ? 'text-red-600' : 'text-moss'}`}>
                    {describePlant(plant)}
                  </p>

                  {plant.notes && (
                    <p className="text-sm text-ink/70 mt-3">{plant.notes}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Arrosage */}
          <Panel>
            <PanelHeader title="Arrosage" />
            <div className="divide-y divide-forest/8">
              <InfoItem
                icon="&#128167;"
                label="Fréquence"
                value={`Tous les ${plant.frequency} jours`}
                editing={editing}
                editNode={
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink/60">Tous les</span>
                    <input
                      type="number"
                      min="1"
                      className={fieldClass + ' w-20'}
                      value={editData.frequency}
                      onChange={(e) => handleChange('frequency', e.target.value)}
                    />
                    <span className="text-sm text-ink/60">jours</span>
                  </div>
                }
              />
              <InfoItem icon="&#128197;" label="Dernier arrosage" value={formatDate(plant.lastWatered)} />
              <InfoItem icon="&#9203;" label="Statut" value={describePlant(plant)} />
            </div>
          </Panel>

          {/* Environnement */}
          <Panel>
            <PanelHeader title="Environnement" />
            <div className="divide-y divide-forest/8">
              <InfoItem
                icon="&#9728;&#65039;"
                label="Exposition"
                value={SUN_EXPOSURE[plant.sun] || plant.sun}
                editing={editing}
                editNode={
                  <select
                    className={selectClass}
                    value={editData.sun}
                    onChange={(e) => handleChange('sun', e.target.value)}
                  >
                    <option value="">—</option>
                    {Object.entries(SUN_EXPOSURE).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                }
              />
              <InfoItem
                icon="&#127968;"
                label="Emplacement"
                value={ROOM_LABELS[plant.room] || plant.room}
                editing={editing}
                editNode={
                  <select
                    className={selectClass}
                    value={editData.room}
                    onChange={(e) => handleChange('room', e.target.value)}
                  >
                    <option value="">—</option>
                    {Object.entries(ROOM_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                }
              />
              <InfoItem
                icon="&#127777;&#65039;"
                label="Température idéale"
                value={plant.idealTemp}
                editing={editing}
                editNode={
                  <input
                    type="text"
                    className={fieldClass}
                    value={editData.idealTemp}
                    onChange={(e) => handleChange('idealTemp', e.target.value)}
                    placeholder="ex: 18-24°C"
                  />
                }
              />
              <InfoItem
                icon="&#128167;"
                label="Humidité"
                value={HUMIDITY_LABELS[plant.humidity] || plant.humidity}
                editing={editing}
                editNode={
                  <select
                    className={selectClass}
                    value={editData.humidity}
                    onChange={(e) => handleChange('humidity', e.target.value)}
                  >
                    <option value="">—</option>
                    {Object.entries(HUMIDITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                }
              />
            </div>
          </Panel>

          {/* Entretien */}
          <Panel>
            <PanelHeader title="Entretien" />
            <div className="divide-y divide-forest/8">
              <InfoItem
                icon="&#127793;"
                label="Rempotage"
                value={plant.repottingFrequency ? `Tous les ${plant.repottingFrequency} mois` : null}
                editing={editing}
                editNode={
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink/60">Tous les</span>
                    <input
                      type="number"
                      min="1"
                      className={fieldClass + ' w-20'}
                      value={editData.repottingFrequency}
                      onChange={(e) => handleChange('repottingFrequency', e.target.value)}
                    />
                    <span className="text-sm text-ink/60">mois</span>
                  </div>
                }
              />
              <InfoItem
                icon="&#128197;"
                label="Dernier rempotage"
                value={formatDate(plant.lastRepotted)}
                editing={editing}
                editNode={
                  <input
                    type="date"
                    className={fieldClass}
                    value={toInputDate(editData.lastRepotted)}
                    onChange={(e) => handleChange('lastRepotted', e.target.value)}
                  />
                }
              />
              <InfoItem
                icon="&#129716;"
                label="Engrais"
                value={plant.fertilizerFrequency ? `Toutes les ${plant.fertilizerFrequency} semaines` : null}
                editing={editing}
                editNode={
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink/60">Toutes les</span>
                    <input
                      type="number"
                      min="1"
                      className={fieldClass + ' w-20'}
                      value={editData.fertilizerFrequency}
                      onChange={(e) => handleChange('fertilizerFrequency', e.target.value)}
                    />
                    <span className="text-sm text-ink/60">semaines</span>
                  </div>
                }
              />
              <InfoItem
                icon="&#128197;"
                label="Dernier engrais"
                value={formatDate(plant.lastFertilized)}
                editing={editing}
                editNode={
                  <input
                    type="date"
                    className={fieldClass}
                    value={toInputDate(editData.lastFertilized)}
                    onChange={(e) => handleChange('lastFertilized', e.target.value)}
                  />
                }
              />
            </div>
          </Panel>

          {/* Infos */}
          <Panel>
            <PanelHeader title="Informations" />
            <div className="divide-y divide-forest/8">
              <InfoItem
                icon="&#128198;"
                label="Date d'acquisition"
                value={formatDate(plant.acquiredDate)}
                editing={editing}
                editNode={
                  <input
                    type="date"
                    className={fieldClass}
                    value={toInputDate(editData.acquiredDate)}
                    onChange={(e) => handleChange('acquiredDate', e.target.value)}
                  />
                }
              />
              <InfoItem icon="&#128197;" label="Ajoutée le" value={formatDate(plant.created_at)} />
              <InfoItem
                icon="&#127968;"
                label="Maison"
                value={houses.find((h) => h.id === plant.houseId)?.name || '—'}
                editing={editing}
                editNode={
                  <select
                    className={selectClass}
                    value={editData.houseId}
                    onChange={(e) => handleChange('houseId', Number(e.target.value))}
                  >
                    {houses.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                }
              />
              <InfoItem
                icon="&#127793;"
                label="Type"
                value={plant.indoor ? 'Intérieur' : 'Extérieur'}
                editing={editing}
                editNode={
                  <select
                    className={selectClass}
                    value={editData.indoor ? 'true' : 'false'}
                    onChange={(e) => handleChange('indoor', e.target.value === 'true')}
                  >
                    <option value="true">Intérieur</option>
                    <option value="false">Extérieur</option>
                  </select>
                }
              />
            </div>
          </Panel>
        </div>

        {/* Conseils IA */}
        <Panel className="mb-6">
          <PanelHeader
            title="Conseils d'entretien"
            actions={
              <Button
                size="sm"
                onClick={handleAiCare}
                disabled={aiLoading}
              >
                {aiLoading ? 'Analyse IA en cours...' : plant.careTips?.length > 0 ? 'Regénérer avec l\'IA' : 'Remplir avec l\'IA'}
              </Button>
            }
          />

          {plant.careTips && plant.careTips.length > 0 ? (
            <ul className="space-y-3">
              {plant.careTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-ink/80">
                  <span className="w-6 h-6 rounded-full bg-leaf/20 text-forest flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/50 py-4 text-center">
              Aucun conseil pour le moment. Clique sur "Remplir avec l'IA" pour obtenir des conseils personnalisés.
            </p>
          )}
        </Panel>

        {/* Diagnostic IA */}
        <Panel className="mb-6">
          <PanelHeader
            title="Diagnostic"
            subtitle="Envoie des photos de ta plante pour obtenir un diagnostic IA."
          />

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setDiagnosisPhotos([...Array.from(e.target.files || [])].slice(0, 5))
                }
                className="px-2 py-2 rounded-xl border border-forest/20 bg-white text-sm"
              />
              <p className="text-xs text-ink/50">
                Jusqu'a 5 photos. Prends des photos nettes des feuilles ou tiges affectees.
              </p>
            </div>

            {diagnosisPhotos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {diagnosisPhotos.map((file, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 rounded-lg overflow-hidden border border-forest/20"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Diagnostic ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              size="sm"
              onClick={handleDiagnose}
              disabled={diagnosing || diagnosisPhotos.length === 0}
            >
              {diagnosing ? 'Analyse en cours...' : 'Lancer le diagnostic'}
            </Button>

            {diagnosis && (
              <div
                className={`rounded-2xl p-4 border ${
                  diagnosis.healthy
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">
                    {diagnosis.healthy ? '\u2705' : '\u26A0\uFE0F'}
                  </span>
                  <span
                    className={`font-bold ${
                      diagnosis.healthy ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {diagnosis.diagnosis}
                  </span>
                </div>

                {!diagnosis.healthy && diagnosis.urgency && (
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${
                      diagnosis.urgency === 'élevée'
                        ? 'bg-red-200 text-red-800'
                        : diagnosis.urgency === 'moyenne'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                    }`}
                  >
                    Urgence : {diagnosis.urgency}
                  </span>
                )}

                {diagnosis.problems?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-ink mb-1">
                      Problemes detectes :
                    </p>
                    <ul className="list-disc pl-5 text-sm text-ink/80 space-y-1">
                      {diagnosis.problems.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {diagnosis.recommendations?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-ink mb-1">
                      Recommandations :
                    </p>
                    <ul className="space-y-2">
                      {diagnosis.recommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-ink/80"
                        >
                          <span className="w-5 h-5 rounded-full bg-leaf/20 text-forest flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
};
