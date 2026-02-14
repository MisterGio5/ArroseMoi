import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHouses } from '../contexts/HouseContext';
import { houseService } from '../services/houseService';
import { Header } from '../components/layout/Header';
import { Panel, PanelHeader } from '../components/layout/Panel';
import { Button } from '../components/common/Button';

export const HouseDetail = () => {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadHouses } = useHouses();

  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  // Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const loadHouse = async () => {
    try {
      setLoading(true);
      const data = await houseService.getHouse(houseId);
      setHouse(data);
      setNewName(data.name);
    } catch {
      setError('Maison non trouvee');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHouse();
  }, [houseId]);

  const isOwner = house?.role === 'owner';

  const handleRename = async () => {
    if (!newName.trim() || newName === house.name) {
      setEditingName(false);
      return;
    }
    try {
      await houseService.updateHouse(houseId, newName.trim());
      setHouse((prev) => ({ ...prev, name: newName.trim() }));
      setEditingName(false);
      setSuccess('Nom mis a jour');
      loadHouses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError('');
    try {
      await houseService.inviteMember(houseId, inviteEmail.trim());
      setInviteEmail('');
      setSuccess('Invitation envoyee !');
      await loadHouse();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    const isSelf = memberId === user?.id;
    const msg = isSelf
      ? 'Tu veux vraiment quitter cette maison ?'
      : 'Retirer ce membre de la maison ?';
    if (!window.confirm(msg)) return;

    try {
      await houseService.removeMember(houseId, memberId);
      if (isSelf) {
        loadHouses();
        navigate('/houses');
      } else {
        await loadHouse();
        loadHouses();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer la maison "${house.name}" ? Les plantes ne seront plus accessibles.`)) return;
    try {
      await houseService.deleteHouse(houseId);
      loadHouses();
      navigate('/houses');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Regenerer le code d\'invitation ? L\'ancien code ne fonctionnera plus.')) return;
    try {
      const newCode = await houseService.regenerateCode(houseId);
      setHouse((prev) => ({ ...prev, invite_code: newCode }));
      setSuccess('Code regenere !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(house.invite_code);
    setSuccess('Code copie !');
    setTimeout(() => setSuccess(''), 2000);
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

  if (!house) {
    return (
      <div className="min-h-screen p-4 md:p-8 relative">
        <div className="orb orb-one"></div>
        <div className="orb orb-two"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Header />
          <p className="text-center mt-8 text-ink/70">{error || 'Maison non trouvee'}</p>
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

        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/houses')}>
            Retour
          </Button>
        </div>

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

        {/* House name */}
        <Panel className="mb-6">
          <div className="flex items-center justify-between gap-4">
            {editingName ? (
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-forest/20 focus:border-leaf focus:ring-2 focus:ring-leaf/20 outline-none text-lg font-bold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                />
                <Button size="sm" onClick={handleRename}>Sauver</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingName(false)}>Annuler</Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-ink">{house.name}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-leaf/20 text-forest">
                    {isOwner ? 'Proprietaire' : 'Membre'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setEditingName(true)}>
                    Renommer
                  </Button>
                </div>
              </>
            )}
          </div>
        </Panel>

        {/* Invite code */}
        <Panel className="mb-6">
          <PanelHeader title="Code d'invitation" subtitle="Partage ce code pour inviter des personnes" />
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-forest/5 px-4 py-3 rounded-xl text-center font-mono text-xl tracking-[0.3em] text-forest font-bold select-all">
              {house.invite_code}
            </code>
            <Button size="sm" onClick={copyCode}>Copier</Button>
            {isOwner && (
              <Button variant="ghost" size="sm" onClick={handleRegenerateCode}>
                Regenerer
              </Button>
            )}
          </div>
        </Panel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Members */}
          <Panel>
            <PanelHeader title="Membres" subtitle={`${house.members?.length || 0} membre(s)`} />
            <div className="space-y-2">
              {house.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/40"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{member.email}</p>
                    <p className="text-xs text-ink/50">
                      {member.role === 'owner' ? 'Proprietaire' : 'Membre'} — depuis le{' '}
                      {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {(isOwner && member.id !== user?.id) || member.id === user?.id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      {member.id === user?.id ? 'Quitter' : 'Retirer'}
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>

          {/* Invite by email */}
          <Panel>
            <PanelHeader title="Inviter par email" />
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full px-4 py-2 rounded-lg border border-forest/20 focus:border-leaf focus:ring-2 focus:ring-leaf/20 outline-none text-sm"
              />
              <Button type="submit" disabled={inviting || !inviteEmail.trim()} className="w-full">
                {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
              </Button>
            </form>

            {/* Pending invitations */}
            {house.pendingInvitations?.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-ink/50 uppercase tracking-wide">En attente</p>
                {house.pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-sun/10"
                  >
                    <span className="text-sm text-ink">{inv.invited_email}</span>
                    <span className="text-xs text-ink/40">
                      Expire le {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Danger zone */}
        {isOwner && (
          <Panel>
            <PanelHeader title="Zone de danger" />
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              Supprimer cette maison
            </Button>
          </Panel>
        )}
      </div>
    </div>
  );
};
