import { useMemo, useState } from "react";
import { Columns2 } from "lucide-react";
import EntityCard from "../components/EntityCard";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import RegulatoryDiffPanel from "../components/RegulatoryDiffPanel";
import SourceCard from "../components/SourceCard";
import type { Entity } from "../models/entities";
import type { RegulatoryDiff } from "../models/timeline";
import { buildRegulatoryDiff, getComparisonView } from "../lib/domain";
import { formatDate } from "../components/timelineUtils";

function EntitySelector({
  label,
  value,
  excludeId,
  options,
  onChange,
}: {
  label: string;
  value: string;
  excludeId?: string;
  options: Entity[];
  onChange: (id: string) => void;
}) {
  const selectId = `entity-select-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={selectId} className="block text-xs font-medium text-slate-600">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select an entity…</option>
        {options
          .filter((e) => e.id !== excludeId)
          .map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.type.replace(/_/g, " ")})
            </option>
          ))}
      </select>
    </div>
  );
}

function EntityDetail({ entity }: { entity: Entity }) {
  return (
    <div className="space-y-4">
      <EntityCard entity={entity} showRelationships />
      <dl className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 font-medium text-slate-500">Type</dt>
          <dd className="capitalize">{entity.type.replace(/_/g, " ")}</dd>
        </div>
        {entity.establishedDate && (
          <div className="mt-2 flex gap-2">
            <dt className="w-24 shrink-0 font-medium text-slate-500">Established</dt>
            <dd>{formatDate(entity.establishedDate)}</dd>
          </div>
        )}
        {entity.dissolvedDate && (
          <div className="mt-2 flex gap-2">
            <dt className="w-24 shrink-0 font-medium text-slate-500">Dissolved</dt>
            <dd>{formatDate(entity.dissolvedDate)}</dd>
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <dt className="w-24 shrink-0 font-medium text-slate-500">Relationships</dt>
          <dd>{entity.relationships.length}</dd>
        </div>
      </dl>
      {entity.sources.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sources ({entity.sources.length})
          </h3>
          <div className="mt-2 space-y-2">
            {entity.sources.map((source) => (
              <SourceCard key={source.id} source={source} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparisonPage() {
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");

  const modelEntities = useMemo(() => getComparisonView().entities, []);
  const nameById = useMemo(
    () => new Map(modelEntities.map((e) => [e.id, e.name])),
    [modelEntities]
  );

  const left = modelEntities.find((e) => e.id === leftId);
  const right = modelEntities.find((e) => e.id === rightId);

  const diff: RegulatoryDiff | null = useMemo(() => {
    if (!left || !right) return null;
    return buildRegulatoryDiff(left.id, right.id);
  }, [left, right]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SectionHeader
        title="Compare Entities"
        subtitle="Select two knowledge-graph entities to compare their details, relationships, and sources side by side."
        icon={<Columns2 className="h-5 w-5" aria-hidden="true" />}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <EntitySelector
          label="First entity"
          value={leftId}
          excludeId={rightId}
          options={modelEntities}
          onChange={setLeftId}
        />
        <EntitySelector
          label="Second entity"
          value={rightId}
          excludeId={leftId}
          options={modelEntities}
          onChange={setRightId}
        />
      </div>

      {!left || !right ? (
        <div className="mt-8">
          <EmptyState
            message="Select two entities to compare"
            subMessage="Choose an entity in each selector above to see a side-by-side comparison."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section aria-label={`Details for ${left.name}`}>
              <h2 className="mb-3 text-sm font-semibold text-slate-900">{left.name}</h2>
              <EntityDetail entity={left} />
            </section>
            <section aria-label={`Details for ${right.name}`}>
              <h2 className="mb-3 text-sm font-semibold text-slate-900">{right.name}</h2>
              <EntityDetail entity={right} />
            </section>
          </div>

          <div className="mt-8">
            {diff ? (
              <section aria-label="Regulatory comparison">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">
                  Document comparison
                </h2>
                <RegulatoryDiffPanel diff={diff} />
              </section>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
                Document diff is available when both entities are statutes, regulations,
                or guidance. Related entity:{" "}
                {nameById.get(left.relationships[0]?.targetEntityId ?? "") ?? "none"}.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
