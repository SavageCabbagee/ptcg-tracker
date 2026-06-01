import { create } from 'zustand';
import type { CardDraft, CardList, CardSubgroup, CollectionCard, CollectionFile } from './types';

const defaultList: CardList = {
  id: 'main',
  name: 'Main Collection',
};

type CollectionState = {
  lists: CardList[];
  activeListId: string;
  cards: CollectionCard[];
  isLoaded: boolean;
  loadCollection: (collection: CollectionFile, preferredListId?: string) => void;
  setActiveList: (listId: string) => void;
  addList: (name: string) => CardList;
  addSubgroup: (listId: string, name: string) => CardSubgroup | null;
  addCard: (draft: CardDraft) => void;
  updateCard: (id: string, draft: CardDraft) => void;
  deleteCard: (id: string) => void;
};

const normalizeList = (list: Partial<CardList>): CardList => ({
  id: list.id?.trim() || crypto.randomUUID(),
  name: list.name?.trim() || 'Untitled List',
  file: list.file?.trim() || undefined,
  subgroups: normalizeSubgroups(list.subgroups),
});

const sortLists = (lists: CardList[]) =>
  [...lists].filter((list) => list.id !== 'wishlist');

const createListId = (name: string, lists: CardList[]) => {
  const baseId =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'list';
  const reservedIds = new Set(['all', 'wishlist', ...lists.map((list) => list.id)]);

  let id = baseId;
  let index = 2;

  while (reservedIds.has(id)) {
    id = `${baseId}-${index}`;
    index += 1;
  }

  return id;
};

const normalizeCard = (draft: CardDraft, fallbackListId: string, lists: CardList[]): CollectionCard => {
  const listId = draft.listId?.trim() || fallbackListId;
  const list = lists.find((candidate) => candidate.id === listId) ?? lists.find((candidate) => candidate.id === fallbackListId);
  const subgroupId = draft.subgroupId?.trim();

  return {
    id: draft.id?.trim() || crypto.randomUUID(),
    listId: list?.id ?? fallbackListId,
    name: draft.name.trim(),
    set: draft.set.trim(),
    pokedexNumber:
      draft.pokedexNumber === null ? null : Math.max(1, Math.floor(Number(draft.pokedexNumber) || 0)) || null,
    number: draft.number.trim(),
    count: Math.max(0, Math.floor(Number(draft.count) || 0)),
    language: draft.language.trim().toUpperCase(),
    imageUrl: draft.imageUrl.trim(),
    notes: draft.notes.trim(),
    subgroupId: list?.subgroups?.some((subgroup) => subgroup.id === subgroupId) ? subgroupId : undefined,
  };
};

export const useCollectionStore = create<CollectionState>((set) => ({
  lists: [defaultList],
  activeListId: defaultList.id,
  cards: [],
  isLoaded: false,
  loadCollection: (collection, preferredListId) =>
    set(() => {
      const lists = sortLists(collection.lists.length > 0 ? collection.lists.map(normalizeList) : [defaultList]);
      const fallbackListId = lists[0].id;
      const activeListId =
        preferredListId && isAllowedActiveList(preferredListId, lists) ? preferredListId : fallbackListId;

      return {
        lists,
        activeListId,
        cards: collection.cards.map((card) => normalizeCard(card, fallbackListId, lists)).sort(compareCards),
        isLoaded: true,
      };
    }),
  setActiveList: (listId) => set({ activeListId: listId }),
  addList: (name) => {
    const listName = name.trim() || 'Untitled List';
    let newList: CardList = { id: 'list', name: listName };

    set((state) => {
      newList = {
        id: createListId(listName, state.lists),
        name: listName,
      };

      return {
        lists: [...state.lists, newList],
        activeListId: newList.id,
      };
    });

    return newList;
  },
  addSubgroup: (listId, name) => {
    const subgroupName = name.trim();

    if (!subgroupName) {
      return null;
    }

    let newSubgroup: CardSubgroup | null = null;

    set((state) => ({
      lists: state.lists.map((list) => {
        if (list.id !== listId) {
          return list;
        }

        const subgroups = list.subgroups ?? [];
        const existing = subgroups.find((subgroup) => subgroup.name.toLowerCase() === subgroupName.toLowerCase());

        if (existing) {
          newSubgroup = existing;
          return list;
        }

        newSubgroup = {
          id: createSubgroupId(subgroupName, subgroups),
          name: subgroupName,
        };

        return {
          ...list,
          subgroups: [...subgroups, newSubgroup],
        };
      }),
    }));

    return newSubgroup;
  },
  addCard: (draft) =>
    set((state) => ({
      cards: [...state.cards, normalizeCard(draft, state.activeListId, state.lists)].sort(compareCards),
    })),
  updateCard: (id, draft) =>
    set((state) => ({
      cards: state.cards
        .map((card) => (card.id === id ? normalizeCard({ ...draft, id }, state.activeListId, state.lists) : card))
        .sort(compareCards),
    })),
  deleteCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== id),
    })),
}));

const compareCards = (a: CollectionCard, b: CollectionCard) =>
  a.set.localeCompare(b.set) ||
  a.number.localeCompare(b.number, undefined, { numeric: true }) ||
  a.name.localeCompare(b.name);

const isAllowedActiveList = (listId: string, lists: CardList[]) =>
  listId === 'all' || listId === 'wishlist' || lists.some((list) => list.id === listId);

const normalizeSubgroups = (subgroups: CardList['subgroups']) => {
  const seen = new Set<string>();
  const normalized = (subgroups ?? [])
    .map((subgroup) => ({
      id: subgroup.id.trim(),
      name: subgroup.name.trim(),
    }))
    .filter((subgroup) => {
      if (!subgroup.id || !subgroup.name || seen.has(subgroup.id)) {
        return false;
      }

      seen.add(subgroup.id);
      return true;
    });

  return normalized.length > 0 ? normalized : undefined;
};

const createSubgroupId = (name: string, subgroups: CardSubgroup[]) => {
  const baseId =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'subgroup';
  const reservedIds = new Set(['all', 'ungrouped', ...subgroups.map((subgroup) => subgroup.id)]);

  let id = baseId;
  let index = 2;

  while (reservedIds.has(id)) {
    id = `${baseId}-${index}`;
    index += 1;
  }

  return id;
};
