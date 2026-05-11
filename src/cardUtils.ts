import type { CollectionCard, SortKey } from './types';

export function compareBySortKey(a: CollectionCard, b: CollectionCard, sortKey: SortKey) {
  if (sortKey === 'count') {
    return b.count - a.count || a.name.localeCompare(b.name);
  }

  return a[sortKey].localeCompare(b[sortKey], undefined, { numeric: true }) || a.name.localeCompare(b.name);
}

export function variantLabel(variant: string) {
  if (variant === 'foil') return 'Foil';
  if (variant === 'reverse') return 'Reverse';
  return 'Normal';
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
