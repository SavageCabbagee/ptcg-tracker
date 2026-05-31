import {
  type CardList,
  type CollectionCard,
  type CollectionFile,
  type CollectionManifestEntry,
  type CollectionManifestFile,
  type DexEntry,
  type SerializedCollection,
} from './types';
import { DEFAULT_LANGUAGE } from './constants';

const legacyDefaultList: CardList = {
  id: 'main',
  name: 'Main Collection',
};

export async function loadSeedCollection(): Promise<CollectionFile> {
  const response = await fetch(dataUrl('collection.json'));

  if (!response.ok) {
    throw new Error(`Could not load collection.json (${response.status})`);
  }

  const input = await response.json();

  if (isCollectionManifest(input)) {
    return loadManifestCollection(input);
  }

  return parseCollection(input);
}

export async function loadDex(): Promise<DexEntry[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/dex.txt`);

  if (!response.ok) {
    throw new Error(`Could not load dex.txt (${response.status})`);
  }

  return parseDex(await response.text());
}

export function parseCollection(input: unknown): CollectionFile {
  if (!input || typeof input !== 'object' || !Array.isArray((input as CollectionFile).cards)) {
    throw new Error('Collection JSON must contain a cards array.');
  }

  const rawLists = (input as Partial<CollectionFile>).lists;
  const parsedLists = Array.isArray(rawLists) ? rawLists.map(parseList) : [legacyDefaultList];
  const lists = parsedLists.filter((list) => list.id !== 'wishlist');
  const fallbackListId = lists[0]?.id || legacyDefaultList.id;

  return {
    lists,
    cards: (input as CollectionFile).cards.map((card) => parseCard(card, fallbackListId, lists)),
  };
}

export async function parseCollectionManifest(
  input: unknown,
  loadCollectionFile: (path: string) => Promise<unknown>,
): Promise<CollectionFile> {
  if (!isCollectionManifest(input)) {
    return parseCollection(input);
  }

  const collections = input.collections.map(parseManifestEntry);

  if (collections.length === 0) {
    throw new Error('Collection manifest must contain at least one collection.');
  }

  const cardsByCollection = await Promise.all(
    collections.map(async (collection) => parseCollectionSubset(await loadCollectionFile(collection.file), collection)),
  );

  return {
    lists: collections.map(({ id, name, file }) => ({ id, name, file })),
    cards: cardsByCollection.flat(),
  };
}

async function loadManifestCollection(input: CollectionManifestFile): Promise<CollectionFile> {
  return parseCollectionManifest(input, async (path) => {
    const response = await fetch(dataUrl(path));

    if (!response.ok) {
      throw new Error(`Could not load ${path} (${response.status})`);
    }

    return response.json();
  });
}

function parseCollectionSubset(input: unknown, list: CardList): CollectionCard[] {
  if (Array.isArray(input)) {
    return input.map((card) => parseCard(card, list.id, [list]));
  }

  if (input && typeof input === 'object' && Array.isArray((input as Partial<CollectionFile>).cards)) {
    return (input as CollectionFile).cards.map((card) => parseCard(card, list.id, [list]));
  }

  throw new Error(`${list.name} must be a card array.`);
}

export function exportCollection(collection: CollectionFile) {
  const payload = JSON.stringify(collection, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'collection.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function serializeSplitCollection(collection: CollectionFile, dataRoot = ''): SerializedCollection {
  const cleanDataRoot = normalizePath(dataRoot);
  const lists = collection.lists.filter((list) => list.id !== 'wishlist');
  const manifest: CollectionManifestFile = {
    collections: lists.map((list) => ({
      id: list.id,
      name: list.name,
      file: list.file || `collections/${list.id}.json`,
    })),
  };
  const files = [
    {
      path: joinPath(cleanDataRoot, 'collection.json'),
      content: `${JSON.stringify(manifest, null, 2)}\n`,
    },
    ...lists.map((list) => ({
      path: joinPath(cleanDataRoot, list.file || `collections/${list.id}.json`),
      content: `${JSON.stringify(
        collection.cards.filter((card) => card.listId === list.id).map(stripListId),
        null,
        2,
      )}\n`,
    })),
  ];

  return { files };
}

export function parseDex(input: string): DexEntry[] {
  return input
    .split('\n')
    .slice(1)
    .map((line) => {
      const [rawNumber, name] = line.trim().split('\t');
      const number = Number(rawNumber);

      if (!Number.isInteger(number) || !name) {
        return null;
      }

      return { number, name };
    })
    .filter((entry): entry is DexEntry => entry !== null);
}

function parseList(input: unknown): CardList {
  const list = input as Partial<CardList>;

  if (!list || typeof list !== 'object') {
    throw new Error('Each list must be an object.');
  }

  return {
    id: stringValue(list.id) || crypto.randomUUID(),
    name: stringValue(list.name) || 'Untitled List',
  };
}

function parseManifestEntry(input: unknown): CollectionManifestEntry {
  const collection = input as Partial<CollectionManifestEntry>;

  if (!collection || typeof collection !== 'object') {
    throw new Error('Each collection must be an object.');
  }

  const id = stringValue(collection.id);
  const file = stringValue(collection.file);

  if (!id) {
    throw new Error('Each collection must have an id.');
  }

  if (!file) {
    throw new Error(`Collection ${id} must have a file.`);
  }

  return {
    id,
    name: stringValue(collection.name) || 'Untitled Collection',
    file,
  };
}

function isCollectionManifest(input: unknown): input is CollectionManifestFile {
  return Boolean(input && typeof input === 'object' && Array.isArray((input as CollectionManifestFile).collections));
}

function dataUrl(path: string) {
  return `${import.meta.env.BASE_URL}data/${path.replace(/^\/+/, '')}`;
}

function normalizePath(path: string) {
  return path.trim().replace(/^\/+|\/+$/g, '');
}

function joinPath(...parts: string[]) {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

function stripListId(card: CollectionCard) {
  const { listId: _listId, ...rest } = card;
  return rest;
}

function parseCard(input: unknown, fallbackListId: string, lists: CardList[]): CollectionCard {
  const card = input as Partial<CollectionCard>;

  if (!card || typeof card !== 'object') {
    throw new Error('Each card must be an object.');
  }

  const listId = stringValue(card.listId);

  return {
    id: stringValue(card.id) || crypto.randomUUID(),
    listId: lists.some((list) => list.id === listId) ? listId : fallbackListId,
    name: requiredString(card.name, 'name'),
    set: requiredString(card.set, 'set'),
    pokedexNumber: numberValue(card.pokedexNumber),
    number: stringValue(card.number),
    count: Math.max(0, Math.floor(Number(card.count) || 0)),
    language: stringValue(card.language).toUpperCase() || DEFAULT_LANGUAGE,
    imageUrl: stringValue(card.imageUrl),
    notes: stringValue(card.notes),
  };
}

function requiredString(value: unknown, field: string) {
  const text = stringValue(value);
  if (!text) {
    throw new Error(`Card ${field} is required.`);
  }
  return text;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
}
