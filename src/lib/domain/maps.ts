/**
 * Vocabulary maps between the flat demo datasets (`src/data/*`) and the
 * richer domain models (`src/models/*`).
 *
 * This is the ONLY module in the domain layer that imports both vocabularies.
 * Each map is keyed by the exhaustive data-side enum so TypeScript rejects
 * unmapped values, and every deliberate lossy collapse is documented in
 * {@link LOSSY_MAPPINGS} (and pinned by the boundary tests).
 */

import type { SourceType as ModelSourceType, EvidenceStatus as ModelEvidenceStatus } from "../../models/evidence";
import type {
  EntityType as ModelEntityType,
  RelationshipType as ModelRelationshipType,
} from "../../models/entities";
import type {
  TimelineEventType as ModelTimelineEventType,
  TimelineMode as ModelTimelineMode,
  ChangeType,
  TimelineEvent as ModelTimelineEvent,
} from "../../models/timeline";

import type { SourceType as DataSourceType } from "../../data/sources";
import type {
  EntityType as DataEntityType,
  RelationshipType as DataRelationshipType,
} from "../../data/entities";
import type {
  EventType as DataEventType,
  EventMode as DataEventMode,
} from "../../data/timeline";
import type { EvidenceStatus as DataEvidenceStatus } from "../../data/research";

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export const SOURCE_TYPE_MAP: Record<DataSourceType, ModelSourceType> = {
  statute: "legislation",
  regulation: "regulation",
  "court-opinion": "court_opinion",
  "congressional-record": "congressional_record",
  "agency-guidance": "agency_guidance",
  "press-release": "press_release",
  report: "official_report",
  // LOSSY: no "executive_order" source type exists in the model vocabulary.
  "executive-order": "other",
  // LOSSY: appropriations documents are collapsed into official reports.
  appropriations: "official_report",
  news: "news_article",
};

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export const ENTITY_TYPE_MAP: Record<DataEntityType, ModelEntityType> = {
  person: "person",
  agency: "agency",
  organization: "organization",
  statute: "statute",
  regulation: "regulation",
  "court-case": "court_case",
  program: "program",
  funding: "appropriation",
};

/**
 * Relationship direction convention: the data vocabulary expresses the
 * relationship FROM the owning entity TO `targetId` (e.g. entity A with
 * `{ type: "amends", targetId: B }` means "A amends B"). The mapped model
 * value must preserve that direction — the model enum now carries explicit
 * forward-direction values ("amends", "regulated_by", "supersedes",
 * "overturns", "establishes") so no inversion is needed.
 */
export const RELATIONSHIP_TYPE_MAP: Record<DataRelationshipType, ModelRelationshipType> = {
  // LOSSY: no "leads" in the model vocabulary.
  leads: "related_to",
  // Near-synonym collapse: the model vocabulary has no "administers".
  administers: "enforces",
  enforces: "enforces",
  implements: "implements",
  // "created-by" is already inverse-direction in the data, so the inverse
  // model value is correct.
  "created-by": "established_by",
  // FIX (RFC #15): was "amended_by", which inverts the direction
  // ("A amends B" was rendered as "A is amended by B").
  amends: "amends",
  "challenged-by": "challenged_by",
  // FIX (RFC #15): was "overturned_by", inverting "A overruled B".
  overruled: "overturns",
  funds: "funds",
  // LOSSY: no "advocates-for" in the model vocabulary.
  "advocates-for": "related_to",
  // FIX (RFC #15): was "regulates", inverting "A is regulated by B".
  "regulated-by": "regulated_by",
  "part-of": "part_of",
  // FIX (RFC #15): was "superseded_by", inverting "A supersedes B".
  supersedes: "supersedes",
  // FIX (RFC #15): was "established_by", inverting "A established B".
  established: "establishes",
};

// ---------------------------------------------------------------------------
// Timeline events
// ---------------------------------------------------------------------------

export const EVENT_MODE_MAP: Record<DataEventType, ModelTimelineMode> = {
  legislative: "legislative",
  regulatory: "regulatory",
  court: "judicial",
  administrative: "administrative",
  funding: "funding",
};

export const EVENT_TYPE_MAP: Record<DataEventType, Record<DataEventMode, ModelTimelineEventType>> = {
  legislative: {
    enacted: "law_enacted",
    proposed: "law_enacted",
    challenged: "court_filed",
    blocked: "law_repealed",
    implemented: "law_enacted",
  },
  regulatory: {
    enacted: "regulation_final",
    proposed: "regulation_proposed",
    challenged: "court_filed",
    blocked: "regulation_repealed",
    implemented: "policy_changed",
  },
  court: {
    enacted: "court_decided",
    proposed: "court_filed",
    challenged: "court_appealed",
    blocked: "court_overturned",
    implemented: "court_decided",
  },
  administrative: {
    enacted: "executive_order",
    proposed: "guidance_issued",
    challenged: "investigation_opened",
    blocked: "policy_changed",
    implemented: "policy_changed",
  },
  funding: {
    enacted: "funding_appropriated",
    proposed: "funding_allocated",
    challenged: "funding_allocated",
    blocked: "funding_allocated",
    implemented: "grant_awarded",
  },
};

/**
 * Significance polarity convention (data side): 1 = MOST significant
 * (landmark), 2 = major, 3 = routine. Do not invert — 1 maps to the model's
 * highest weight, "milestone".
 */
export const SIGNIFICANCE_MAP: Record<1 | 2 | 3, ModelTimelineEvent["significance"]> = {
  1: "milestone",
  2: "major",
  3: "minor",
};

// ---------------------------------------------------------------------------
// Research projects
// ---------------------------------------------------------------------------

export const EVIDENCE_STATUS_MAP: Record<DataEvidenceStatus, ModelEvidenceStatus> = {
  supported: "documented",
  "partially-supported": "inferred",
  contested: "disputed",
  unsupported: "inconclusive",
  pending: "unverified",
};

// ---------------------------------------------------------------------------
// Trace history
// ---------------------------------------------------------------------------

export const TRACE_CHANGE_TYPE: Record<DataEventType, ChangeType> = {
  legislative: "modified",
  regulatory: "modified",
  court: "reinterpreted",
  administrative: "delegated",
  funding: "expanded",
};

// ---------------------------------------------------------------------------
// Lossy mapping registry
// ---------------------------------------------------------------------------

/**
 * Registry of deliberate lossy collapses, keyed by mapping name. Each entry
 * lists `"<data value> → <model value>"` pairs where distinct data values
 * lose information. Boundary tests assert that no map collapses to
 * "other"/"related_to" unless it is listed here.
 */
export const LOSSY_MAPPINGS: Record<string, string[]> = {
  SOURCE_TYPE_MAP: [
    "executive-order → other",
    "appropriations → official_report",
  ],
  RELATIONSHIP_TYPE_MAP: [
    "leads → related_to",
    "advocates-for → related_to",
  ],
};
