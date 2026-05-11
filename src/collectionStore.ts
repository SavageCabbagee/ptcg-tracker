import { create } from 'zustand';
import type { CardDraft, CardList, CollectionCard, CollectionFile } from './types';

const defaultList: CardList = {
  id: 'main',
  name: 'Main Collection',
};

type CollectionState = {
  lists: CardList[];
  activeListId: string;
  cards: CollectionCard[];
  isLoaded: boolean;
  loadCollection: (collection: CollectionFile) => void;
  setActiveList: (listId: string) => void;
  addCard: (draft: CardDraft) => void;
  updateCard: (id: string, draft: CardDraft) => void;
  deleteCard: (id: string) => void;
};

const normalizeList = (list: Partial<CardList>): CardList => ({
  id: list.id?.trim() || crypto.randomUUID(),
  name: list.name?.trim() || 'Untitled List',
});

const normalizeCard = (draft: CardDraft, fallbackListId: string): CollectionCard => ({
  id: draft.id?.trim() || crypto.randomUUID(),
  listId: draft.listId?.trim() || fallbackListId,
  name: draft.name.trim(),
  set: draft.set.trim(),
  pokedexNumber:
    draft.pokedexNumber === null ? null : Math.max(1, Math.floor(Number(draft.pokedexNumber) || 0)) || null,
  number: draft.number.trim(),
  count: Math.max(0, Math.floor(Number(draft.count) || 0)),
  variant: draft.variant,
  language: draft.language.trim().toUpperCase(),
  imageUrl: draft.imageUrl.trim(),
  notes: draft.notes.trim(),
});

export const useCollectionStore = create<CollectionState>((set) => ({
  lists: [defaultList],
  activeListId: defaultList.id,
  cards: [],
  isLoaded: false,
  loadCollection: (collection) =>
    set(() => {
      const lists = collection.lists.length > 0 ? collection.lists.map(normalizeList) : [defaultList];
      const fallbackListId = lists[0].id;

      return {
        lists,
        activeListId: fallbackListId,
        cards: collection.cards.map((card) => normalizeCard(card, fallbackListId)).sort(compareCards),
        isLoaded: true,
      };
    }),
  setActiveList: (listId) => set({ activeListId: listId }),
  addCard: (draft) =>
    set((state) => ({
      cards: [...state.cards, normalizeCard(draft, state.activeListId)].sort(compareCards),
    })),
  updateCard: (id, draft) =>
    set((state) => ({
      cards: state.cards
        .map((card) => (card.id === id ? normalizeCard({ ...draft, id }, state.activeListId) : card))
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
