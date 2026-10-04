import { ExternalLink, CalendarDays, ArrowRight } from "lucide-react";
import type { Entity, EntityType, RelationshipType } from "../models";

interface EntityCardProps {
  entity: Entity;
  compact?: boolean;
  showRelationships?: boolean;
  /** Optional lookup to resolve related entity IDs to display names. */
  resolveEntityName?: (id: string) => string | undefined;
}

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  person: "Person",
  organization: "Organization",
  agency: "Agency",
  bill: "Bill",
  statute: "Statute",
  regulation: "Regulation",
  guidance: "Guidance",
  court_case: "Court Case",
  program: "Program",
  grant: "Grant",
  contract: "Contract",
  appropriation: "Appropriation",
  tax_expenditure: "Tax Expenditure",
  research: "Research",
  event: "Event",
};

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  established_by: "established by",
  establishes: "establishes",
  supersedes: "supersedes",
  superseded_by: "superseded by",
  amends: "amends",
  amended_by: "amended by",
  implements: "implements",
  enforces: "enforces",
  regulates: "regulates",
  regulated_by: "regulated by",
  overturns: "overturns",
  funds: "funds",
  appropriated_to: "appropriated to",
  contracted_to: "contracted to",
  appointed_to: "appointed to",
  serves_on: "serves on",
  member_of: "member of",
  opinion_in: "opinion in",
  cites: "cites",
  overturned_by: "overturned by",
  part_of: "part of",
  parent_of: "parent of",
  subordinate_to: "subordinate to",
  related_to: "related to",
  authored_by: "authored by",
  signed_by: "signed by",
  voted_on_by: "voted on by",
  sponsored_by: "sponsored by",
  challenged_by: "challenged by",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function EntityCard({
  entity,
  compact = false,
  showRelationships = false,
  resolveEntityName,
}: EntityCardProps) {
  const typeBadge = (
    <span className="badge bg-blue-50 text-blue-700 flex-shrink-0">
      {ENTITY_TYPE_LABELS[entity.type]}
    </span>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-slate-800 truncate">{entity.name}</span>
        {typeBadge}
      </div>
    );
  }

  const resolveName = (id: string): string => resolveEntityName?.(id) ?? id;

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug">{entity.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-slate-500">
            {typeBadge}
            {entity.establishedDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={11} aria-hidden="true" />
                Est. {formatDate(entity.establishedDate)}
              </span>
            )}
          </div>
        </div>
        {entity.url && (
          <a
            href={entity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 hover:underline"
            aria-label={`Official page for ${entity.name}`}
          >
            Official page
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      </div>

      {entity.description && (
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">{entity.description}</p>
      )}

      {showRelationships && entity.relationships.length > 0 && (
        <div className="mt-3">
          <h4 className="text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            Relationships ({entity.relationships.length})
          </h4>
          <ul className="space-y-1">
            {entity.relationships.map((rel) => (
              <li
                key={rel.id}
                className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-600"
                title={rel.description}
              >
                <span className="text-slate-500">{RELATIONSHIP_LABELS[rel.relationshipType]}</span>
                <ArrowRight size={11} className="text-slate-400" aria-hidden="true" />
                <span className="font-medium text-slate-700">
                  {resolveName(rel.targetEntityId)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
