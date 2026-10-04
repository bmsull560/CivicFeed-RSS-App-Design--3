import { useState } from "react";
import { Columns2, ExternalLink, Rows2 } from "lucide-react";
import type { RegulatoryDiff } from "../models/timeline";
import {
  CHANGE_TYPE_COLORS,
  formatChangeType,
  formatDate,
} from "./timelineUtils";

export interface RegulatoryDiffPanelProps {
  diff: RegulatoryDiff;
  previousText?: string;
  currentText?: string;
}

type ViewMode = "side-by-side" | "unified";

/**
 * Before/after comparison of a regulatory change. Highlights added text in
 * green, removed text in red, and modified sections in yellow.
 */
export default function RegulatoryDiffPanel({
  diff,
  previousText,
  currentText,
}: RegulatoryDiffPanelProps) {
  const [view, setView] = useState<ViewMode>("side-by-side");
  const before = previousText ?? diff.previousText ?? "";
  const after = currentText ?? diff.currentText ?? "";
  const highlight =
    diff.changeType === "added"
      ? "bg-emerald-50 border-emerald-200"
      : diff.changeType === "removed"
        ? "bg-red-50 border-red-200"
        : "bg-amber-50 border-amber-200";

  return (
    <section
      className="card p-4"
      aria-label={`Regulatory diff ${diff.section ?? ""}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge ${CHANGE_TYPE_COLORS[diff.changeType]}`}>
            {formatChangeType(diff.changeType)}
          </span>
          {diff.section && (
            <span className="badge bg-slate-100 text-slate-700">
              {diff.section}
            </span>
          )}
          <span className="text-xs text-slate-500">
            Effective{" "}
            <time dateTime={diff.effectiveDate}>
              {formatDate(diff.effectiveDate)}
            </time>
          </span>
        </div>
        <div
          className="flex rounded-md border border-slate-200"
          role="group"
          aria-label="Diff view mode"
        >
          <button
            type="button"
            onClick={() => setView("side-by-side")}
            aria-pressed={view === "side-by-side"}
            className={`rounded-l-md px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              view === "side-by-side"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Side-by-side view</span>
          </button>
          <button
            type="button"
            onClick={() => setView("unified")}
            aria-pressed={view === "unified"}
            className={`rounded-r-md px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              view === "unified"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Rows2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Unified view</span>
          </button>
        </div>
      </header>

      {view === "side-by-side" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Before
            </h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
              {before || (
                <span className="italic text-slate-400">
                  No previous text (added provision)
                </span>
              )}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              After
            </h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
              {after || (
                <span className="italic text-slate-400">
                  No current text (removed provision)
                </span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`mt-3 space-y-2 rounded-lg border p-3 ${highlight}`}
        >
          {before && (
            <p className="whitespace-pre-wrap rounded bg-red-100/70 px-2 py-1 text-sm text-slate-800 line-through decoration-red-400">
              <span className="mr-1 select-none font-mono text-red-600">−</span>
              {before}
            </p>
          )}
          {after && (
            <p className="whitespace-pre-wrap rounded bg-emerald-100/70 px-2 py-1 text-sm text-slate-800">
              <span className="mr-1 select-none font-mono text-emerald-600">
                +
              </span>
              {after}
            </p>
          )}
          {!before && !after && (
            <p className="text-sm italic text-slate-500">
              No text changes recorded.
            </p>
          )}
        </div>
      )}

      <footer className="mt-3 border-t border-slate-100 pt-2">
        <a
          href={diff.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          {diff.source.title}
        </a>
      </footer>
    </section>
  );
}
