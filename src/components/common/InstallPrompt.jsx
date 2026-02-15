import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';

export const InstallPrompt = () => {
  const [showBanner, setShowBanner] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('arrosemoi-install-dismissed')) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      deferredPrompt.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;

    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    deferredPrompt.current = null;
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('arrosemoi-install-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto animate-rise">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-forest/10 p-4 flex items-center gap-4">
        <img
          src="/icons/icon-96.png"
          alt="ArroseMoi"
          className="w-12 h-12 rounded-xl flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm">Installer ArroseMoi</p>
          <p className="text-xs text-ink/60">
            Accès rapide depuis l'écran d'accueil
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Plus tard
          </Button>
          <Button size="sm" onClick={handleInstall}>
            Installer
          </Button>
        </div>
      </div>
    </div>
  );
};
