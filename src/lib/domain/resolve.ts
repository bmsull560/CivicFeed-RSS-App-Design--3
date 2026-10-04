/**
 * ID resolution and dataset integrity for the domain seam.
 *
 * Everything here works at the dataset level: resolving ID references into
 * adapted model objects, answering cross-file queries, and validating that
 * every cross-file reference in `src/data/*` points at a real record.
 */

import type { Source as ModelSource } from "../../models/evidence";
import type { TimelineEvent as ModelTimelineEvent, TraceHistoryNode } from "../../models/timeline";

import { sources as dataSources, getSourceById, type Source as DataSource } from "../../data/sources";
import { entities as dataEntities } from "../../data/entities";
import { timelineEvents as dataTimelineEvents } from "../../data/timeline";
import { researchProjects as dataResearchProjects } from "../../data/research";
import { topics as dataTopics, type Topic as DataTopic } from "../../data/topics";
import { categoryList as feedCategories } from "../../data/feeds";

import { TRACE_CHANGE_TYPE } from "./maps";
import { adaptSource, adaptTimelineEvent } from "./adapt";

// ---------------------------------------------------------------------------
// Resolution helpers
// ---------------------------------------------------------------------------

/** Resolve source IDs to adapted model sources, dropping unknown IDs. */
export function resolveSources(ids: string[]): ModelSource[] {
  return ids
    .map((id) => getSourceById(id))
    .filter((s): s is DataSource => s !== undefined)
    .map(adaptSource);
}

/** All sources in the dataset, adapted to the model vocabulary. */
export const modelSources: ModelSource[] = dataSources.map(adaptSource);

/** Display name for an entity ID; falls back to the raw ID when unknown. */
export function resolveEntityName(id: string): string {
  const entity = dataEntities.find((e) => e.id === id);
  return entity ? entity.name : id;
}

/** All adapted timeline events referencing the given entity. */
export function getModelEventsByEntity(entityId: string): ModelTimelineEvent[] {
  return dataTimelineEvents
    .filter((e) => e.entities.includes(entityId))
    .map(adaptTimelineEvent);
}

/** All adapted timeline events belonging to the given topic. */
export function getModelEventsByTopic(topicId: string): ModelTimelineEvent[] {
  return dataTimelineEvents
    .filter((e) => e.topicId === topicId)
    .map(adaptTimelineEvent);
}

// ---------------------------------------------------------------------------
// Trace history
// ---------------------------------------------------------------------------

interface Authority {
  name: string;
  description: string;
  date: string;
  kind: "legislation" | "regulation";
  /** Documenting source; authorities without one are dropped below. */
  source?: ModelSource;
}

/**
 * Builds a trace-history chain for a topic: the most recent regulation or
 * statute becomes the `current_rule` node, and earlier authorities form the
 * recursive `children` chain down to the `original_authority`. Returns
 * `null` when the topic has too few dated legal authorities to form a chain,
 * or when no documenting source is available (no fabricated fallback).
 *
 * The chain assembly (node roles, change kinds) is heuristic rather than
 * recorded in the data, so nodes are marked `synthesized: true`.
 */
export function buildTraceHistory(topic: DataTopic): TraceHistoryNode | null {
  const fallbackSource = resolveSources(topic.primarySources)[0];

  const authorities = [
    ...topic.regulations.map(
      (r): Authority => ({
        name: r.name,
        description: r.description,
        date: r.date ?? "",
        kind: "regulation",
        source: fallbackSource,
      })
    ),
    ...topic.legislation.map(
      (l): Authority => ({
        name: l.name,
        description: l.description,
        date: l.date ?? "",
        kind: "legislation",
        source: fallbackSource,
      })
    ),
  ]
    // Filter BEFORE constructing nodes so no `as` casts are needed.
    .filter((a): a is Authority & { source: ModelSource } => a.date !== "" && a.source !== undefined)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (authorities.length < 2) return null;

  const nodeTypeFor = (index: number, total: number, kind: Authority["kind"]): TraceHistoryNode["type"] => {
    if (index === 0) return "current_rule";
    if (index === total - 1) return "original_authority";
    if (kind === "legislation") return "statutory_authority";
    return "prior_regulation";
  };

  const build = (index: number): TraceHistoryNode => {
    const authority = authorities[index];
    const isLast = index === authorities.length - 1;
    return {
      id: `${topic.id}-trace-${index}`,
      type: nodeTypeFor(index, authorities.length, authority.kind),
      title: authority.name,
      date: authority.date,
      description: authority.description,
      source: authority.source,
      children: isLast ? [] : [build(index + 1)],
      changeType: index === 0 ? undefined : TRACE_CHANGE_TYPE[
        authority.kind === "legislation" ? "legislative" : "regulatory"
      ],
      // No fabricated prose: the data carries no change descriptions, so the
      // field stays absent rather than being invented.
      changeDescription: undefined,
      synthesized: true,
    };
  };

  return build(0);
}

