/**
 * Page-shaped view models for the domain seam.
 *
 * Each function returns exactly the shape its consuming page renders, built
 * purely from the adapted domain records in `./adapt` and the resolution
 * helpers in `./resolve`. Results are memoized (the underlying datasets are
 * static module constants), so pages can call these freely in render.
 */

import type { Source as ModelSource } from "../../models/evidence";
import type {
  Entity as ModelEntity,
  EntityType as ModelEntityType,
  RelationshipType as ModelRelationshipType,
} from "../../models/entities";
import type {
  TimelineEvent as ModelTimelineEvent,
  TraceHistoryNode,
  RegulatoryDiff,
} from "../../models/timeline";
import type { ResearchProject as ModelResearchProject } from "../../models/research";

import { topics as dataTopics, type TopicRef } from "../../data/topics";
import { entities as dataEntities } from "../../data/entities";
import { timelineEvents as dataTimelineEvents } from "../../data/timeline";
import { researchProjects as dataResearchProjects } from "../../data/research";

import { adaptEntity, adaptResearchProject, adaptTimelineEvent } from "./adapt";
import {
  buildTraceHistory,
  getModelEventsByEntity,
  getModelEventsByTopic,
  modelSources,
  resolveEntityName,
  resolveSources,
} from "./resolve";

// ---------------------------------------------------------------------------
// Shared view types
// ---------------------------------------------------------------------------

/**
 * A topic-page reference resolved against the knowledge graph. When the
 * referenced entity is not in the graph, `entity` is a display-only fallback
 * (matching the historical page fallback) and `existsInGraph` is `false`.
 */
export interface ResolvedRef {
  entity: ModelEntity;
  existsInGraph: boolean;
}

/** Card-shaped summary of a topic for listings (Dashboard, ExplorePage). */
export interface TopicCardData {
  id: string;
  slug: string;
  name: string;
  description: string;
  categories: string[];
  eventCount: number;
}

export interface TopicView {
  id: string;
  slug: string;
  name: string;
  description: string;
  overview: string[];
  categories: string[];
  events: ModelTimelineEvent[];
  legislation: ResolvedRef[];
  regulations: ResolvedRef[];
  agencies: ResolvedRef[];
  organizations: ResolvedRef[];
  people: ResolvedRef[];
  primarySources: ModelSource[];
  researchProjects: ModelResearchProject[];
  relatedTopics: TopicCardData[];
}

export interface EntityRelationshipGroup {
  type: ModelRelationshipType;
  items: { targetId: string; targetName: string; note?: string }[];
}

export interface EntityView {
  entity: ModelEntity;
  events: ModelTimelineEvent[];
  sources: ModelSource[];
  groupedRelationships: EntityRelationshipGroup[];
  /** Number of knowledge-graph entities sharing this entity's type. */
  typeCount: number;
}

export type ResearchProjectView = ModelResearchProject;

export interface TraceHistoryView {
  topicId: string;
  topicSlug: string;
  topicName: string;
  root: TraceHistoryNode | null;
}

export interface TimelineView {
  events: ModelTimelineEvent[];
}

export interface ComparisonView {
  entities: ModelEntity[];
  /** Model entity types eligible for document diffing. */
  comparableTypes: ReadonlySet<ModelEntityType>;
}

// ---------------------------------------------------------------------------
// Ref resolution (absorbs TopicPage's local resolveTopicRef)
// ---------------------------------------------------------------------------

/**
 * Resolve a topic-page reference against the knowledge graph (absorbs
 * TopicPage's local resolveTopicRef). Refs without a matching entity get a
 * display-only fallback entity and `existsInGraph: false`.
 */
export function resolveTopicRef(ref: TopicRef): ResolvedRef {
  const dataEntity = dataEntities.find((e) => e.id === ref.entityId);
  if (dataEntity) {
    return { entity: adaptEntity(dataEntity), existsInGraph: true };
  }
  // Fallback for refs without a matching knowledge-graph entity (same shape
  // the page historically rendered).
  return {
    entity: {
      id: ref.entityId,
      type: "event",
      name: ref.name,
      description: ref.description,
      relationships: [],
      sources: [],
    },
    existsInGraph: false,
  };
}

// ---------------------------------------------------------------------------
// Topic cards
// ---------------------------------------------------------------------------

let topicCardsCache: TopicCardData[] | null = null;

export function listTopicCards(): TopicCardData[] {
  if (!topicCardsCache) {
    topicCardsCache = dataTopics.map((topic) => ({
      id: topic.id,
      slug: topic.slug,
      name: topic.name,
      description: topic.description,
      categories: topic.categories,
      eventCount: topic.timelineEvents.length,
    }));
  }
  return topicCardsCache;
}

// ---------------------------------------------------------------------------
// Topic view
// ---------------------------------------------------------------------------

const topicViewCache = new Map<string, TopicView | undefined>();

export function getTopicView(slug: string): TopicView | undefined {
  if (topicViewCache.has(slug)) return topicViewCache.get(slug);
  const topic = dataTopics.find((t) => t.slug === slug);
  const view: TopicView | undefined = topic
    ? {
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        overview: topic.overview,
        categories: topic.categories,
        events: getModelEventsByTopic(topic.id),
        legislation: topic.legislation.map(resolveTopicRef),
        regulations: topic.regulations.map(resolveTopicRef),
        agencies: topic.agencies.map(resolveTopicRef),
        organizations: topic.organizations.map(resolveTopicRef),
        people: topic.people.map(resolveTopicRef),
        primarySources: resolveSources(topic.primarySources),
        researchProjects: dataResearchProjects
          .filter((p) => p.topicIds.includes(topic.id))
          .map(adaptResearchProject),
        relatedTopics: dataTopics
          .filter(
            (t) => t.id !== topic.id && t.categories.some((c) => topic.categories.includes(c)),
          )
          .map((t) => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
            description: t.description,
            categories: t.categories,
            eventCount: t.timelineEvents.length,
          })),
      }
    : undefined;
  topicViewCache.set(slug, view);
  return view;
}

