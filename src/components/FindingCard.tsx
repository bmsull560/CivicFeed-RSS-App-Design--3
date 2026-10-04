import { AlertTriangle, CheckCircle2, FileWarning, Lightbulb } from "lucide-react";
import type { Finding } from "../models/research";
import type { EvidenceStatus } from "../models/evidence";

const STATUS_STYLES: Record<EvidenceStatus, string> = {
  documented: "bg-green-100 text-green-700",
  inferred: "bg-blue-100 text-blue-700",
  disputed: "bg-red-100 text-red-700",
  inconclusive: "bg-amber-100 text-amber-700",
  unverified: "bg-slate-100 text-slate-600",
};

const CONFIDENCE_STYLES: Record<Finding["confidence"], string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

/** Small badge conveying the epistemic (provenance) status of evidence. */
function ProvenanceBadge({ status }: { status: EvidenceStatus }) {
  return (
    <span className={`badge ${STATUS_STYLES[status]}`} aria-label={`Evidence status: ${status}`}>
      {status}
    </span>
  );
}

interface FindingCardProps {
  finding: Finding;
  showEvidence?: boolean;
}

/** Card presenting a synthesized research finding with its provenance. */
export default function FindingCard({ finding, showEvidence = true }: FindingCardProps) {
  return (
    <article className="card p-5" aria-label={`Finding: ${finding.title}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800">{finding.title}</h3>
            <time className="text-[0.6875rem] text-slate-400" dateTime={finding.createdAt}>
              {new Date(finding.createdAt).toLocaleDateString()}
            </time>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ProvenanceBadge status={finding.evidenceStatus} />
          <span className={`badge ${CONFIDENCE_STYLES[finding.confidence]}`}>
            {finding.confidence} confidence
          </span>
        </div>
      </header>

      <p className="mt-3 text-sm leading-relaxed text-slate-700">{finding.statement}</p>

      {showEvidence && (
        <div className="mt-4 space-y-3">
          {finding.supportingClaims.length > 0 && (
            <section aria-label="Supporting claims">
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                Supporting claims ({finding.supportingClaims.length})
              </h4>
              <ul className="space-y-1.5" role="list">
                {finding.supportingClaims.map((claim) => (
                  <li
                    key={claim.id}
                    className="flex items-start justify-between gap-2 rounded-lg bg-green-50/60 px-3 py-2"
                  >
                    <p className="min-w-0 text-xs text-slate-700">{claim.statement}</p>
                    <ProvenanceBadge status={claim.evidenceStatus} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {finding.counterEvidence && finding.counterEvidence.length > 0 && (
            <section aria-label="Counter-evidence">
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                Counter-evidence ({finding.counterEvidence.length})
              </h4>
              <ul className="space-y-1.5" role="list">
                {finding.counterEvidence.map((claim) => (
                  <li
                    key={claim.id}
                    className="flex items-start justify-between gap-2 rounded-lg bg-red-50/60 px-3 py-2"
                  >
                    <p className="min-w-0 text-xs text-slate-700">{claim.statement}</p>
                    <ProvenanceBadge status={claim.evidenceStatus} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {finding.missingEvidence && finding.missingEvidence.length > 0 && (
            <section aria-label="Missing evidence">
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <FileWarning className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                Missing evidence
              </h4>
              <ul className="list-disc space-y-1 pl-6 text-xs text-slate-600" role="list">
                {finding.missingEvidence.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
