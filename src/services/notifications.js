import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getVapidPublicKey() {
  const res = await api.get('/notifications/vapid-public-key');
  return res.data.publicKey;
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker non supporté par ce navigateur');
  }
  if (!('PushManager' in window)) {
    throw new Error('Push API non supportée par ce navigateur');
  }
  if (!('Notification' in window)) {
    throw new Error('Notifications non supportées par ce navigateur');
  }

  // Check if we're on HTTPS or localhost
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isSecure) {
    throw new Error('Les notifications nécessitent HTTPS. Configurez un certificat SSL pour votre serveur.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission de notification refusée. Autorisez-les dans les réglages du navigateur.');
  }

  // Wait for SW with a timeout
  const registration = await getSwRegistration();
  if (!registration) {
    throw new Error('Service Worker non enregistré. Rechargez la page et réessayez.');
  }

  const vapidPublicKey = await getVapidPublicKey();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const subJSON = subscription.toJSON();

  await api.post('/notifications/subscribe', {
    endpoint: subJSON.endpoint,
    keys: {
      p256dh: subJSON.keys.p256dh,
      auth: subJSON.keys.auth,
    },
  });

  console.log('[ArroseMoi] Push subscription active');
  return subscription;
}

export async function unsubscribeFromPush() {
  const registration = await getSwRegistration();
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await api.delete('/notifications/subscribe', { data: { endpoint } });
    console.log('[ArroseMoi] Push subscription removed');
  }
}

export async function isPushSubscribed() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await getSwRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

export async function sendTestNotification() {
  return api.post('/notifications/test');
}

// Get SW registration with a 3-second timeout (avoids hanging forever)
function getSwRegistration() {
  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator)) {
      resolve(null);
      return;
    }

    const timeout = setTimeout(() => {
      console.warn('[ArroseMoi] SW ready timeout');
      resolve(navigator.serviceWorker.controller ? navigator.serviceWorker.ready : null);
    }, 3000);

    navigator.serviceWorker.ready.then((reg) => {
      clearTimeout(timeout);
      resolve(reg);
    }).catch(() => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[ArroseMoi] Service Worker non supporté');
    return;
  }

  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      console.log('[ArroseMoi] SW enregistré, scope:', reg.scope);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[ArroseMoi] SW mis à jour');
            }
          });
        }
      });
    })
    .catch((err) => {
      console.error('[ArroseMoi] SW registration échouée:', err.message);
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.error('[ArroseMoi] HTTPS requis pour le Service Worker');
      }
    });
}
