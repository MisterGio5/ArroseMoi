import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlants } from '../contexts/PlantContext';
import { Header } from '../components/layout/Header';
import { Panel, PanelHeader } from '../components/layout/Panel';
import { Button } from '../components/common/Button';
import {
  nextWateringDate,
  nextRepottingDate,
  nextFertilizerDate,
} from '../utils/dateUtils';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  addDays,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { fr } from 'date-fns/locale';

const EVENT_TYPES = {
  water: {
    label: 'Arrosage',
    color: 'bg-blue-400',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50',
  },
  repot: {
    label: 'Rempotage',
    color: 'bg-amber-600',
    textColor: 'text-amber-700',
    bgLight: 'bg-amber-50',
  },
  fertilize: {
    label: 'Engrais',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgLight: 'bg-green-50',
  },
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const Calendar = () => {
  const { plants } = usePlants();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const events = useMemo(() => {
    const eventMap = new Map();

    const addEvent = (date, plantName, type, plantId) => {
      if (!date || isNaN(date.getTime())) return;
      const key = format(date, 'yyyy-MM-dd');
      if (!eventMap.has(key)) eventMap.set(key, []);
      eventMap.get(key).push({ plantName, type, plantId });
    };

    for (const plant of plants) {
      // Past watering
      const lastWatered = plant.lastWatered || plant.last_watered;
      if (lastWatered) {
        try {
          addEvent(parseISO(lastWatered), plant.name, 'water', plant.id);
        } catch { /* skip invalid dates */ }
      }

      // Future watering cycles
      try {
        const nextWater = nextWateringDate(plant);
        if (nextWater && !isNaN(nextWater.getTime())) {
          const freq = plant.frequency || 7;
          // Show past due + next 5 cycles
          for (let i = 0; i <= 5; i++) {
            addEvent(addDays(nextWater, freq * i), plant.name, 'water', plant.id);
          }
        }
      } catch { /* skip */ }

      // Past repotting
      const lastRepotted = plant.lastRepotted || plant.last_repotted;
      if (lastRepotted) {
        try {
          addEvent(parseISO(lastRepotted), plant.name, 'repot', plant.id);
        } catch { /* skip */ }
      }

      // Next repotting
      try {
        const nextRepot = nextRepottingDate(plant);
        if (nextRepot && !isNaN(nextRepot.getTime())) {
          addEvent(nextRepot, plant.name, 'repot', plant.id);
        }
      } catch { /* skip */ }

      // Past fertilizer
      const lastFertilized = plant.lastFertilized || plant.last_fertilized;
      if (lastFertilized) {
        try {
          addEvent(parseISO(lastFertilized), plant.name, 'fertilize', plant.id);
        } catch { /* skip */ }
      }

      // Future fertilizer cycles
      try {
        const nextFert = nextFertilizerDate(plant);
        if (nextFert && !isNaN(nextFert.getTime())) {
          const fertFreqDays =
            (plant.fertilizerFrequency || plant.fertilizer_frequency || 4) * 7;
          for (let i = 0; i <= 3; i++) {
            addEvent(
              addDays(nextFert, fertFreqDays * i),
              plant.name,
              'fertilize',
              plant.id
            );
          }
        }
      } catch { /* skip */ }
    }

    return eventMap;
  }, [plants]);

  const getEventsForDate = (date) => {
    const key = format(date, 'yyyy-MM-dd');
    return events.get(key) || [];
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Header />

        <Panel className="mb-6">
          <PanelHeader
            title="Calendrier"
            subtitle="Vue mensuelle de tous les entretiens de tes plantes."
          />

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4">
            {Object.entries(EVENT_TYPES).map(([key, { label, color }]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 text-sm text-ink/70"
              >
                <span className={`w-3 h-3 rounded-full ${color}`}></span>
                {label}
              </div>
            ))}
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              &larr; Precedent
            </Button>
            <h3 className="text-lg font-bold text-ink capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              Suivant &rarr;
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-forest/10 rounded-xl overflow-hidden border border-forest/10">
            {/* Weekday headers */}
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="bg-forest/5 py-2 text-center text-xs font-medium text-ink/60"
              >
                {day}
              </div>
            ))}

            {/* Day cells */}
            {calendarDays.map((day) => {
              const dayEvents = getEventsForDate(day);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const uniqueTypes = [...new Set(dayEvents.map((e) => e.type))];

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[60px] md:min-h-[80px] p-1 text-left transition-colors ${
                    inMonth ? 'bg-white' : 'bg-white/40'
                  } ${selected ? 'ring-2 ring-leaf ring-inset' : ''} hover:bg-leaf/10`}
                >
                  <span
                    className={`text-xs font-medium block mb-1 ${
                      today
                        ? 'bg-forest text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto'
                        : inMonth
                          ? 'text-ink'
                          : 'text-ink/30'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {uniqueTypes.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {uniqueTypes.map((type) => (
                        <span
                          key={type}
                          className={`w-2 h-2 rounded-full ${EVENT_TYPES[type].color}`}
                        ></span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="mt-4 p-4 bg-white/50 rounded-2xl border border-forest/12">
              <h4 className="font-bold text-ink mb-3 capitalize">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </h4>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-ink/50">
                  Aucun entretien prevu ce jour.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((event, idx) => (
                    <li
                      key={idx}
                      onClick={() => navigate(`/plant/${event.plantId}`)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${EVENT_TYPES[event.type].bgLight}`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full shrink-0 ${EVENT_TYPES[event.type].color}`}
                      ></span>
                      <span
                        className={`text-sm font-medium ${EVENT_TYPES[event.type].textColor}`}
                      >
                        {EVENT_TYPES[event.type].label}
                      </span>
                      <span className="text-sm text-ink/80">
                        {event.plantName}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};
