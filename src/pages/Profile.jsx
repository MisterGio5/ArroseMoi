import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { Panel, PanelHeader } from '../components/layout/Panel';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [plantnetKey, setPlantnetKey] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      setError('Erreur lors du chargement du profil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!openaiKey && !plantnetKey) {
      setError('Veuillez entrer au moins une clé API');
      return;
    }

    try {
      setSavingKeys(true);
      await profileService.updateApiKeys(openaiKey || null, plantnetKey || null);
      setSuccess('Clés API enregistrées avec succès');
      setOpenaiKey('');
      setPlantnetKey('');
      await loadProfile();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement des clés');
      console.error(err);
    } finally {
      setSavingKeys(false);
    }
  };

  const handleDeleteKey = async (keyType) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer votre clé ${keyType === 'openai' ? 'OpenAI' : 'PlantNet'} ?`)) {
      return;
    }

    try {
      await profileService.deleteApiKeys(keyType);
      setSuccess('Clé supprimée avec succès');
      await loadProfile();
    } catch (err) {
      setError('Erreur lors de la suppression de la clé');
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 relative">
        <div className="orb orb-one"></div>
        <div className="orb orb-two"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Header />
          <p className="text-center mt-8 text-ink/70">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Header />

        {/* Profile Information */}
        <Panel className="mt-8">
          <PanelHeader title="Mon compte" subtitle="Informations de ton profil" />

          <div className="space-y-4">
            <div>
              <p className="text-sm text-ink/70 mb-1">Email</p>
              <p className="text-lg font-semibold text-ink">{user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-ink/70 mb-1">Compte créé</p>
              <p className="text-lg font-semibold text-ink">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('fr-FR')
                  : '-'}
              </p>
            </div>

            <div className="pt-6">
              <Button variant="ghost" onClick={handleLogout}>
                Se déconnecter
              </Button>
            </div>
          </div>
        </Panel>

        {/* API Keys Configuration */}
        <Panel className="mt-6">
          <PanelHeader
            title="🤖 Configuration IA"
            subtitle="Configure tes clés API pour l'identification des plantes"
          />

          <div className="space-y-6">
            {/* Current Keys Status */}
            <div className="bg-sage/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">OpenAI API Key</p>
                  <p className="text-xs text-ink/60">
                    {profile?.openaiApiKey ? `Configurée: ${profile.openaiApiKey}` : 'Non configurée'}
                  </p>
                </div>
                {profile?.openaiApiKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey('openai')}
                  >
                    Supprimer
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">PlantNet API Key</p>
                  <p className="text-xs text-ink/60">
                    {profile?.plantnetApiKey ? `Configurée: ${profile.plantnetApiKey}` : 'Non configurée'}
                  </p>
                </div>
                {profile?.plantnetApiKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey('plantnet')}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            </div>

            {/* Add/Update Keys Form */}
            <form onSubmit={handleSaveKeys} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 rounded-lg border border-sage/30 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition"
                />
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sage hover:text-sage-dark mt-1 inline-block"
                >
                  → Obtenir une clé OpenAI
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  PlantNet API Key
                </label>
                <input
                  type="password"
                  value={plantnetKey}
                  onChange={(e) => setPlantnetKey(e.target.value)}
                  placeholder="Votre clé PlantNet..."
                  className="w-full px-4 py-2 rounded-lg border border-sage/30 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition"
                />
                <a
                  href="https://my.plantnet.org/account/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sage hover:text-sage-dark mt-1 inline-block"
                >
                  → Obtenir une clé PlantNet
                </a>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={savingKeys || (!openaiKey && !plantnetKey)}
                className="w-full"
              >
                {savingKeys ? 'Enregistrement...' : 'Enregistrer les clés'}
              </Button>
            </form>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">🔒 Sécurité</p>
              <p className="text-xs">
                Tes clés API sont chiffrées et stockées de manière sécurisée.
                Elles ne sont utilisées que pour identifier tes plantes et ne sont jamais partagées.
              </p>
            </div>
          </div>
        </Panel>

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            ← Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
};
