/**
 * Timeline & temporal models.
 *
 * Events place civic history on a temporal axis; {@link TraceHistoryNode}
 * and {@link RegulatoryDiff} model the evolution of a rule or authority
 * back through its chain of amendments to the original statutory grant.
 */

import type { Source } from "./evidence";

/** Perspective/filter for viewing the timeline. */
export type TimelineMode =
  | "chronological"
  | "legislative"
  | "regulatory"
  | "judicial"
  | "administrative"
  | "funding"
  | "organizational";

/**
 * A dated event in civic history, linked to participating entities and
 * documented by sources.
 */
export interface TimelineEvent {
  /** Unique identifier. */
  id: string;
  /** Event date (ISO 8601). */
  date: string;
  /** End date for multi-day/ongoing events (ISO 8601). */
  endDate?: string;
  /** Short event title. */
  title: string;
  /** Description of what happened and why it matters. */
  description: string;
  /** What kind of event this is. */
  eventType: TimelineEventType;
  /** Which timeline perspective this event belongs to. */
  mode: TimelineMode;
  /** IDs of {@link Entity} objects involved in the event. */
  entities: string[];
  /** Sources documenting the event. */
  sources: Source[];
  /** IDs of related timeline events (e.g., appeal of a decision). */
  relatedEvents?: string[];
  /** Location where the event occurred, if relevant. */
  location?: string;
  /** Editorial weight of the event. */
  significance: "major" | "minor" | "milestone";
}

/** Vocabulary of timeline event types. */
export type TimelineEventType =
  | "law_enacted"
  | "law_amended"
  | "law_repealed"
  | "regulation_proposed"
  | "regulation_final"
  | "regulation_amended"
  | "regulation_repealed"
  | "executive_order"
  | "guidance_issued"
  | "policy_changed"
  | "court_filed"
  | "court_decided"
  | "court_appealed"
  | "court_overturned"
  | "agency_established"
  | "agency_reorganized"
  | "agency_abolished"
  | "funding_appropriated"
  | "funding_allocated"
  | "grant_awarded"
  | "contract_awarded"
  | "person_appointed"
  | "person_resigned"
  | "person_confirmed"
  | "investigation_opened"
  | "report_published"
  | "hearing_held"
  | "other";

/**
 * One node in a "trace the history" chain, from the current rule back to
 * the original statutory authority. `children` are earlier steps in the
 * chain, allowing a recursive tree of provenance.
 */
export interface TraceHistoryNode {
  /** Unique identifier. */
  id: string;
  /** Role of this node in the provenance chain. */
  type:
    | "current_rule"
    | "recent_amendment"
    | "prior_regulation"
    | "agency_guidance"
    | "statutory_authority"
    | "original_authority";
  /** Node title (e.g., document or provision name). */
  title: string;
  /** Date of this step (ISO 8601). */
  date: string;
  /** Description of this step in the chain. */
  description: string;
  /** Source documenting this step. */
  source: Source;
  /** Earlier nodes in the chain (recursive). */
  children: TraceHistoryNode[];
  /** Kind of change this step introduced, if any. */
  changeType?: ChangeType;
  /** Human-readable summary of the change. */
  changeDescription?: string;
  /**
   * True when this node was assembled heuristically by the domain layer
   * rather than recorded in the underlying data (RFC #15 fabrication
   * quarantine).
   */
  synthesized?: boolean;
}

/** Vocabulary for describing how a provision changed. */
export type ChangeType =
  | "added"
  | "removed"
  | "modified"
  | "renumbered"
  | "reinterpreted"
  | "delegated"
  | "exempted"
  | "expanded"
  | "restricted";

/**
 * A structured diff between two versions of a regulatory document.
 */
export interface RegulatoryDiff {
  /** Unique identifier. */
  id: string;
  /** ID of the current document version. */
  documentId: string;
  /** ID of the previous document version being compared against. */
  previousVersionId: string;
  /** Kind of change detected. */
  changeType: ChangeType;
  /** Section/citation of the document that changed (e.g., "§ 1001.3(b)"). */
  section?: string;
  /** Text of the provision before the change. */
  previousText?: string;
  /** Text of the provision after the change. */
  currentText?: string;
  /** Date the change takes effect (ISO 8601). */
  effectiveDate: string;
  /** Source documenting the change (e.g., Federal Register notice). */
  source: Source;
  /**
   * True when this diff was synthesized heuristically by the domain layer
   * rather than detected from real document versions (RFC #15).
   */
  synthesized?: boolean;
}
