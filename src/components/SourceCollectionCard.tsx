import { FolderOpen, Pencil, Plus, X } from "lucide-react";
import type { SourceCollection } from "../models/research";

interface SourceCollectionCardProps {
  collection: SourceCollection;
  onEdit?: () => void;
  /** Called when a source should be removed from the collection. */
  onRemoveSource?: (sourceId: string) => void;
  /** Called when the user wants to add a source to the collection. */
  onAddSource?: () => void;
}

/** Card summarizing a named, curated collection of sources. */
export default function SourceCollectionCard({
  collection,
  onEdit,
  onRemoveSource,
  onAddSource,
}: SourceCollectionCardProps) {
  return (
    <article className="card p-4" aria-label={`Source collection: ${collection.name}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-800">{collection.name}</h3>
            {collection.description && (
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{collection.description}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="badge bg-slate-100 text-slate-600">
            {collection.sources.length} source{collection.sources.length === 1 ? "" : "s"}
          </span>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label={`Edit collection ${collection.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {collection.sources.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
          This collection is empty.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5" role="list">
          {collection.sources.map((source) => (
            <li
              key={source.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5"
            >
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-xs text-slate-700 hover:text-blue-600"
              >
                {source.title}
              </a>
              {onRemoveSource && (
                <button
                  type="button"
                  onClick={() => onRemoveSource(source.id)}
                  className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  aria-label={`Remove ${source.title} from collection`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {onAddSource && (
        <button type="button" className="btn-secondary mt-3 w-full justify-center !py-1.5 text-xs" onClick={onAddSource}>
          <Plus className="h-3.5 w-3.5" />
          Add Source
        </button>
      )}
    </article>
  );
}
