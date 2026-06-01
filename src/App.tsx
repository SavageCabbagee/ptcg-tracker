import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { compareBySortKey, getDexSuggestions, matchesCardQuery } from './cardUtils';
import { CardFormModal } from './components/CardFormModal';
import { CardGrid } from './components/CardGrid';
import { CountSummary } from './components/CountSummary';
import { GitHubStoragePanel } from './components/GitHubStoragePanel';
import { MobileHeader } from './components/MobileHeader';
import { SearchSortBar } from './components/SearchSortBar';
import { Sidebar } from './components/Sidebar';
import { ALL_SUBGROUPS_ID, UNGROUPED_SUBGROUP_ID, createEmptyDraft } from './constants';
import { loadDex, loadSeedCollection } from './collectionIO';
import { useCollectionStore } from './collectionStore';
import {
  isGitHubConfigComplete,
  loadGitHubCollection,
  normalizeGitHubConfig,
  saveGitHubCollection,
} from './githubStorage';
import type {
  CardDraft,
  CardList,
  CollectionCard,
  DexEntry,
  GitHubStorageConfig,
  GitHubStorageSession,
  SortKey,
} from './types';

const ALL_VIEW_ID = 'all';
const WISHLIST_VIEW_ID = 'wishlist';
const activeListStorageKey = 'ptcg-tracker.active-list';
const githubConfigStorageKey = 'ptcg-tracker.github.config';
const githubTokenStorageKey = 'ptcg-tracker.github.token';

const allCardsList: CardList = { id: ALL_VIEW_ID, name: 'All Cards' };
const wishlistList: CardList = { id: WISHLIST_VIEW_ID, name: 'Wishlist' };
const defaultGitHubConfig: GitHubStorageConfig = {
  owner: '',
  repo: '',
  branch: 'main',
  dataRoot: '',
};

