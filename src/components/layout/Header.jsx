import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between gap-6 px-2 py-4 pb-8 relative z-10">
      <div className="flex items-center gap-2.5 font-bold tracking-tight">
        <span className="text-2xl">🌱</span>
        <span className="text-xl">ArroseMoi</span>
      </div>

      {isAuthenticated && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-ink/70">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            Mon compte
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Déconnexion
          </Button>
        </div>
      )}
    </header>
  );
};
