import type { CardList } from '../types';

type ListNavProps = {
  lists: CardList[];
  activeListId: string;
  listCounts: Map<string, number>;
  onChooseList: (listId: string) => void;
};

export function ListNav({ lists, activeListId, listCounts, onChooseList }: ListNavProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {lists.map((list) => (
        <button
          className={`list-button ${list.id === activeListId ? 'list-button-active' : ''}`}
          key={list.id}
          type="button"
          onClick={() => onChooseList(list.id)}
        >
          <span className="truncate">{list.name}</span>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">
            {listCounts.get(list.id) ?? 0}
          </span>
        </button>
      ))}
    </nav>
  );
}
