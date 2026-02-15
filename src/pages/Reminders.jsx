import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlants } from '../contexts/PlantContext';
import { Header } from '../components/layout/Header';
import { Panel, PanelHeader } from '../components/layout/Panel';
import { Button } from '../components/common/Button';
import { isDue, isRepottingDue, isFertilizerDue } from '../utils/dateUtils';
import { PLANT_TYPES } from '../utils/constants';
import {
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
  sendTestNotification,
} from '../services/notifications';

const ReminderSection = ({ title, subtitle, icon, items, actionLabel, onAction, navigate }) => (
  <Panel className="mb-6">
    <PanelHeader title={`${icon} ${title}`} subtitle={subtitle} />
    {items.length === 0 ? (
      <p className="text-ink/50 text-center py-6 text-sm">Aucune plante pour le moment.</p>
    ) : (
      <div className="space-y-3">
        {items.length > 1 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => Promise.all(items.map((p) => onAction(p.id)))}
            >
              Tout marquer
            </Button>
          </div>
        )}
        {items.map((plant) => (
          <div
            key={plant.id}
            onClick={() => navigate(`/plant/${plant.id}`)}
            className="p-4 bg-white/50 rounded-2xl border border-forest/10 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 min-w-0">
              {plant.photo ? (
                <div
                  className="w-10 h-10 rounded-full shrink-0 bg-leaf/20"
                  style={{
                    backgroundImage: `url(${plant.photo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-leaf to-sun" />
              )}
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{plant.name}</p>
                <p className="text-xs text-ink/50">{PLANT_TYPES[plant.type] || plant.type}</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAction(plant.id);
              }}
            >
              {actionLabel}
            </Button>
          </div>
        ))}
      </div>
    )}
  </Panel>
);

export const Reminders = () => {
  const { plants, markAsWatered, markAsRepotted, markAsFertilized } = usePlants();
  const navigate = useNavigate();

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState(null);
  const [pushSupported, setPushSupported] = useState(true);
  const [pushSuccess, setPushSuccess] = useState(null);

  useEffect(() => {
    const isSecure =
      location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1';
    const supported =
      'serviceWorker' in navigator && 'PushManager' in window && isSecure;
    setPushSupported(supported);

    if (supported) {
      isPushSubscribed().then(setPushEnabled);
    } else if (!isSecure) {
      setPushError('HTTPS requis pour les notifications');
    }
  }, []);

  const handleTogglePush = async () => {
    setPushLoading(true);
    setPushError(null);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
      } else {
        await subscribeToPush();
        setPushEnabled(true);
      }
    } catch (err) {
      console.error('[ArroseMoi] Push error:', err);
      setPushError(
        err.message || 'Erreur lors de la configuration des notifications'
      );
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setPushError(null);
    setPushSuccess(null);
    try {
      const res = await sendTestNotification();
      setPushSuccess(res.data?.message || 'Notification envoyee !');
      setTimeout(() => setPushSuccess(null), 5000);
    } catch (err) {
      setPushError(
        err.response?.data?.error ||
          "Erreur lors de l'envoi de la notification test"
      );
    }
  };

  const duePlants = plants.filter((p) => isDue(p));
  const repottingDue = plants.filter((p) => isRepottingDue(p));
  const fertilizerDue = plants.filter((p) => isFertilizerDue(p));

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Header />

        {/* Push notification controls */}
        <Panel className="mb-6">
          <PanelHeader
            title="Notifications push"
            subtitle="Recois un rappel chaque matin pour tes plantes."
          />
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              onClick={handleTogglePush}
              disabled={pushLoading || !pushSupported}
            >
              {pushLoading
                ? 'Chargement...'
                : pushEnabled
                  ? 'Desactiver les notifications'
                  : 'Activer les notifications'}
            </Button>
            {pushEnabled && (
              <Button variant="ghost" onClick={handleTestNotification}>
                Tester
              </Button>
            )}
          </div>
          {pushError && (
            <p className="text-red-500 text-sm mt-2">{pushError}</p>
          )}
          {pushSuccess && (
            <p className="text-green-600 text-sm mt-2">{pushSuccess}</p>
          )}
          {!pushSupported && !pushError && (
            <p className="text-amber-600 text-sm mt-2">
              Notifications non disponibles (HTTPS requis ou navigateur non
              compatible)
            </p>
          )}
        </Panel>

        <ReminderSection
          title="A arroser"
          subtitle="Plantes qui ont besoin d'eau aujourd'hui"
          icon="&#128167;"
          items={duePlants}
          actionLabel="Arrosee"
          onAction={(id) => markAsWatered(id)}
          navigate={navigate}
        />

        <ReminderSection
          title="A rempoter"
          subtitle="Plantes qui ont besoin d'un rempotage"
          icon="&#127793;"
          items={repottingDue}
          actionLabel="Rempotee"
          onAction={(id) => markAsRepotted(id)}
          navigate={navigate}
        />

        <ReminderSection
          title="A fertiliser"
          subtitle="Plantes qui ont besoin d'engrais"
          icon="&#129516;"
          items={fertilizerDue}
          actionLabel="Fertilisee"
          onAction={(id) => markAsFertilized(id)}
          navigate={navigate}
        />
      </div>
    </div>
  );
};
