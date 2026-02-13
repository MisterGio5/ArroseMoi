export const PLANT_TYPES = {
  interieur: 'Intérieur',
  exterieur: 'Extérieur',
  aromatique: 'Aromatique',
  succulente: 'Succulente',
  potager: 'Potager',
  fleur: 'Fleur',
  arbre: 'Arbre',
};

export const SUN_EXPOSURE = {
  ombre: 'Ombre',
  'mi-ombre': 'Mi-ombre',
  lumineux: 'Lumineux indirect',
  soleil: 'Plein soleil',
};

export const ROOM_LABELS = {
  salon: 'Salon',
  cuisine: 'Cuisine',
  chambre: 'Chambre',
  bureau: 'Bureau',
  balcon: 'Balcon',
  jardin: 'Jardin',
  veranda: 'Véranda',
};

export const DEFAULT_PLANTS = [
  {
    name: 'Monstera deliciosa',
    type: 'interieur',
    sun: 'lumineux',
    room: 'salon',
    frequency: 7,
    indoor: true,
    notes: 'Supporte les lumières indirectes, brumiser en été.',
  },
  {
    name: 'Lavande',
    type: 'aromatique',
    sun: 'soleil',
    room: 'jardin',
    frequency: 5,
    indoor: false,
    notes: 'Aime les sols drainants, éviter l\'excès d\'eau.',
  },
  {
    name: 'Basilic',
    type: 'potager',
    sun: 'mi-ombre',
    room: 'cuisine',
    frequency: 3,
    indoor: true,
    notes: 'Arrosage régulier, couper les fleurs pour favoriser les feuilles.',
  },
  {
    name: 'Ficus elastica',
    type: 'interieur',
    sun: 'lumineux',
    room: 'bureau',
    frequency: 10,
    indoor: true,
    notes: 'Nettoyer les feuilles, éviter les courants d\'air.',
  },
  {
    name: 'Aloe vera',
    type: 'succulente',
    sun: 'soleil',
    room: 'salon',
    frequency: 14,
    indoor: true,
    notes: 'Laisser sécher la terre entre deux arrosages.',
  },
];
