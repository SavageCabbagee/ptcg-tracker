import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { compareBySortKey, getDexSuggestions, matchesCardQuery } from './cardUtils';
import { CardFormModal } from './components/CardFormModal';
import { CardGrid } from './components/CardGrid';
import { CountSummary } from './components/CountSummary';
import { MobileHeader } from './components/MobileHeader';
import { SearchSortBar } from './components/SearchSortBar';
import { Sidebar } from './components/Sidebar';
import { createEmptyDraft } from './constants';
import { loadDex, loadSeedCollection } from './collectionIO';
import { useCollectionStore } from './collectionStore';
import type { CardDraft, CardList, CollectionCard, DexEntry, SortKey } from './types';

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
    addList,
    addCard,
    updateCard,
    deleteCard,
  } = useCollectionStore();
  const [draft, setDraft] = useState<CardDraft>(() => createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isListFormOpen, setIsListFormOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('pokedex');
  const [dexEntries, setDexEntries] = useState<DexEntry[]>([]);
  const [status, setStatus] = useState('Loading collection data...');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSeedCollection()
      .then((collection) => {
        loadCollection(collection);
        setStatus(`Loaded ${collection.cards.length} cards from collection data`);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Could not load collection.json.');
        setStatus('');
      });
  }, [loadCollection]);

  useEffect(() => {
    loadDex()
      .then(setDexEntries)
      .catch(() => {
        setDexEntries([]);
      });
  }, []);

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
  const totalWishlisted = activeCards.filter((card) => card.count === 0).length;
  const activeListSummary = {
    tracked: activeCards.length,
    owned: totalOwned,
    wishlisted: totalWishlisted,
  };

  const visibleCards = useMemo(() => {
    return activeCards
      .filter((card) => matchesCardQuery(card, query))
      .sort((a, b) => compareBySortKey(a, b, sortKey));
  }, [activeCards, query, sortKey]);

  const dexSuggestions = useMemo(
    () =>
      isFormOpen &&
      !dexEntries.some((entry) => entry.number === draft.pokedexNumber && entry.name === draft.name.trim())
        ? getDexSuggestions(draft.name, dexEntries)
        : [],
    [dexEntries, draft.name, draft.pokedexNumber, isFormOpen],
  );

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

  function openListForm() {
    setListName('');
    setError('');
    setIsListFormOpen(true);
  }

  function closeListForm() {
    setListName('');
    setIsListFormOpen(false);
  }

  function handleListSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!listName.trim()) {
      setError('List name is required.');
      return;
    }

    const list = addList(listName);
    setStatus(`Added ${list.name}`);
    setIsListMenuOpen(false);
    closeListForm();
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

  function chooseDexSuggestion(entry: DexEntry) {
    setDraft((current) => ({
      ...current,
      name: entry.name,
      pokedexNumber: entry.number,
    }));
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
          onAddList={openListForm}
        />

        <section className="min-w-0 px-4 pb-4 sm:px-6 lg:px-8">
          <div className="sticky top-0 z-20 -mx-4 border-b border-zinc-800 bg-zinc-950 px-4 pt-3 shadow-lg shadow-black/30 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:pt-4">
            <MobileHeader
              title={activeList?.name ?? 'Collection'}
              summary={activeListSummary}
              lists={navLists}
              activeListId={activeListId}
              isOpen={isListMenuOpen}
              listCounts={listCounts}
              onToggle={() => setIsListMenuOpen((current) => !current)}
              onChooseList={chooseList}
              onAddList={openListForm}
            />

            <header className="hidden flex-col gap-2 pb-3 md:flex md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="hidden text-3xl font-semibold lg:block">{activeList?.name ?? 'Collection'}</h2>
              </div>
            </header>

            <SearchSortBar
              query={query}
              sortKey={sortKey}
              onQueryChange={setQuery}
              onSortChange={setSortKey}
            />
          </div>

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
          dexSuggestions={dexSuggestions}
          onDraftChange={setDraft}
          onDexSuggestionSelect={chooseDexSuggestion}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      {isListFormOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/70 p-3 sm:items-center sm:justify-center"
          onClick={closeListForm}
        >
          <form
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:max-w-sm"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleListSubmit}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Add List</h2>
              <button className="icon-button" type="button" onClick={closeListForm} title="Close">
                <X size={18} />
              </button>
            </div>

            <label className="field-label">
              Name
              <input
                autoFocus
                className="field-input"
                value={listName}
                onChange={(event) => setListName(event.target.value)}
              />
            </label>

            <button className="primary-button mt-4 w-full" type="submit">
              <Plus size={18} />
              Add List
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
