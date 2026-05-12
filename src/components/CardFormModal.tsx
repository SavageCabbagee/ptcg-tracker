import { FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { TextField } from './TextField';
import { type CardDraft, type CardList, type DexEntry } from '../types';

type CardFormModalProps = {
  draft: CardDraft;
  editingId: string | null;
  lists: CardList[];
  dexSuggestions: DexEntry[];
  onDraftChange: (draft: CardDraft) => void;
  onDexSuggestionSelect: (entry: DexEntry) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function CardFormModal({
  draft,
  editingId,
  lists,
  dexSuggestions,
  onDraftChange,
  onDexSuggestionSelect,
  onSubmit,
  onClose,
}: CardFormModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/70 p-3 sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <form
        className="max-h-[92vh] w-full overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:max-w-xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit Card' : 'Add Card'}</h2>
          <button className="icon-button" type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3">
          <label className="field-label">
            {editingId ? 'Move to List' : 'List'}
            <select
              className="field-input"
              value={draft.listId}
              onChange={(event) => onDraftChange({ ...draft, listId: event.target.value })}
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </label>
          <div className="field-label">
            <label htmlFor="card-name">Name</label>
            <span className="relative">
              <input
                autoComplete="off"
                className="field-input"
                id="card-name"
                required
                value={draft.name}
                onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              />
              {dexSuggestions.length > 0 && (
                <span className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 overflow-hidden rounded-md border border-zinc-700 bg-zinc-950 shadow-xl">
                  {dexSuggestions.map((entry) => (
                    <button
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none"
                      key={entry.number}
                      type="button"
                      onClick={() => onDexSuggestionSelect(entry)}
                    >
                      <span className="truncate">{entry.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-zinc-500">
                        #{entry.number.toString().padStart(3, '0')}
                      </span>
                    </button>
                  ))}
                </span>
              )}
            </span>
          </div>
          <TextField label="Set" value={draft.set} onChange={(set) => onDraftChange({ ...draft, set })} required />
          <TextField
            label="Image URL"
            value={draft.imageUrl}
            onChange={(imageUrl) => onDraftChange({ ...draft, imageUrl })}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="field-label">
              Pokedex No.
              <input
                className="field-input"
                min={1}
                type="number"
                value={draft.pokedexNumber ?? ''}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    pokedexNumber: event.target.value ? Number(event.target.value) : null,
                  })
                }
              />
            </label>
            <TextField label="Number" value={draft.number} onChange={(number) => onDraftChange({ ...draft, number })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Language"
              value={draft.language}
              onChange={(language) => onDraftChange({ ...draft, language })}
            />
            <label className="field-label">
              Count
              <input
                className="field-input"
                min={0}
                type="number"
                value={draft.count}
                onChange={(event) => onDraftChange({ ...draft, count: Number(event.target.value) })}
              />
            </label>
          </div>
          <label className="field-label">
            Notes
            <textarea
              className="field-input min-h-20 resize-y"
              value={draft.notes}
              onChange={(event) => onDraftChange({ ...draft, notes: event.target.value })}
            />
          </label>
        </div>

        <button className="primary-button mt-4 w-full" type="submit">
          <Plus size={18} />
          {editingId ? 'Save Changes' : 'Add Card'}
        </button>
      </form>
    </div>
  );
}
