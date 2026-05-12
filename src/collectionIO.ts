import {
  CARD_VARIANTS,
  type CardList,
  type CardVariant,
  type CollectionCard,
  type CollectionFile,
} from './types';
import { DEFAULT_LANGUAGE } from './constants';

const legacyDefaultList: CardList = {
  id: 'main',
  name: 'Main Collection',
};

export async function loadSeedCollection(): Promise<CollectionFile> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/collection.json`);

  if (!response.ok) {
    throw new Error(`Could not load collection.json (${response.status})`);
  }

  return parseCollection(await response.json());
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

function parseCard(input: unknown, fallbackListId: string, lists: CardList[]): CollectionCard {
  const card = input as Partial<CollectionCard>;

  if (!card || typeof card !== 'object') {
    throw new Error('Each card must be an object.');
  }

  const variant: CardVariant = CARD_VARIANTS.includes(card.variant as CardVariant)
    ? (card.variant as CardVariant)
    : 'normal';

  const listId = stringValue(card.listId);

  return {
    id: stringValue(card.id) || crypto.randomUUID(),
    listId: lists.some((list) => list.id === listId) ? listId : fallbackListId,
    name: requiredString(card.name, 'name'),
    set: requiredString(card.set, 'set'),
    pokedexNumber: numberValue(card.pokedexNumber),
    number: stringValue(card.number),
    count: Math.max(0, Math.floor(Number(card.count) || 0)),
    variant,
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
