export const CARD_VARIANTS = ['normal', 'foil', 'reverse'] as const;

export type CardVariant = (typeof CARD_VARIANTS)[number];

export type CardList = {
  id: string;
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
  variant: CardVariant;
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
