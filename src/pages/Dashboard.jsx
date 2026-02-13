import { useState, useMemo, useRef } from 'react';
import { usePlants } from '../contexts/PlantContext';
import { Header } from '../components/layout/Header';
import { Panel, PanelHeader } from '../components/layout/Panel';
import { PlantCard } from '../components/plants/PlantCard';
import { PlantForm } from '../components/plants/PlantForm';
import { PlantStats } from '../components/plants/PlantStats';
import { DuePlants } from '../components/plants/DuePlants';
import { PlantFilters } from '../components/plants/PlantFilters';
import { Button } from '../components/common/Button';
import { isDue, nextWateringDate } from '../utils/dateUtils';

export const Dashboard = () => {
  const { plants } = usePlants();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('next');
  const [dueOnly, setDueOnly] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const importFileRef = useRef(null);

  const filteredAndSortedPlants = useMemo(() => {
    return plants
      .filter((plant) => {
        const matchesSearch = plant.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || plant.type === filter;
        const matchesDue = !dueOnly || isDue(plant);
        const matchesFavorite = !favoriteOnly || plant.favorite;
        return matchesSearch && matchesFilter && matchesDue && matchesFavorite;
      })
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name, 'fr');
        if (sort === 'recent') return (b.id || 0) - (a.id || 0);
        return nextWateringDate(a) - nextWateringDate(b);
      });
  }, [plants, search, filter, sort, dueOnly, favoriteOnly]);

  const handleExport = () => {
    const data = JSON.stringify(plants, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'arrose-moi-plantes.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    importFileRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // TODO: Implement import logic
      console.log('Import data:', data);
      alert('Import réussi !');
    } catch (error) {
      alert('Erreur lors de l\'import');
    }
  };

  const handleEdit = (plant) => {
    setEditingPlant(plant);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPlant(null);
  };

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert('Les notifications ne sont pas supportées par ce navigateur.');
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification('ArroseMoi', {
          body: 'Notifications activées pour vos rappels d\'arrosage.',
        });
      } else {
        alert('Notifications bloquées. Autorisez-les dans les réglages du navigateur.');
      }
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <Header />

        {/* Hero Section */}
        <header className="grid md:grid-cols-[1.3fr_1fr] gap-6 items-center mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-moss mb-3">
              Ton jardin, bien arrosé
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-ink mb-3">
              ArroseMoi
            </h1>
            <p className="text-lg text-ink/80 mb-5 max-w-xl">
              Catalogue de plantes, fiches détaillées et rappels d'arrosage intelligents.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={requestNotificationPermission}>
                Activer les notifications
              </Button>
              <Button variant="ghost">Tester</Button>
            </div>
          </div>

          <PlantStats />
        </header>

        <main className="space-y-6">
          {/* Catalog */}
          <Panel>
            <PanelHeader
              title="Catalogue de plantes"
              actions={
                <PlantFilters
                  search={search}
                  filter={filter}
                  sort={sort}
                  dueOnly={dueOnly}
                  favoriteOnly={favoriteOnly}
                  onSearchChange={setSearch}
                  onFilterChange={setFilter}
                  onSortChange={setSort}
                  onDueOnlyChange={setDueOnly}
                  onFavoriteOnlyChange={setFavoriteOnly}
                  onExport={handleExport}
                  onImport={handleImport}
                />
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedPlants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} onEdit={handleEdit} />
              ))}
            </div>

            {filteredAndSortedPlants.length === 0 && (
              <p className="text-center text-ink/70 py-8">Aucune plante trouvée.</p>
            )}

            <input
              ref={importFileRef}
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </Panel>

          {/* Add/Edit Form */}
          <Panel>
            <PanelHeader
              title={editingPlant ? 'Modifier la plante' : 'Ajouter une plante'}
              subtitle="Photo, type, exposition et fréquence d'arrosage."
            />
            <PlantForm plant={editingPlant} onCancel={handleCancelEdit} />
          </Panel>

          {/* Due Plants */}
          <Panel>
            <PanelHeader
              title="À arroser aujourd'hui"
              subtitle="Marque les plantes arrosées pour recalculer le prochain rappel."
            />
            <DuePlants />
          </Panel>
        </main>
      </div>
    </div>
  );
};
