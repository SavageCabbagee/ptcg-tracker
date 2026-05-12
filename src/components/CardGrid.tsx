import { Edit3, ImageOff, Trash2 } from 'lucide-react';
import type { CollectionCard } from '../types';

type CardGridProps = {
  cards: CollectionCard[];
  isLoaded: boolean;
  error: string;
  onEdit: (card: CollectionCard) => void;
  onDelete: (id: string) => void;
};

export function CardGrid({ cards, isLoaded, error, onEdit, onDelete }: CardGridProps) {
  if (!isLoaded && !error) {
    return <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">Loading cards...</p>;
  }

  if (cards.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
        No cards match this list and search.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(128px,1fr))] md:gap-4 xl:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
      {cards.map((card) => (
        <article
          className={`card-tile group cursor-pointer ${card.count === 0 ? 'opacity-60 hover:opacity-85' : ''}`}
          key={card.id}
          role="button"
          tabIndex={0}
          onClick={() => onEdit(card)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onEdit(card);
            }
          }}
        >
          <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-md bg-zinc-800">
            {card.imageUrl ? (
              <img
                className="h-full w-full object-cover"
                src={card.imageUrl}
                alt={`${card.name} card`}
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-500">
                <ImageOff size={34} />
                <span className="text-xs font-medium">No image</span>
              </div>
            )}
            <div className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white sm:right-2 sm:top-2 sm:px-2 sm:py-1 sm:text-xs">
              {card.count === 0 ? 'Wanted' : `x${card.count}`}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/75 to-transparent p-1.5 opacity-100 sm:p-2 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
              <button
                className="image-action"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(card);
                }}
                title={`Edit ${card.name}`}
              >
                <Edit3 size={16} />
              </button>
              <button
                className="image-danger-action"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(card.id);
                }}
                title={`Delete ${card.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="mt-2 min-w-0">
            <h3 className="truncate text-sm font-semibold">{card.name}</h3>
            <p className="truncate text-xs text-zinc-400">{card.set}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
