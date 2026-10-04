/**
 * Enum mapping tables from the flat data-layer vocabulary (`src/data/*`) to
 * the domain-model vocabulary (`src/models/*`). All maps are total over the
 * values present in the real dataset (verified by tests).
 */

import type { SourceType as ModelSourceType } from "../../models/evidence";
import type {
  EntityType as ModelEntityType,
  RelationshipType as ModelRelationshipType,
} from "../../models/entities";
import type {
  TimelineEventType as ModelTimelineEventType,
  TimelineMode as ModelTimelineMode,
  TimelineEvent as ModelTimelineEvent,
} from "../../models/timeline";
import type { EvidenceStatus as ModelEvidenceStatus } from "../../models/evidence";

import type { SourceType as DataSourceType } from "../../data/sources";
import type {
  EntityType as DataEntityType,
  RelationshipType as DataRelationshipType,
} from "../../data/entities";
import type {
  TimelineEventType as DataTimelineEventType,
  TimelineEvent as DataTimelineEvent,
} from "../../data/timeline";
import type { EvidenceStatus as DataEvidenceStatus } from "../../data/research";

export const SOURCE_TYPE_MAP: Record<DataSourceType, ModelSourceType> = {
  statute: "legislation",
  regulation: "regulation",
  court_decision: "court_opinion",
  agency_guidance: "agency_guidance",
  executive_order: "agency_guidance",
  press_release: "press_release",
  report: "official_report",
  hearing: "congressional_record",
  appropriations: "official_report",
  news: "news_article",
};

// LOSSY_MAPPINGS (documented collapse): the data vocabulary distinguishes
// documents by venue/status that the model vocabulary merges:
//   executive_order → agency_guidance, appropriations → official_report,
//   hearing → congressional_record.

export const ENTITY_TYPE_MAP: Record<DataEntityType, ModelEntityType> = {
  person: "person",
  agency: "agency",
  organization: "organization",
  statute: "statute",
  regulation: "regulation",
  court_case: "court_case",
  program: "program",
  appropriation: "appropriation",
};

export const RELATIONSHIP_TYPE_MAP: Record<DataRelationshipType, ModelRelationshipType> = {
  related_to: "related_to",
  enforces: "enforces",
  implements: "implements",
  established_by: "established_by",
  amends: "amends",
  challenged_by: "challenged_by",
  overturns: "overturns",
  overturned_by: "overturned_by",
  funds: "funds",
  "regulated-by": "regulated_by",
  part_of: "part_of",
  supersedes: "supersedes",
  superseded_by: "superseded_by",
  amended_by: "amended_by",
};

// Direction/polarity note (RFC #15 verifier pins): "regulated-by" maps to
// the model's passive "regulated_by" WITHOUT inverting edge orientation — the
// data-layer edge source is the regulated party, target is the regulator, and
// "X regulated_by Y" preserves that direction. "amends" is forward-directed
// (A amends B) and must not collapse into "amended_by".

export const EVENT_MODE_MAP: Record<DataTimelineEventType, ModelTimelineMode> = {
  law_enacted: "legislative",
  law_amended: "legislative",
  regulation_proposed: "regulatory",
  regulation_final: "regulatory",
  regulation_amended: "regulatory",
  executive_order: "administrative",
  guidance_issued: "administrative",
  court_decision: "judicial",
  court_appeal: "judicial",
  agency_established: "organizational",
  funding_appropriated: "funding",
  funding_allocated: "funding",
  person_appointed: "organizational",
  hearing_held: "legislative",
  report_published: "administrative",
};

export const EVENT_TYPE_MAP: Record<DataTimelineEventType, Record<DataTimelineEvent["mode"], ModelTimelineEventType>> = {
  law_enacted: { legislative: "law_enacted" },
  law_amended: { legislative: "law_amended" },
  regulation_proposed: { regulatory: "regulation_proposed" },
  regulation_final: { regulatory: "regulation_final" },
  regulation_amended: { regulatory: "regulation_amended" },
  executive_order: { administrative: "executive_order" },
  guidance_issued: { administrative: "guidance_issued" },
  court_decision: { judicial: "court_decided" },
  court_appeal: { judicial: "court_appealed" },
  agency_established: { organizational: "agency_established" },
  funding_appropriated: { funding: "funding_appropriated" },
  funding_allocated: { funding: "funding_allocated" },
  person_appointed: { organizational: "person_appointed" },
  hearing_held: { legislative: "hearing_held" },
  report_published: { administrative: "report_published" },
};

// Significance polarity (RFC #15 verifier pin): data 1 is the HIGHEST
// significance, mapping to the model's "milestone"; 3 is the lowest ("minor").
export const SIGNIFICANCE_MAP: Record<DataTimelineEvent["significance"], ModelTimelineEvent["significance"]> = {
  1: "milestone",
  2: "major",
  3: "minor",
};

export const EVIDENCE_STATUS_MAP: Record<DataEvidenceStatus, ModelEvidenceStatus> = {
  documented: "documented",
  inferred: "inferred",
  disputed: "disputed",
  inconclusive: "inconclusive",
};
