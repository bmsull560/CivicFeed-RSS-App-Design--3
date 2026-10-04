import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BookOpen, GitBranch, Clock, Library, ExternalLink, CalendarDays } from "lucide-react";
import type { EntityType, RelationshipType } from "../models/entities";
import NavigationTabs, { type NavigationTab } from "../components/NavigationTabs";
import SectionHeader from "../components/SectionHeader";
import Timeline from "../components/Timeline";
import SourceCard from "../components/SourceCard";
import EmptyState from "../components/EmptyState";
import { getEntityView } from "../lib/domain";

const TYPE_BADGE_STYLES: Partial<Record<EntityType, string>> = {
  person: "bg-purple-50 text-purple-700",
  agency: "bg-blue-50 text-blue-700",
  organization: "bg-teal-50 text-teal-700",
  statute: "bg-amber-50 text-amber-700",
  regulation: "bg-indigo-50 text-indigo-700",
  court_case: "bg-rose-50 text-rose-700",
  program: "bg-green-50 text-green-700",
  appropriation: "bg-emerald-50 text-emerald-700",
};

const TYPE_LABELS: Partial<Record<EntityType, string>> = {
  person: "Person",
  agency: "Agency",
  organization: "Organization",
  statute: "Statute",
  regulation: "Regulation",
  court_case: "Court Case",
  program: "Program",
  appropriation: "Funding",
};

const RELATIONSHIP_LABELS: Partial<Record<RelationshipType, string>> = {
  related_to: "Related to",
  enforces: "Enforces",
  implements: "Implements",
  established_by: "Created by",
  establishes: "Established",
  amends: "Amends",
  challenged_by: "Challenged by",
  overturns: "Overruled",
  overturned_by: "Overturned by",
  funds: "Funds",
  regulated_by: "Regulated by",
  regulates: "Regulates",
  part_of: "Part of",
  supersedes: "Supersedes",
  superseded_by: "Superseded by",
  amended_by: "Amended by",
};

function typeLabel(type: EntityType): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

function relationshipLabel(type: RelationshipType): string {
  return RELATIONSHIP_LABELS[type] ?? type.replace(/_/g, " ");
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function EntityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const view = id ? getEntityView(id) : undefined;
  const [activeTab, setActiveTab] = useState("overview");

  if (!view) {
    return (
      <div className="card">
        <EmptyState
          message="Entity not found"
          subMessage={`No entity exists with the id "${id ?? ""}".`}
          action={{ label: "Back to Dashboard", onClick: () => navigate("/") }}
        />
      </div>
    );
  }

  const { entity, events, sources: entitySources, groupedRelationships, typeCount } = view;
  const relatedCount = entity.relationships.length;

  const tabs: NavigationTab[] = [
    { id: "overview", label: "Overview", icon: <BookOpen size={14} /> },
    { id: "relationships", label: "Relationships", icon: <GitBranch size={14} />, badge: String(relatedCount) },
    { id: "timeline", label: "Timeline", icon: <Clock size={14} />, badge: String(events.length) },
    { id: "sources", label: "Sources", icon: <Library size={14} />, badge: String(entitySources.length) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">{entity.name}</h1>
          <span className={`badge ${TYPE_BADGE_STYLES[entity.type] ?? "bg-slate-100 text-slate-700"}`}>
            {typeLabel(entity.type)}
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl">{entity.description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
          {entity.establishedDate && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} className="text-slate-400" aria-hidden="true" />
              Established {formatDate(entity.establishedDate)}
            </span>
          )}
          {entity.url && (
            <a
              href={entity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-500 hover:underline"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Official page
            </a>
          )}
        </div>
      </section>

      <NavigationTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <section className="card p-6 space-y-4">
          <SectionHeader title="Overview" subtitle={`${typeLabel(entity.type)} in the civic knowledge graph`} />
          <p className="text-sm leading-relaxed text-slate-700">{entity.description}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-50 rounded-lg p-3">
              <dt className="text-[0.6875rem] uppercase tracking-wide text-slate-500">Type</dt>
              <dd className="text-sm font-semibold text-slate-800 mt-0.5">{typeLabel(entity.type)}</dd>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <dt className="text-[0.6875rem] uppercase tracking-wide text-slate-500">Established</dt>
              <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                {entity.establishedDate ? formatDate(entity.establishedDate) : "—"}
              </dd>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <dt className="text-[0.6875rem] uppercase tracking-wide text-slate-500">Relationships</dt>
              <dd className="text-sm font-semibold text-slate-800 mt-0.5">{relatedCount}</dd>
            </div>
          </dl>
          {typeCount > 1 && (
            <p className="text-xs text-slate-500">
              {typeCount - 1} other {typeLabel(entity.type).toLowerCase()}{" "}
              entities are tracked in the knowledge graph.
            </p>
          )}
        </section>
      )}

      {activeTab === "relationships" && (
        <section className="space-y-6">
          <SectionHeader title="Relationships" subtitle="Typed connections to other entities" />
          {groupedRelationships.length > 0 ? (
            groupedRelationships.map((group) => (
              <div key={group.type} className="card p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  {relationshipLabel(group.type)}
                  <span className="badge bg-slate-100 text-slate-600 ml-2">{group.items.length}</span>
                </h3>
                <ul className="divide-y divide-slate-100">
                  {group.items.map((item) => (
                    <li key={item.targetId} className="py-2.5 first:pt-0 last:pb-0">
                      <Link
                        to={`/entity/${item.targetId}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
                      >
                        {item.targetName}
                      </Link>
                      {item.note && <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="card"><EmptyState message="No relationships recorded for this entity." /></div>
          )}
        </section>
      )}

      {activeTab === "timeline" && (
        <section className="card p-6">
          <SectionHeader title="Timeline" subtitle="Events referencing this entity" />
          <Timeline events={events} />
        </section>
      )}

      {activeTab === "sources" && (
        <section>
          <SectionHeader title="Sources" subtitle="Primary sources documenting this entity" />
          {entitySources.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {entitySources.map((source) => (
                <SourceCard key={source.id} source={source} showPassage />
              ))}
            </div>
          ) : (
            <div className="card"><EmptyState message="No sources recorded for this entity." /></div>
          )}
        </section>
      )}
    </div>
  );
}
