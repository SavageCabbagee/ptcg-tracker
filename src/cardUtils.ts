import type { CollectionCard, DexEntry, SortKey } from './types';

export function compareBySortKey(a: CollectionCard, b: CollectionCard, sortKey: SortKey) {
  if (sortKey === 'count') {
    return b.count - a.count || a.name.localeCompare(b.name);
  }

  if (sortKey === 'number') {
    return compareByPokedexNumber(a, b);
  }

  return a[sortKey].localeCompare(b[sortKey], undefined, { numeric: true }) || a.name.localeCompare(b.name);
}

function compareByPokedexNumber(a: CollectionCard, b: CollectionCard) {
  if (a.pokedexNumber !== null && b.pokedexNumber !== null) {
    return a.pokedexNumber - b.pokedexNumber || a.name.localeCompare(b.name);
  }

  if (a.pokedexNumber !== null) return -1;
  if (b.pokedexNumber !== null) return 1;

  return a.number.localeCompare(b.number, undefined, { numeric: true }) || a.name.localeCompare(b.name);
}

export function matchesCardQuery(card: CollectionCard, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [card.name, card.set, card.number, card.pokedexNumber?.toString() ?? ''].some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

export function getDexSuggestions(query: string, dexEntries: DexEntry[], limit = 5) {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return dexEntries
    .map((entry) => ({
      entry,
      score: scoreDexEntry(normalizedQuery, normalizeSearchText(entry.name), entry.number.toString()),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.number - b.entry.number)
    .slice(0, limit)
    .map((match) => match.entry);
}

function scoreDexEntry(query: string, name: string, number: string) {
  if (number === query) return 120;
  if (name === query) return 110;
  if (name.startsWith(query)) return 95 - name.length / 100;
  if (name.includes(query)) return 80 - name.indexOf(query);

  const acronym = name
    .split(' ')
    .map((part) => part[0])
    .join('');

  if (acronym.startsWith(query)) return 65;

  return isSubsequence(query, name) ? 45 - (name.length - query.length) / 100 : 0;
}

function isSubsequence(query: string, value: string) {
  let queryIndex = 0;

  for (const character of value) {
    if (character === query[queryIndex]) {
      queryIndex += 1;
    }

    if (queryIndex === query.length) {
      return true;
    }
  }

  return false;
}

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
