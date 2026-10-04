import { ExternalLink, FileText, CalendarDays, User, Building2 } from "lucide-react";
import type { Source, SourceType } from "../models";

interface SourceCardProps {
  source: Source;
  compact?: boolean;
  showPassage?: boolean;
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  legislation: "Legislation",
  regulation: "Regulation",
  court_opinion: "Court Opinion",
  agency_guidance: "Agency Guidance",
  press_release: "Press Release",
  official_report: "Official Report",
  academic_research: "Academic Research",
  news_article: "News Article",
  congressional_record: "Congressional Record",
  federal_register: "Federal Register",
  data_set: "Data Set",
  other: "Other",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SourceCard({ source, compact = false, showPassage = false }: SourceCardProps) {
  const attribution = source.author ?? source.issuingOrganization;
  const AttributionIcon = source.author ? User : Building2;

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={14} className="flex-shrink-0 text-slate-400" aria-hidden="true" />
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-500 hover:underline truncate"
        >
          {source.title}
        </a>
        <span className="badge bg-slate-100 text-slate-600 flex-shrink-0">
          {SOURCE_TYPE_LABELS[source.sourceType]}
        </span>
        <span className="text-[0.6875rem] text-slate-500 flex-shrink-0">
          {formatDate(source.publicationDate)}
        </span>
      </div>
    );
  }

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-1.5 text-sm font-semibold text-slate-800 hover:text-blue-600"
          >
            <span className="leading-snug">{source.title}</span>
            <ExternalLink
              size={13}
              className="mt-0.5 flex-shrink-0 text-slate-400 group-hover:text-blue-500"
              aria-hidden="true"
            />
          </a>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-slate-500">
            <span className="badge bg-blue-50 text-blue-700">
              {SOURCE_TYPE_LABELS[source.sourceType]}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={11} aria-hidden="true" />
              {formatDate(source.publicationDate)}
            </span>
            {attribution && (
              <span className="inline-flex items-center gap-1">
                <AttributionIcon size={11} aria-hidden="true" />
                {attribution}
              </span>
            )}
          </div>
        </div>
      </div>
      {showPassage && source.relevantPassage && (
        <blockquote className="mt-3 border-l-2 border-blue-200 bg-blue-50/50 pl-3 py-2 pr-2 text-xs text-slate-600 italic rounded-r-md">
          {source.relevantPassage}
        </blockquote>
      )}
    </article>
  );
}
