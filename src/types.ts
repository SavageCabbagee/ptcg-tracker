export type CardList = {
  id: string;
  name: string;
};

export type DexEntry = {
  number: number;
  name: string;
};

export type CollectionCard = {
  id: string;
  listId: string;
  name: string;
  set: string;
  pokedexNumber: number | null;
  number: string;
  count: number;
  language: string;
  imageUrl: string;
  notes: string;
};

export type CollectionFile = {
  lists: CardList[];
  cards: CollectionCard[];
};

export type CardDraft = Omit<CollectionCard, 'id'> & {
  id?: string;
};

export type SortKey = 'name' | 'set' | 'number' | 'count';
