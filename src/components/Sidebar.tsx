import { ListNav } from './ListNav';
import type { CardList, CollectionCard } from '../types';

type SidebarProps = {
  lists: CardList[];
  activeListId: string;
  cards: CollectionCard[];
  listCounts: Map<string, number>;
  onChooseList: (listId: string) => void;
};

export function Sidebar({ lists, activeListId, cards, listCounts, onChooseList }: SidebarProps) {
  return (
    <aside className="hidden border-r border-zinc-800 bg-zinc-950 px-4 py-4 lg:block">
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

      <div className="mt-5 hidden border-t border-zinc-800 pt-4 text-sm text-zinc-400 lg:block">
        <p>{cards.length} unique cards</p>
        <p>{cards.reduce((sum, card) => sum + card.count, 0)} total owned</p>
      </div>
    </aside>
  );
}
