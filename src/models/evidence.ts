/**
 * Evidence & Provenance models.
 *
 * Core primitives for the evidence-first research platform: every factual
 * statement is represented as a {@link Claim} backed by {@link Source}
 * documents, with {@link Provenance} records describing how a source
 * supports a claim.
 */

/** Classification of a source document. */
export type SourceType =
  | "legislation"
  | "regulation"
  | "court_opinion"
  | "agency_guidance"
  | "press_release"
  | "official_report"
  | "academic_research"
  | "news_article"
  | "congressional_record"
  | "federal_register"
  | "data_set"
  | "other";

/**
 * Epistemic status of a claim given the currently available evidence.
 *
 * - `documented` — Directly supported by sources.
 * - `inferred` — Reasonable inference from documented facts.
 * - `disputed` — Conflicting evidence exists.
 * - `inconclusive` — Insufficient evidence to decide.
 * - `unverified` — Not yet checked against sources.
 */
export type EvidenceStatus =
  | "documented"
  | "inferred"
  | "disputed"
  | "inconclusive"
  | "unverified";

/**
 * A single source document (primary or secondary) that can support or
 * contradict a claim.
 */
export interface Source {
  /** Unique identifier. */
  id: string;
  /** Canonical URL of the source. */
  url: string;
  /** URL of an archived snapshot (e.g., Wayback Machine), if captured. */
  archivedUrl?: string;
  /** Document title. */
  title: string;
  /** Classification of the document. */
  sourceType: SourceType;
  /** Publication date in ISO 8601 format. */
  publicationDate: string;
  /** Date the document takes legal/practical effect, if different. */
  effectiveDate?: string;
  /** Author of the document, if known. */
  author?: string;
  /** Organization that issued the document. */
  issuingOrganization?: string;
  /** The specific passage relevant to the supported claim. */
  relevantPassage?: string;
  /** ID of the RSS {@link Feed} this source was discovered via, if any. */
  feedId?: string;
  /** When the source was retrieved (ISO 8601). */
  retrievedAt: string;
}

/**
 * A factual assertion with its supporting (and possibly contradicting)
 * evidence.
 */
export interface Claim {
  /** Unique identifier. */
  id: string;
  /** The assertion being made, stated precisely and neutrally. */
  statement: string;
  /** Current epistemic status based on available evidence. */
  evidenceStatus: EvidenceStatus;
  /** Sources that support the claim. */
  sources: Source[];
  /** Sources that contradict or qualify the claim. */
  counterEvidence?: Source[];
  /** Date-specific context for historical claims (e.g., "as of 1994"). */
  dateContext?: string;
  /** Researcher notes about the claim. */
  notes?: string;
}

/**
 * Records how a specific source supports a specific claim, including the
 * method of extraction and the researcher's confidence.
 */
export interface Provenance {
  /** ID of the supporting {@link Source}. */
  sourceId: string;
  /** ID of the supported {@link Claim}. */
  claimId: string;
  /** How the evidence was extracted from the source. */
  extractionMethod: "direct_quote" | "paraphrase" | "inference";
  /** Researcher confidence in this provenance link. */
  confidence: "high" | "medium" | "low";
  /** Additional notes about the extraction. */
  notes?: string;
}
