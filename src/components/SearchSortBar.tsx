import { Search } from 'lucide-react';
import type { SortKey } from '../types';

type SearchSortBarProps = {
  query: string;
  sortKey: SortKey;
  onQueryChange: (query: string) => void;
  onSortChange: (sortKey: SortKey) => void;
};

export function SearchSortBar({ query, sortKey, onQueryChange, onSortChange }: SearchSortBarProps) {
  return (
    <div className="mb-4 grid grid-cols-[1fr_112px] gap-2 md:mb-5 md:grid-cols-[1fr_180px] md:rounded-lg md:border md:border-zinc-800 md:bg-zinc-900 md:p-3 md:shadow-sm">
      <label className="field-label">
        <span className="hidden md:inline">Search</span>
        <span className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={17}
          />
          <input
            className="field-input pl-9"
            placeholder="Search cards"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </span>
      </label>
      <label className="field-label">
        <span className="hidden md:inline">Sort</span>
        <select
          className="field-input"
          value={sortKey}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
        >
          <option value="set">Set</option>
          <option value="name">Name</option>
          <option value="pokedex">Pokedex</option>
          <option value="cardNumber">Card #</option>
          <option value="count">Count</option>
        </select>
      </label>
    </div>
  );
}
