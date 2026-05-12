import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { compareBySortKey, matchesCardQuery } from './cardUtils';
import { CardFormModal } from './components/CardFormModal';
import { CardGrid } from './components/CardGrid';
import { MobileHeader } from './components/MobileHeader';
import { SearchSortBar } from './components/SearchSortBar';
import { Sidebar } from './components/Sidebar';
import { createEmptyDraft } from './constants';
import { loadSeedCollection } from './collectionIO';
import { useCollectionStore } from './collectionStore';
import type { CardDraft, CardList, CollectionCard, SortKey } from './types';

const ALL_VIEW_ID = 'all';
const WISHLIST_VIEW_ID = 'wishlist';

const allCardsList: CardList = { id: ALL_VIEW_ID, name: 'All Cards' };
const wishlistList: CardList = { id: WISHLIST_VIEW_ID, name: 'Wishlist' };

export function App() {
  const {
    lists,
    activeListId,
    cards,
    isLoaded,
    loadCollection,
    setActiveList,
    addCard,
    updateCard,
    deleteCard,
  } = useCollectionStore();
  const [draft, setDraft] = useState<CardDraft>(() => createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('number');
  const [status, setStatus] = useState('Loading collection.json...');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSeedCollection()
      .then((collection) => {
        loadCollection(collection);
        setStatus(`Loaded ${collection.cards.length} cards from collection.json`);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Could not load collection.json.');
        setStatus('');
      });
  }, [loadCollection]);

  const navLists = useMemo(() => [allCardsList, ...lists, wishlistList], [lists]);
  const fallbackListId = lists[0]?.id ?? 'main';
  const activeList = navLists.find((list) => list.id === activeListId) ?? navLists[0];
  const activeCards = useMemo(() => {
    if (activeListId === ALL_VIEW_ID) {
      return cards;
    }

    if (activeListId === WISHLIST_VIEW_ID) {
      return cards.filter((card) => card.count === 0);
    }

    return cards.filter((card) => card.listId === activeListId);
  }, [activeListId, cards]);
  const totalOwned = activeCards.reduce((sum, card) => sum + card.count, 0);

  const visibleCards = useMemo(() => {
    return activeCards
      .filter((card) => matchesCardQuery(card, query))
      .sort((a, b) => compareBySortKey(a, b, sortKey));
  }, [activeCards, query, sortKey]);

  const listCounts = useMemo(() => {
    return new Map(
      navLists.map((list) => {
        if (list.id === ALL_VIEW_ID) {
          return [list.id, cards.length];
        }

        if (list.id === WISHLIST_VIEW_ID) {
          return [list.id, cards.filter((card) => card.count === 0).length];
        }

        return [list.id, cards.filter((card) => card.listId === list.id).length];
      }),
    );
  }, [cards, navLists]);

  function openAddForm() {
    setEditingId(null);
    setDraft(createEmptyDraft(lists.some((list) => list.id === activeListId) ? activeListId : fallbackListId));
    setIsFormOpen(true);
  }

  function chooseList(listId: string) {
    setActiveList(listId);
    setIsListMenuOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!draft.name.trim() || !draft.set.trim()) {
      setError('Name and set are required.');
      return;
    }

    if (editingId) {
      updateCard(editingId, draft);
      setStatus(`Updated ${draft.name.trim()}`);
    } else {
      addCard({ ...draft, listId: draft.listId || fallbackListId });
      setStatus(`Added ${draft.name.trim()}`);
    }

    closeForm();
  }

  function startEditing(card: CollectionCard) {
    setEditingId(card.id);
    setDraft(card);
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingId(null);
    setDraft(createEmptyDraft(lists.some((list) => list.id === activeListId) ? activeListId : fallbackListId));
    setIsFormOpen(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <Sidebar
          lists={navLists}
          activeListId={activeListId}
          cards={cards}
          listCounts={listCounts}
          onChooseList={chooseList}
        />

        <section className="min-w-0 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <MobileHeader
            title={activeList?.name ?? 'Collection'}
            lists={navLists}
            activeListId={activeListId}
            isOpen={isListMenuOpen}
            listCounts={listCounts}
            onToggle={() => setIsListMenuOpen((current) => !current)}
            onChooseList={chooseList}
          />

          <header className="hidden flex-col gap-2 pb-3 md:flex md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="hidden text-3xl font-semibold lg:block">{activeList?.name ?? 'Collection'}</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {visibleCards.length} shown · {activeCards.length} unique · {totalOwned} owned
              </p>
            </div>
          </header>

          {(status || error) && (
            <section className="mb-4 hidden flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between md:flex">
              {status && <p className="text-zinc-400">{status}</p>}
              {error && <p className="font-medium text-red-400">{error}</p>}
            </section>
          )}

          <SearchSortBar
            query={query}
            sortKey={sortKey}
            onQueryChange={setQuery}
            onSortChange={setSortKey}
          />

          <CardGrid
            cards={visibleCards}
            isLoaded={isLoaded}
            error={error}
            onEdit={startEditing}
            onDelete={deleteCard}
          />
        </section>
      </div>

      <button className="floating-add-button" type="button" onClick={openAddForm} title="Add card">
        <Plus size={26} />
      </button>

      {isFormOpen && (
        <CardFormModal
          draft={draft}
          editingId={editingId}
          lists={lists}
          onDraftChange={setDraft}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}
    </main>
  );
}
