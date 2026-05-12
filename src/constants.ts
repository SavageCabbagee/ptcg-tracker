import type { CardDraft } from './types';

export const DEFAULT_LANGUAGE = 'JP';

export const createEmptyDraft = (listId = 'main'): CardDraft => ({
  listId,
  name: '',
  set: '',
  pokedexNumber: null,
  number: '',
  count: 1,
  language: DEFAULT_LANGUAGE,
  imageUrl: '',
  notes: '',
});
