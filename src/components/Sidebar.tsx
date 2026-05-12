import { Plus } from 'lucide-react';
import { CountSummary } from './CountSummary';
import { ListNav } from './ListNav';
import type { CardList, CollectionCard } from '../types';

type SidebarProps = {
  lists: CardList[];
  activeListId: string;
  cards: CollectionCard[];
  listCounts: Map<string, number>;
  onChooseList: (listId: string) => void;
  onAddList: () => void;
};

export function Sidebar({ lists, activeListId, cards, listCounts, onChooseList, onAddList }: SidebarProps) {
  const totalWishlisted = cards.filter((card) => card.count === 0).length;

  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-zinc-800 bg-zinc-950 px-4 py-4 lg:block">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Pokemon cards</p>
        <h1 className="mt-1 text-2xl font-semibold">Tracker</h1>
      </div>

      <ListNav
        lists={lists}
        activeListId={activeListId}
        listCounts={listCounts}
        onChooseList={onChooseList}
      />

      <button className="secondary-button mt-3 w-full" type="button" onClick={onAddList}>
        <Plus size={17} />
        Add List
      </button>

      <div className="mt-5 hidden border-t border-zinc-800 pt-4 lg:block">
        <CountSummary
          tracked={cards.length}
          owned={cards.reduce((sum, card) => sum + card.count, 0)}
          wishlisted={totalWishlisted}
        />
      </div>
    </aside>
  );
}