export function App() {
  const {
    lists,
    activeListId,
    cards,
    isLoaded,
    loadCollection,
    setActiveList,
    addList,
    addSubgroup,
    addCard,
    updateCard,
    deleteCard,
  } = useCollectionStore();
  const [draft, setDraft] = useState<CardDraft>(() => createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<CollectionCard | null>(null);
  const [isListFormOpen, setIsListFormOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('pokedex');
  const [activeSubgroupId, setActiveSubgroupId] = useState(ALL_SUBGROUPS_ID);
  const [dexEntries, setDexEntries] = useState<DexEntry[]>([]);
  const [status, setStatus] = useState('Loading collection data...');
  const [error, setError] = useState('');
  const [githubConfig, setGitHubConfig] = useState<GitHubStorageConfig>(loadStoredGitHubConfig);
  const [githubToken, setGitHubToken] = useState(loadStoredGitHubToken);
  const [githubSession, setGitHubSession] = useState<GitHubStorageSession | null>(null);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [storageStatus, setStorageStatus] = useState('');
  const [storageAction, setStorageAction] = useState<'idle' | 'loading' | 'saving'>('idle');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadSeedCollection()
      .then((collection) => {
        loadCollection(collection, loadStoredActiveListId());
        setIsDirty(false);
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

  useEffect(() => {
    localStorage.setItem(githubConfigStorageKey, JSON.stringify(normalizeGitHubConfig(githubConfig)));
  }, [githubConfig]);

  useEffect(() => {
    if (githubToken.trim()) {
      localStorage.setItem(githubTokenStorageKey, githubToken);
      return;
    }

    localStorage.removeItem(githubTokenStorageKey);
  }, [githubToken]);

  useEffect(() => {
    if (isLoaded && activeListId) {
      localStorage.setItem(activeListStorageKey, activeListId);
    }
  }, [activeListId, isLoaded]);

  const navLists = useMemo(() => [allCardsList, ...lists, wishlistList], [lists]);
  const fallbackListId = lists[0]?.id ?? 'main';
  const activeList = navLists.find((list) => list.id === activeListId) ?? navLists[0];
  const activeCollection = lists.find((list) => list.id === activeListId);
  const activeSubgroups = useMemo(
    () =>
      [...(activeCollection?.subgroups ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [activeCollection],
  );
  const baseActiveCards = useMemo(() => {
    if (activeListId === ALL_VIEW_ID) {
      return cards;
    }

    if (activeListId === WISHLIST_VIEW_ID) {
      return cards.filter((card) => card.count === 0);
    }

    return cards.filter((card) => card.listId === activeListId);
  }, [activeListId, cards]);
  const activeCards = useMemo(() => {
    if (!activeCollection || activeSubgroupId === ALL_SUBGROUPS_ID) {
      return baseActiveCards;
    }

    if (activeSubgroupId === UNGROUPED_SUBGROUP_ID) {
      return baseActiveCards.filter((card) => !card.subgroupId);
    }

    return baseActiveCards.filter((card) => card.subgroupId === activeSubgroupId);
  }, [activeCollection, activeSubgroupId, baseActiveCards]);
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
  const subgroupCounts = useMemo(() => {
    const counts = new Map<string, number>([
      [ALL_SUBGROUPS_ID, baseActiveCards.length],
      [UNGROUPED_SUBGROUP_ID, baseActiveCards.filter((card) => !card.subgroupId).length],
    ]);

    activeSubgroups.forEach((subgroup) => {
      counts.set(subgroup.id, baseActiveCards.filter((card) => card.subgroupId === subgroup.id).length);
    });

    return counts;
  }, [activeSubgroups, baseActiveCards]);
  const normalizedGitHubConfig = useMemo(() => normalizeGitHubConfig(githubConfig), [githubConfig]);
  const canSyncGitHub = isGitHubConfigComplete(normalizedGitHubConfig, githubToken);
  const isStorageBusy = storageAction !== 'idle';

  useEffect(() => {
    if (
      activeSubgroupId !== ALL_SUBGROUPS_ID &&
      activeSubgroupId !== UNGROUPED_SUBGROUP_ID &&
      !activeSubgroups.some((subgroup) => subgroup.id === activeSubgroupId)
    ) {
      setActiveSubgroupId(ALL_SUBGROUPS_ID);
    }
  }, [activeSubgroupId, activeSubgroups]);

  const loadFromGitHub = useCallback(
    async (config: GitHubStorageConfig, token: string, source: 'auto' | 'manual') => {
      setStorageAction('loading');
      setError('');
      setStorageStatus(source === 'auto' ? 'Loading saved GitHub storage...' : 'Loading from GitHub...');

      try {
        const { collection, session } = await loadGitHubCollection(config, token);
        loadCollection(collection, loadStoredActiveListId());
        setGitHubSession(session);
        setIsDirty(false);
        setStatus(`Loaded ${collection.cards.length} cards from GitHub`);
        setStorageStatus(`Loaded ${config.owner}/${config.repo}@${config.branch}`);
      } catch (reason: unknown) {
        const message = reason instanceof Error ? reason.message : 'Could not load from GitHub.';
        setError(message);
        setStorageStatus(source === 'auto' ? `Auto-load failed: ${message}` : message);
      } finally {
        setStorageAction('idle');
      }
    },
    [loadCollection],
  );

  useEffect(() => {
    const config = normalizeGitHubConfig(loadStoredGitHubConfig());
    const token = loadStoredGitHubToken().trim();

    if (!isGitHubConfigComplete(config, token)) {
      return;
    }

    void loadFromGitHub(config, token, 'auto');
  }, [loadFromGitHub]);

  function updateGitHubConfig(config: GitHubStorageConfig) {
    setGitHubConfig(config);
    setGitHubSession(null);
  }

  function updateGitHubToken(token: string) {
    setGitHubToken(token);
    setGitHubSession(null);
  }

  async function handleGitHubLoad() {
    if (!canSyncGitHub || isStorageBusy) {
      return;
    }

    if (isDirty && !window.confirm('Load from GitHub and replace unsaved local changes?')) {
      return;
    }

    void loadFromGitHub(normalizedGitHubConfig, githubToken.trim(), 'manual');
  }

  async function handleGitHubSave() {
    if (!canSyncGitHub || isStorageBusy || !isDirty) {
      return;
    }

    setStorageAction('saving');
    setError('');
    setStorageStatus('Saving to GitHub...');

    try {
      const session = await saveGitHubCollection(
        normalizedGitHubConfig,
        githubToken.trim(),
        { lists, cards },
        githubSession,
      );
      setGitHubSession(session);
      setIsDirty(false);
      setStatus('Saved collection data to GitHub');
      setStorageStatus(`Saved commit ${session.commitSha.slice(0, 7)} to ${normalizedGitHubConfig.branch}`);
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : 'Could not save to GitHub.';
      setError(message);
      setStorageStatus(message);
    } finally {
      setStorageAction('idle');
    }
  }

  function disconnectGitHub() {
    localStorage.removeItem(githubConfigStorageKey);
    localStorage.removeItem(githubTokenStorageKey);
    setGitHubConfig(defaultGitHubConfig);
    setGitHubToken('');
    setGitHubSession(null);
    setStorageStatus('Disconnected GitHub storage');
  }

  function openAddForm() {
    const listId = lists.some((list) => list.id === activeListId) ? activeListId : fallbackListId;
    const subgroupId =
      activeSubgroupId !== ALL_SUBGROUPS_ID && activeSubgroupId !== UNGROUPED_SUBGROUP_ID ? activeSubgroupId : '';

    setEditingId(null);
    setDraft({ ...createEmptyDraft(listId), subgroupId });
    setIsFormOpen(true);
  }

  function chooseList(listId: string) {
    setActiveList(listId);
    setActiveSubgroupId(ALL_SUBGROUPS_ID);
    localStorage.setItem(activeListStorageKey, listId);
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
    setIsDirty(true);
    setStatus(`Added ${list.name}`);
    setIsListMenuOpen(false);
    closeListForm();
  }

  function handleAddSubgroup(listId: string, name: string) {
    const subgroup = addSubgroup(listId, name);

    if (!subgroup) {
      return;
    }

    setDraft((current) => ({ ...current, listId, subgroupId: subgroup.id }));
    setActiveSubgroupId(subgroup.id);
    setIsDirty(true);
    setStatus(`Added ${subgroup.name}`);
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
      setIsDirty(true);
      setStatus(`Updated ${draft.name.trim()}`);
    } else {
      addCard({ ...draft, listId: draft.listId || fallbackListId });
      setIsDirty(true);
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
    const listId = lists.some((list) => list.id === activeListId) ? activeListId : fallbackListId;

    setEditingId(null);
    setDraft(createEmptyDraft(listId));
    setIsFormOpen(false);
  }

  function requestDelete(card: CollectionCard) {
    setDeletingCard(card);
  }

  function closeDeleteConfirm() {
    setDeletingCard(null);
  }

  function confirmDelete() {
    if (!deletingCard) {
      return;
    }

    deleteCard(deletingCard.id);
    setIsDirty(true);
    setStatus(`Deleted ${deletingCard.name}`);
    closeDeleteConfirm();
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
              subgroups={activeSubgroups}
              subgroupId={activeSubgroupId}
              subgroupCounts={subgroupCounts}
              onQueryChange={setQuery}
              onSortChange={setSortKey}
              onSubgroupChange={setActiveSubgroupId}
            />

            <GitHubStoragePanel
              config={githubConfig}
              token={githubToken}
              isOpen={isStorageOpen}
              isBusy={isStorageBusy}
              canSync={canSyncGitHub}
              isDirty={isDirty}
              storageStatus={storageStatus}
              onToggle={() => setIsStorageOpen((current) => !current)}
              onConfigChange={updateGitHubConfig}
              onTokenChange={updateGitHubToken}
              onLoad={handleGitHubLoad}
              onSave={handleGitHubSave}
              onDisconnect={disconnectGitHub}
            />
          </div>

          <CardGrid
            cards={visibleCards}
            isLoaded={isLoaded}
            error={error}
            onEdit={startEditing}
            onDelete={requestDelete}
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
          onAddSubgroup={handleAddSubgroup}
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

      {deletingCard && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 sm:items-center sm:justify-center"
          onClick={closeDeleteConfirm}
        >
          <div
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:max-w-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-card-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" id="delete-card-title">
                Delete Card
              </h2>
              <button className="icon-button" type="button" onClick={closeDeleteConfirm} title="Close">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-zinc-300">
              Delete <span className="font-semibold text-zinc-100">{deletingCard.name}</span> from your collection?
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="secondary-button" type="button" onClick={closeDeleteConfirm}>
                Cancel
              </button>
              <button className="danger-button w-full gap-2 px-3" type="button" onClick={confirmDelete}>
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function loadStoredGitHubConfig(): GitHubStorageConfig {
  try {
    const input = localStorage.getItem(githubConfigStorageKey);

    if (!input) {
      return defaultGitHubConfig;
    }

    return normalizeGitHubConfig({ ...defaultGitHubConfig, ...(JSON.parse(input) as Partial<GitHubStorageConfig>) });
  } catch {
    return defaultGitHubConfig;
  }
}

function loadStoredGitHubToken() {
  return localStorage.getItem(githubTokenStorageKey) ?? '';
}

function loadStoredActiveListId() {
  return localStorage.getItem(activeListStorageKey) ?? undefined;
}
