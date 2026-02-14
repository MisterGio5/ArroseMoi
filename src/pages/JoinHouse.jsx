import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHouses } from '../contexts/HouseContext';
import { Header } from '../components/layout/Header';
import { Panel } from '../components/layout/Panel';

export const JoinHouse = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { joinByCode } = useHouses();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const join = async () => {
      try {
        await joinByCode(code);
        setStatus('success');
        setTimeout(() => navigate('/houses'), 2000);
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.error || 'Code invalide ou expire');
      }
    };
    join();
  }, [code]);

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>

      <div className="max-w-lg mx-auto relative z-10">
        <Header />

        <Panel className="mt-8 text-center py-12">
          {status === 'loading' && (
            <p className="text-ink/70">Rejoindre la maison...</p>
          )}
          {status === 'success' && (
            <>
              <p className="text-2xl mb-2">&#127968;</p>
              <p className="text-lg font-medium text-forest">Tu as rejoint la maison !</p>
              <p className="text-sm text-ink/50 mt-2">Redirection en cours...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-lg font-medium text-red-600 mb-2">{error}</p>
              <button
                onClick={() => navigate('/houses')}
                className="text-sm text-forest underline mt-2"
              >
                Retour aux maisons
              </button>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
};
