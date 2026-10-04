import { Scale, StickyNote } from "lucide-react";
import type { Claim } from "../models";
import ProvenanceBadge from "./ProvenanceBadge";
import SourceCard from "./SourceCard";

interface ClaimCardProps {
  claim: Claim;
  showSources?: boolean;
  compact?: boolean;
}

export default function ClaimCard({ claim, showSources = false, compact = false }: ClaimCardProps) {
  if (compact) {
    return (
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-700 leading-snug min-w-0">{claim.statement}</p>
        <ProvenanceBadge status={claim.evidenceStatus} size="sm" />
      </div>
    );
  }

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-800 leading-snug min-w-0">{claim.statement}</p>
        <ProvenanceBadge status={claim.evidenceStatus} />
      </div>

      {claim.dateContext && (
        <p className="mt-1.5 text-[0.6875rem] text-slate-500">{claim.dateContext}</p>
      )}

      {showSources && claim.sources.length > 0 && (
        <div className="mt-3">
          <h4 className="text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            Supporting Sources ({claim.sources.length})
          </h4>
          <ul className="space-y-1.5">
            {claim.sources.map((source) => (
              <li key={source.id}>
                <SourceCard source={source} compact showPassage />
              </li>
            ))}
          </ul>
          {claim.sources.some((s) => s.relevantPassage) && (
            <div className="mt-2 space-y-2">
              {claim.sources
                .filter((s) => s.relevantPassage)
                .map((s) => (
                  <blockquote
                    key={`passage-${s.id}`}
                    className="border-l-2 border-blue-200 bg-blue-50/50 pl-3 py-2 pr-2 text-xs text-slate-600 italic rounded-r-md"
                  >
                    {s.relevantPassage}
                  </blockquote>
                ))}
            </div>
          )}
        </div>
      )}

      {claim.counterEvidence && claim.counterEvidence.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50/50 p-3">
          <h4 className="inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-red-600 mb-1.5">
            <Scale size={12} aria-hidden="true" />
            Counter-Evidence ({claim.counterEvidence.length})
          </h4>
          <ul className="space-y-1.5">
            {claim.counterEvidence.map((source) => (
              <li key={source.id}>
                <SourceCard source={source} compact showPassage />
              </li>
            ))}
          </ul>
        </div>
      )}

      {claim.notes && (
        <p className="mt-3 inline-flex items-start gap-1.5 text-xs text-slate-500">
          <StickyNote size={12} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          {claim.notes}
        </p>
      )}
    </article>
  );
}
