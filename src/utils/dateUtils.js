import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  date.setHours(8, 0, 0, 0);
  return date;
};

export const formatDate = (date) => {
  if (!date) return '-';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'dd MMM yyyy', { locale: fr });
};

export const daysBetween = (a, b) => {
  const dateA = typeof a === 'string' ? parseISO(a) : a;
  const dateB = typeof b === 'string' ? parseISO(b) : b;
  return differenceInDays(dateB, dateA);
};

export const nextWateringDate = (plant) => {
  const raw = plant.lastWatered || plant.last_watered;
  if (!raw) {
    // No watering recorded — treat as overdue (epoch)
    return new Date(0);
  }
  const lastWatered = parseISO(raw);
  return addDays(lastWatered, plant.frequency || 7);
};

export const isDue = (plant, today = new Date()) => {
  const next = nextWateringDate(plant);
  const compareDate = new Date(today);
  compareDate.setHours(8, 0, 0, 0);
  next.setHours(8, 0, 0, 0);
  return next <= compareDate;
};

export const describePlant = (plant) => {
  const next = nextWateringDate(plant);
  const today = new Date();
  const days = daysBetween(today, next);

  if (isDue(plant)) return "À arroser aujourd'hui";
  if (days === 1) return "À arroser demain";
  return `Prochain arrosage dans ${days} jours`;
};
