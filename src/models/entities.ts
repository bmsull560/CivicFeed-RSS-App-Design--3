/**
 * Knowledge-graph entity models.
 *
 * Entities are the people, organizations, laws, regulations, and other
 * civic objects that appear across sources. Relationships form a typed,
 * sourced graph between them.
 */

import type { Source } from "./evidence";

/** The category of a knowledge-graph entity. */
export type EntityType =
  | "person"
  | "organization"
  | "agency"
  | "bill"
  | "statute"
  | "regulation"
  | "guidance"
  | "court_case"
  | "program"
  | "grant"
  | "contract"
  | "appropriation"
  | "tax_expenditure"
  | "research"
  | "event";

/**
 * A node in the civic knowledge graph.
 */
export interface Entity {
  /** Unique identifier. */
  id: string;
  /** Category of the entity. */
  type: EntityType;
  /** Canonical display name. */
  name: string;
  /** Short description of the entity. */
  description?: string;
  /** Alternative names, abbreviations, or former names. */
  aliases?: string[];
  /** Canonical external URL (official page, if any). */
  url?: string;
  /** Date the entity was established (ISO 8601), if applicable. */
  establishedDate?: string;
  /** Date the entity was dissolved/repealed (ISO 8601), if applicable. */
  dissolvedDate?: string;
  /** Typed relationships to other entities. */
  relationships: EntityRelationship[];
  /** Sources documenting this entity. */
  sources: Source[];
  /** Domain-specific extra attributes (serializable primitives only). */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * A directed, typed, and sourced edge between two entities.
 */
export interface EntityRelationship {
  /** Unique identifier. */
  id: string;
  /** ID of the entity the relationship originates from. */
  sourceEntityId: string;
  /** ID of the entity the relationship points to. */
  targetEntityId: string;
  /** Nature of the relationship. */
  relationshipType: RelationshipType;
  /** When the relationship began (ISO 8601), if known. */
  startDate?: string;
  /** When the relationship ended (ISO 8601), if applicable. */
  endDate?: string;
  /** Human-readable description of the relationship. */
  description?: string;
  /** Sources documenting this relationship. */
  sources: Source[];
}

/** Vocabulary of relationship types between entities. */
export type RelationshipType =
  | "established_by"
  // Forward-direction counterparts added for the domain seam (RFC #15): the
  // data vocabulary expresses these relationships in the forward direction
  // (e.g. "A amends B"), so they must not collapse into the inverse forms.
  | "establishes"
  | "supersedes"
  | "superseded_by"
  | "amends"
  | "amended_by"
  | "implements"
  | "enforces"
  | "regulates"
  | "regulated_by"
  | "overturns"
  | "overturned_by"
  | "funds"
  | "appropriated_to"
  | "contracted_to"
  | "appointed_to"
  | "serves_on"
  | "member_of"
  | "opinion_in"
  | "cites"
  | "part_of"
  | "parent_of"
  | "subordinate_to"
  | "related_to"
  | "authored_by"
  | "signed_by"
  | "voted_on_by"
  | "sponsored_by"
  | "challenged_by";

/**
 * Filter criteria for querying the entity graph. All fields optional;
 * provided fields are combined with AND semantics.
 */
export interface EntityQuery {
  /** Restrict to a single entity type. */
  type?: EntityType;
  /** Case-insensitive substring match on the entity name. */
  nameContains?: string;
  /** Restrict to entities related to this entity ID. */
  relatedTo?: string;
  /** Restrict to relationships of this type (used with `relatedTo`). */
  relationshipType?: RelationshipType;
}
