// Messages d'erreur connus (safe à afficher à l'utilisateur)
const KNOWN_MESSAGES = [
  'Identifiants incorrects',
  'Email déjà utilisé',
  'Email ou mot de passe manquant',
  'Les mots de passe ne correspondent pas',
  'Le mot de passe doit contenir au moins 6 caractères',
  'Token manquant',
  'Token invalide',
  'Plante non trouvée',
  'Maison non trouvée',
  'Invitation non trouvée',
  'Code d\'invitation invalide',
  'Vous êtes déjà membre de cette maison',
  'Subscription invalide',
  'Aucune souscription trouvée',
  'Permission de notification refusée',
];

/**
 * Retourne un message d'erreur safe pour l'utilisateur.
 * Ne montre jamais les détails techniques (stack, SQL, etc.)
 */
export function getUserMessage(error, fallback = 'Une erreur est survenue. Réessayez.') {
  const serverMsg = error?.response?.data?.error;

  // Si le message du serveur est dans la liste blanche, on l'affiche
  if (serverMsg && KNOWN_MESSAGES.some((m) => serverMsg.includes(m))) {
    return serverMsg;
  }

  // Message d'erreur throw (ex: erreurs de validation frontend)
  if (error?.message && KNOWN_MESSAGES.some((m) => error.message.includes(m))) {
    return error.message;
  }

  return fallback;
}
