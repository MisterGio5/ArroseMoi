import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHouses } from '../contexts/HouseContext';
import { Header } from '../components/layout/Header';
import { Panel, PanelHeader } from '../components/layout/Panel';
import { Button } from '../components/common/Button';

export const Houses = () => {
  const navigate = useNavigate();
  const {
    houses,
    pendingInvitations,
    createHouse,
    joinByCode,
    acceptInvitation,
    declineInvitation,
  } = useHouses();

  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createHouse(newName.trim());
      setNewName('');
      setSuccess('Maison creee !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la creation');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    setError('');
    try {
      await joinByCode(joinCode.trim());
      setJoinCode('');
      setSuccess('Tu as rejoint la maison !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide');
    } finally {
      setJoining(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptInvitation(id);
      setSuccess('Invitation acceptee !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDecline = async (id) => {
    try {
      await declineInvitation(id);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Header />

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <Panel className="mb-6">
            <PanelHeader title="Invitations en attente" />
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-4 p-3 bg-sun/10 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{inv.house_name}</p>
                    <p className="text-xs text-ink/50">
                      Invite par {inv.invited_by_email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAccept(inv.id)}>
                      Accepter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDecline(inv.id)}
                    >
                      Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        {/* My houses */}
        <Panel className="mb-6">
          <PanelHeader title="Mes Maisons" subtitle="Gere tes maisons et leurs membres" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {houses.map((house) => (
              <button
                key={house.id}
                onClick={() => navigate(`/houses/${house.id}`)}
                className="text-left p-4 rounded-2xl border border-forest/12 bg-white/60 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-ink text-lg">{house.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-leaf/20 text-forest">
                    {house.role === 'owner' ? 'Proprietaire' : 'Membre'}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-ink/60">
                  <span>{house.member_count} membre{house.member_count > 1 ? 's' : ''}</span>
                  <span>{house.plant_count} plante{house.plant_count > 1 ? 's' : ''}</span>
                </div>
              </button>
            ))}
          </div>

          {houses.length === 0 && (
            <p className="text-center text-ink/50 py-4">Aucune maison pour le moment.</p>
          )}
        </Panel>

        {/* Create + Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel>
            <PanelHeader title="Creer une maison" />
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom de la maison"
                className="flex-1 px-4 py-2 rounded-lg border border-forest/20 focus:border-leaf focus:ring-2 focus:ring-leaf/20 outline-none text-sm"
              />
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? '...' : 'Creer'}
              </Button>
            </form>
          </Panel>

          <Panel>
            <PanelHeader title="Rejoindre par code" />
            <form onSubmit={handleJoin} className="flex gap-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Code d'invitation"
                className="flex-1 px-4 py-2 rounded-lg border border-forest/20 focus:border-leaf focus:ring-2 focus:ring-leaf/20 outline-none text-sm font-mono tracking-wider"
                maxLength={8}
              />
              <Button type="submit" disabled={joining || !joinCode.trim()}>
                {joining ? '...' : 'Rejoindre'}
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
};
