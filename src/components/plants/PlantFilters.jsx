import { Input, Select, Checkbox } from '../common/Input';
import { Button } from '../common/Button';
import { PLANT_TYPES } from '../../utils/constants';

export const PlantFilters = ({
  search,
  filter,
  sort,
  dueOnly,
  favoriteOnly,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onDueOnlyChange,
  onFavoriteOnlyChange,
  onExport,
  onImport,
}) => {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Input
        type="search"
        placeholder="Rechercher une plante"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-w-[220px]"
      />

      <Select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        options={[
          { value: 'next', label: 'Prochain arrosage' },
          { value: 'name', label: 'Nom (A → Z)' },
          { value: 'recent', label: 'Ajout récent' },
        ]}
      />

      <Select
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        options={[
          { value: 'all', label: 'Toutes les catégories' },
          ...Object.entries(PLANT_TYPES).map(([value, label]) => ({ value, label })),
        ]}
      />

      <Checkbox
        label="À arroser"
        checked={dueOnly}
        onChange={(e) => onDueOnlyChange(e.target.checked)}
      />

      <Checkbox
        label="Favoris"
        checked={favoriteOnly}
        onChange={(e) => onFavoriteOnlyChange(e.target.checked)}
      />

      <Button variant="ghost" size="sm" onClick={onExport}>
        Exporter
      </Button>

      <Button variant="ghost" size="sm" onClick={onImport}>
        Importer
      </Button>
    </div>
  );
};
