import { Menu } from 'lucide-react';
import { ListNav } from './ListNav';
import type { CardList } from '../types';

type MobileHeaderProps = {
  title: string;
  lists: CardList[];
  activeListId: string;
  isOpen: boolean;
  listCounts: Map<string, number>;
  onToggle: () => void;
  onChooseList: (listId: string) => void;
};

export function MobileHeader({
  title,
  lists,
  activeListId,
  isOpen,
  listCounts,
  onToggle,
  onChooseList,
}: MobileHeaderProps) {
  return (
    <header className="mb-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-sm lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Pokemon cards</p>
          <h1 className="truncate text-xl font-semibold">{title}</h1>
        </div>
        <button className="icon-button" type="button" onClick={onToggle} title="Choose list">
          <Menu size={20} />
        </button>
      </div>

      {isOpen && (
        <div className="mt-3">
          <ListNav
            lists={lists}
            activeListId={activeListId}
            listCounts={listCounts}
            onChooseList={onChooseList}
          />
        </div>
      )}
    </header>
  );
}
