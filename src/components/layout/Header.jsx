import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHouses } from '../../contexts/HouseContext';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Mes Plantes', path: '/dashboard', icon: '🌿' },
  { label: 'Rappels', path: '/reminders', icon: '🔔' },
  { label: 'Calendrier', path: '/calendar', icon: '📅', badge: 'Beta' },
  { label: 'Mes Maisons', path: '/houses', icon: '🏠' },
  { label: 'Statistiques', path: '/stats', icon: '📊' },
  { label: 'Mon Compte', path: '/profile', icon: '👤' },
];

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Safely access houses context (may not be available on login/register pages)
  let houses = [];
  let currentHouseId = null;
  let switchHouse = () => {};
  let pendingInvitations = [];
  try {
    const houseCtx = useHouses();
    houses = houseCtx.houses;
    currentHouseId = houseCtx.currentHouseId;
    switchHouse = houseCtx.switchHouse;
    pendingInvitations = houseCtx.pendingInvitations;
  } catch {
    // HouseContext not available (e.g. on login page)
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/plant/');
    }
    if (path === '/houses') {
      return location.pathname.startsWith('/houses');
    }
    return location.pathname === path;
  };

  const invitationCount = pendingInvitations?.length || 0;

  return (
    <header className="relative z-20 mb-2">
      <div className="flex items-center justify-between gap-4 px-2 py-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">🌱</span>
          <span className="text-xl">ArroseMoi</span>
        </button>

        {/* Desktop nav */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ label, path, icon, badge }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(path)
                    ? 'bg-leaf/30 text-forest'
                    : 'text-ink/60 hover:text-ink hover:bg-forest/5'
                }`}
              >
                <span className="mr-1.5">{icon}</span>
                {label}
                {badge && (
                  <span className="ml-1 px-1.5 py-0.5 bg-sun/50 text-forest text-[10px] font-bold rounded-full uppercase">
                    {badge}
                  </span>
                )}
                {path === '/houses' && invitationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {invitationCount}
                  </span>
                )}
              </button>
            ))}

            {/* House switcher */}
            {houses.length > 0 && (
              <>
                <div className="w-px h-6 bg-forest/15 mx-1" />
                <select
                  value={currentHouseId || ''}
                  onChange={(e) => switchHouse(e.target.value ? Number(e.target.value) : null)}
                  className="px-2 py-1.5 rounded-lg text-xs bg-forest/5 border border-forest/10 text-ink/70 outline-none cursor-pointer max-w-[140px]"
                >
                  <option value="">Toutes les maisons</option>
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </>
            )}

            <div className="w-px h-6 bg-forest/15 mx-1" />

            <span className="text-xs text-ink/50 hidden lg:block">{user?.email}</span>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg text-sm text-ink/50 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              Deconnexion
            </button>
          </nav>
        )}

        {/* Mobile hamburger */}
        {isAuthenticated && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Menu"
          >
            <span
              className={`block w-5 h-0.5 bg-ink transition-transform origin-center ${
                menuOpen ? 'rotate-45 translate-y-[4px]' : ''
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-ink transition-opacity ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-ink transition-transform origin-center ${
                menuOpen ? '-rotate-45 -translate-y-[4px]' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {isAuthenticated && menuOpen && (
        <nav className="md:hidden bg-card border border-forest/12 rounded-2xl shadow-xl p-3 mx-2 mb-4 space-y-1 animate-rise">
          {NAV_ITEMS.map(({ label, path, icon, badge }) => (
            <button
              key={path}
              onClick={() => {
                navigate(path);
                setMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                isActive(path)
                  ? 'bg-leaf/30 text-forest'
                  : 'text-ink/70 hover:bg-forest/5'
              }`}
            >
              <span className="mr-2">{icon}</span>
              {label}
              {badge && (
                <span className="ml-1 px-1.5 py-0.5 bg-sun/50 text-forest text-[10px] font-bold rounded-full uppercase">
                  {badge}
                </span>
              )}
              {path === '/houses' && invitationCount > 0 && (
                <span className="ml-2 inline-flex w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full items-center justify-center">
                  {invitationCount}
                </span>
              )}
            </button>
          ))}

          {/* House switcher mobile */}
          {houses.length > 0 && (
            <div className="px-4 py-2">
              <select
                value={currentHouseId || ''}
                onChange={(e) => {
                  switchHouse(e.target.value ? Number(e.target.value) : null);
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-sm bg-forest/5 border border-forest/10 text-ink/70 outline-none"
              >
                <option value="">Toutes les maisons</option>
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t border-forest/10 pt-2 mt-2">
            <p className="px-4 py-1 text-xs text-ink/40">{user?.email}</p>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all"
            >
              Deconnexion
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
