/**
 * Topic page models.
 *
 * A {@link Topic} aggregates everything the platform knows about a civic
 * issue — timeline, legislation, regulations, agencies, people, funding,
 * research, and primary sources — into a single navigable page.
 */

import type { Source } from "./evidence";
import type { Entity } from "./entities";
import type { TimelineEvent } from "./timeline";
import type { ResearchProject } from "./research";

/**
 * A curated page about a civic issue, aggregating entities, events,
 * sources, and research projects.
 */
export interface Topic {
  /** Unique identifier. */
  id: string;
  /** URL-friendly identifier (e.g., "clean-air-act"). */
  slug: string;
  /** Display name of the topic. */
  name: string;
  /** Short description used in listings. */
  description: string;
  /** Long-form overview text for the topic page. */
  overview: string;
  /** Free-form category tags (e.g., "environment", "healthcare"). */
  categories: string[];
  /** Key timeline events for this topic. */
  timelineEvents: TimelineEvent[];
  /** Legislation (bills/statutes) relevant to the topic. */
  legislation: Entity[];
  /** Regulations relevant to the topic. */
  regulations: Entity[];
  /** Agencies involved in the topic. */
  agencies: Entity[];
  /** Non-governmental organizations involved. */
  organizations: Entity[];
  /** Key people associated with the topic. */
  people: Entity[];
  /** Funding-related entities (grants, contracts, appropriations). */
  fundingEntities: Entity[];
  /** Research projects investigating this topic. */
  researchProjects: ResearchProject[];
  /** Primary sources anchoring the topic. */
  primarySources: Source[];
  /** IDs of related topics. */
  relatedTopics: string[];
}

/**
 * An ordered section of a topic page, referencing items by ID.
 */
export interface TopicSection {
  /** Unique identifier. */
  id: string;
  /** ID of the owning {@link Topic}. */
  topicId: string;
  /** Which kind of section this is. */
  sectionType: TopicSectionType;
  /** Section heading. */
  title: string;
  /** Prose content of the section. */
  content: string;
  /** IDs of entities, sources, or events featured in the section. */
  items: string[];
  /** Display order of the section within the topic page. */
  order: number;
}

/** Vocabulary of topic page section types. */
export type TopicSectionType =
  | "overview"
  | "timeline"
  | "legislation"
  | "regulations"
  | "agencies"
  | "organizations"
  | "people"
  | "money"
  | "research"
  | "primary_sources"
  | "related_issues";
