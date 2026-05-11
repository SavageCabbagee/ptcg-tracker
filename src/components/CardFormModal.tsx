import { FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { variantLabel } from '../cardUtils';
import { TextField } from './TextField';
import { CARD_VARIANTS, type CardDraft, type CardList } from '../types';

type CardFormModalProps = {
  draft: CardDraft;
  editingId: string | null;
  lists: CardList[];
  onDraftChange: (draft: CardDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function CardFormModal({
  draft,
  editingId,
  lists,
  onDraftChange,
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
          <TextField label="Name" value={draft.name} onChange={(name) => onDraftChange({ ...draft, name })} required />
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
            <label className="field-label">
              Variant
              <select
                className="field-input"
                value={draft.variant}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    variant: event.target.value as CardDraft['variant'],
                  })
                }
              >
                {CARD_VARIANTS.map((variant) => (
                  <option key={variant} value={variant}>
                    {variantLabel(variant)}
                  </option>
                ))}
              </select>
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
