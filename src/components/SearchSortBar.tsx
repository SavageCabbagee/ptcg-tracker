import { Search } from 'lucide-react';
import { ALL_SUBGROUPS_ID, UNGROUPED_SUBGROUP_ID } from '../constants';
import type { CardSubgroup, SortKey } from '../types';

type SearchSortBarProps = {
  query: string;
  sortKey: SortKey;
  subgroups?: CardSubgroup[];
  subgroupId: string;
  subgroupCounts: Map<string, number>;
  onQueryChange: (query: string) => void;
  onSortChange: (sortKey: SortKey) => void;
  onSubgroupChange: (subgroupId: string) => void;
};

export function SearchSortBar({
  query,
  sortKey,
  subgroups = [],
  subgroupId,
  subgroupCounts,
  onQueryChange,
  onSortChange,
  onSubgroupChange,
}: SearchSortBarProps) {
  const hasSubgroupFilter = subgroups.length > 0;

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
      {hasSubgroupFilter && (
        <label className="field-label col-span-2">
          <span className="hidden md:inline">Sub-group</span>
          <select
            className="field-input"
            value={subgroupId}
            onChange={(event) => onSubgroupChange(event.target.value)}
          >
            <option value={ALL_SUBGROUPS_ID}>All sub-groups ({subgroupCounts.get(ALL_SUBGROUPS_ID) ?? 0})</option>
            <option value={UNGROUPED_SUBGROUP_ID}>
              Ungrouped ({subgroupCounts.get(UNGROUPED_SUBGROUP_ID) ?? 0})
            </option>
            {subgroups.map((subgroup) => (
              <option key={subgroup.id} value={subgroup.id}>
                {subgroup.name} ({subgroupCounts.get(subgroup.id) ?? 0})
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