// ---------------------------------------------------------------------------
// Dataset integrity
// ---------------------------------------------------------------------------

export interface IntegrityError {
  /** File/record kind where the dangling reference was found. */
  scope: string;
  /** ID of the record containing the bad reference. */
  recordId: string;
  /** Human-readable description of the dangling reference. */
  message: string;
}

/**
 * Checks EVERY cross-file reference in the flat datasets. Returns a list of
 * integrity errors; an empty list means the dataset is valid.
 */
export function validateDataset(): IntegrityError[] {
  const errors: IntegrityError[] = [];
  const sourceIds = new Set(dataSources.map((s) => s.id));
  const entityIds = new Set(dataEntities.map((e) => e.id));
  const eventIds = new Set(dataTimelineEvents.map((e) => e.id));
  const topicIds = new Set(dataTopics.map((t) => t.id));
  const feedCategorySet = new Set(feedCategories);

  const check = (scope: string, recordId: string, id: string, known: Set<string>, what: string) => {
    if (!known.has(id)) {
      errors.push({ scope, recordId, message: `${recordId} references unknown ${what} "${id}"` });
    }
  };

  for (const entity of dataEntities) {
    for (const sourceId of entity.sources) {
      check("entity.sources", entity.id, sourceId, sourceIds, "source");
    }
    for (const rel of entity.relationships) {
      check("entity.relationships", entity.id, rel.targetId, entityIds, "relationship target entity");
    }
  }

  for (const event of dataTimelineEvents) {
    check("event.topicId", event.id, event.topicId, topicIds, "topic");
    for (const entityId of event.entities) {
      check("event.entities", event.id, entityId, entityIds, "entity");
    }
    for (const sourceId of event.sources) {
      check("event.sources", event.id, sourceId, sourceIds, "source");
    }
  }

  for (const topic of dataTopics) {
    for (const ref of topic.timelineEvents) {
      check("topic.timelineEvents", topic.id, ref.eventId, eventIds, "timeline event");
    }
    for (const sourceId of topic.primarySources) {
      check("topic.primarySources", topic.id, sourceId, sourceIds, "source");
    }
    for (const category of topic.categories) {
      if (!feedCategorySet.has(category)) {
        errors.push({
          scope: "topic.categories",
          recordId: topic.id,
          message: `${topic.id} lists category "${category}" which is not a feed category`,
        });
      }
    }
  }

  for (const project of dataResearchProjects) {
    const claimIds = new Set(project.claims.map((c) => c.id));
    for (const topicId of project.topicIds) {
      check("project.topicIds", project.id, topicId, topicIds, "topic");
    }
    for (const claim of project.claims) {
      for (const sourceId of claim.sourceIds) {
        check("claim.sourceIds", claim.id, sourceId, sourceIds, "source");
      }
      for (const entityId of claim.entityIds) {
        check("claim.entityIds", claim.id, entityId, entityIds, "entity");
      }
    }
    for (const board of project.evidenceBoards) {
      for (const claimId of board.claimIds) {
        check("board.claimIds", board.id, claimId, claimIds, "claim in project");
      }
      for (const eventId of board.eventIds) {
        check("board.eventIds", board.id, eventId, eventIds, "timeline event");
      }
    }
    for (const collection of project.sourceCollections) {
      for (const sourceId of collection.sourceIds) {
        check("collection.sourceIds", collection.id, sourceId, sourceIds, "source");
      }
    }
  }

  return errors;
}

/** Throws when {@link validateDataset} reports any integrity error. */
export function assertDatasetValid(): void {
  const errors = validateDataset();
  if (errors.length > 0) {
    const summary = errors.map((e) => `[${e.scope}] ${e.message}`).join("\n");
    throw new Error(`Dataset integrity check failed (${errors.length} error(s)):\n${summary}`);
  }
}

// Fail fast during development so dangling references are caught at the
// seam rather than silently dropped by the resolve* helpers above.
if (import.meta.env.DEV) {
  assertDatasetValid();
}
