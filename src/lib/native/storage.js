import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Détecte si on est sur une plateforme native (iOS/Android)
const isNative = Capacitor.isNativePlatform();

/**
 * Wrapper de stockage persistant.
 * Utilise Capacitor Preferences sur mobile, localStorage en fallback web.
 * Toutes les méthodes sont async pour compatibilité Capacitor.
 */
export const storage = {
  async getItem(key) {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },

  async setItem(key, value) {
    if (isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async removeItem(key) {
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
};
