interface FilterPanelProps {
  filters: {
    genre: string;
    timeRange: string;
    distance: number;
    popularity: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

const GENRES = ['all', 'jazz', 'rock', 'folk', 'pop', 'classical', 'blues', 'other'];
const TIME_RANGES = [
  { value: 'now', label: 'Live Now' },
  { value: 'hour', label: 'Next Hour' },
  { value: 'today', label: 'Today' },
  { value: 'all', label: 'All Time' }
];
const DISTANCES = [1, 2, 5, 10, 25];

export function FilterPanel({ filters, onFiltersChange, onClose }: FilterPanelProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-bold text-foreground">🔍 Find Performances</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-h-[calc(100vh-200px)]">
        {/* Genre Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            🎵 Genre
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => handleFilterChange('genre', genre)}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  filters.genre === genre
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                }`}
              >
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Time Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            ⏰ Time
          </label>
          <div className="space-y-2">
            {TIME_RANGES.map(timeRange => (
              <button
                key={timeRange.value}
                onClick={() => handleFilterChange('timeRange', timeRange.value)}
                className={`w-full p-3 text-sm rounded-lg border transition-colors text-left ${
                  filters.timeRange === timeRange.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                }`}
              >
                {timeRange.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distance Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            📍 Distance
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DISTANCES.map(distance => (
              <button
                key={distance}
                onClick={() => handleFilterChange('distance', distance)}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  filters.distance === distance
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                }`}
              >
                {distance}km
              </button>
            ))}
          </div>
        </div>

        {/* Popularity Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            🔥 Popularity
          </label>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All Performances' },
              { value: 'trending', label: 'Trending Now' },
              { value: 'popular', label: 'Most Popular' },
              { value: 'new', label: 'New Performers' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('popularity', option.value)}
                className={`w-full p-3 text-sm rounded-lg border transition-colors text-left ${
                  filters.popularity === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => onFiltersChange({
              genre: 'all',
              timeRange: 'all',
              distance: 25,
              popularity: 'all'
            })}
            className="w-full bg-card hover:bg-muted text-foreground border border-border px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="p-4 border-t border-border bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          Filter performances by genre and time
        </p>
      </div>
    </div>
  );
}
