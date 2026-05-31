export type CardList = {
  id: string;
  name: string;
  file?: string;
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

export type CollectionManifestEntry = CardList & {
  file: string;
};

export type CollectionManifestFile = {
  collections: CollectionManifestEntry[];
};

export type SerializedCollectionFile = {
  path: string;
  content: string;
};

export type SerializedCollection = {
  files: SerializedCollectionFile[];
};

export type GitHubStorageConfig = {
  owner: string;
  repo: string;
  branch: string;
  dataRoot: string;
};

export type GitHubStorageSession = {
  commitSha: string;
  treeSha: string;
};

export type CardDraft = Omit<CollectionCard, 'id'> & {
  id?: string;
};

export type SortKey = 'name' | 'set' | 'pokedex' | 'cardNumber' | 'count';
