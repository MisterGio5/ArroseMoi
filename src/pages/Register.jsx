import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { getUserMessage } from '../utils/errorUtils';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getUserMessage(err, 'Erreur lors de l\'inscription'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-custom border border-forest/10 p-8">
        <h1 className="text-3xl font-bold text-ink mb-2">Inscription</h1>
        <p className="text-ink/70 mb-6">Crée ton compte ArroseMoi.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Inscription...' : 'Créer un compte'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink/70 text-center">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-forest font-semibold hover:text-moss">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};