// ---------------------------------------------------------------------------
// Entity view
// ---------------------------------------------------------------------------

const entityViewCache = new Map<string, EntityView | undefined>();

export function getEntityView(id: string): EntityView | undefined {
  if (entityViewCache.has(id)) return entityViewCache.get(id);
  const dataEntity = dataEntities.find((e) => e.id === id);
  let view: EntityView | undefined;
  if (dataEntity) {
    const entity = adaptEntity(dataEntity);
    const groups = new Map<ModelRelationshipType, EntityRelationshipGroup["items"]>();
    for (const rel of entity.relationships) {
      const list = groups.get(rel.relationshipType) ?? [];
      list.push({
        targetId: rel.targetEntityId,
        targetName: resolveEntityName(rel.targetEntityId),
        note: rel.description,
      });
      groups.set(rel.relationshipType, list);
    }
    view = {
      entity,
      events: getModelEventsByEntity(entity.id),
      sources: entity.sources,
      groupedRelationships: Array.from(groups.entries()).map(([type, items]) => ({
        type,
        items,
      })),
      typeCount: dataEntities.filter((e) => e.type === dataEntity.type).length,
    };
  }
  entityViewCache.set(id, view);
  return view;
}

// ---------------------------------------------------------------------------
// Research project views
// ---------------------------------------------------------------------------

let researchProjectsCache: ModelResearchProject[] | null = null;
const researchProjectViewCache = new Map<string, ResearchProjectView | undefined>();

export function listResearchProjects(): ModelResearchProject[] {
  if (!researchProjectsCache) {
    researchProjectsCache = dataResearchProjects.map(adaptResearchProject);
  }
  return researchProjectsCache;
}

export function getResearchProjectView(id: string): ResearchProjectView | undefined {
  if (!researchProjectViewCache.has(id)) {
    researchProjectViewCache.set(id, listResearchProjects().find((p) => p.id === id));
  }
  return researchProjectViewCache.get(id);
}

// ---------------------------------------------------------------------------
// Trace history view
// ---------------------------------------------------------------------------

const traceHistoryViewCache = new Map<string, TraceHistoryView | undefined>();

export function getTraceHistoryView(topicIdOrSlug: string): TraceHistoryView | undefined {
  if (traceHistoryViewCache.has(topicIdOrSlug)) return traceHistoryViewCache.get(topicIdOrSlug);
  const topic = dataTopics.find((t) => t.id === topicIdOrSlug || t.slug === topicIdOrSlug);
  const view: TraceHistoryView | undefined = topic
    ? {
        topicId: topic.id,
        topicSlug: topic.slug,
        topicName: topic.name,
        root: buildTraceHistory(topic),
      }
    : undefined;
  traceHistoryViewCache.set(topicIdOrSlug, view);
  return view;
}

// ---------------------------------------------------------------------------
// Timeline view
// ---------------------------------------------------------------------------

let timelineViewCache: TimelineView | null = null;

export function getTimelineView(): TimelineView {
  if (!timelineViewCache) {
    timelineViewCache = { events: dataTimelineEvents.map(adaptTimelineEvent) };
  }
  return timelineViewCache;
}

// ---------------------------------------------------------------------------
// Comparison view
// ---------------------------------------------------------------------------

const COMPARABLE_TYPES: ReadonlySet<ModelEntityType> = new Set([
  "regulation",
  "statute",
  "guidance",
]);

let comparisonViewCache: ComparisonView | null = null;

export function getComparisonView(): ComparisonView {
  if (!comparisonViewCache) {
    comparisonViewCache = {
      entities: dataEntities.map(adaptEntity),
      comparableTypes: COMPARABLE_TYPES,
    };
  }
  return comparisonViewCache;
}

/**
 * Builds a side-by-side document diff for two comparable entities.
 *
 * SYNTHESIZED (RFC #15): the data layer has no real document versions or
 * detected diffs; this heuristic comparison is marked `synthesized: true`.
 * Returns `null` when either entity is unknown, not comparable, or no
 * documenting source exists anywhere in the dataset.
 */
export function buildRegulatoryDiff(leftId: string, rightId: string): RegulatoryDiff | null {
  const { entities } = getComparisonView();
  const left = entities.find((e) => e.id === leftId);
  const right = entities.find((e) => e.id === rightId);
  if (!left || !right) return null;
  if (!COMPARABLE_TYPES.has(left.type) || !COMPARABLE_TYPES.has(right.type)) return null;
  const source = left.sources[0] ?? right.sources[0] ?? modelSources[0];
  if (!source) return null;
  return {
    id: `diff-${left.id}-${right.id}`,
    documentId: left.id,
    previousVersionId: right.id,
    changeType: "modified",
    section: "Full document",
    previousText: right.description ?? right.name,
    currentText: left.description ?? left.name,
    effectiveDate: left.establishedDate ?? new Date().toISOString().slice(0, 10),
    source,
    synthesized: true,
  };
}
