/**
 * Research workspace models.
 *
 * A {@link ResearchProject} is a container for open questions, evidence
 * boards, curated source collections, and synthesized findings.
 */

import type { Claim, EvidenceStatus, Source } from "./evidence";

/**
 * A research workspace grouping questions, evidence, and findings.
 */
export interface ResearchProject {
  /** Unique identifier. */
  id: string;
  /** Project title. */
  title: string;
  /** What the project is investigating. */
  description: string;
  /** Creation timestamp (ISO 8601). */
  createdAt: string;
  /** Last-modified timestamp (ISO 8601). */
  updatedAt: string;
  /** Research questions driving the investigation. */
  questions: ResearchQuestion[];
  /** Visual evidence boards organizing claims. */
  evidenceBoards: EvidenceBoard[];
  /** Curated collections of sources. */
  sourceCollections: SourceCollection[];
  /** Synthesized findings produced by the project. */
  findings: Finding[];
}

/** A single question under investigation within a project. */
export interface ResearchQuestion {
  /** Unique identifier. */
  id: string;
  /** ID of the owning {@link ResearchProject}. */
  projectId: string;
  /** The question being investigated. */
  question: string;
  /** Investigation status. */
  status: "open" | "investigating" | "answered" | "unanswerable";
  /** Claims assembled while answering the question. */
  claims: Claim[];
  /** Researcher notes. */
  notes?: string;
}

/**
 * A visual board where claims are arranged and connected to show how
 * evidence relates to an argument.
 */
export interface EvidenceBoard {
  /** Unique identifier. */
  id: string;
  /** ID of the owning {@link ResearchProject}. */
  projectId: string;
  /** Board title. */
  title: string;
  /** Optional description of the board's purpose. */
  description?: string;
  /** Claims placed on the board. */
  claims: Claim[];
  /** Typed connections between claims on the board. */
  connections: EvidenceConnection[];
  /** Saved visual layout, if the user arranged the board manually. */
  layout?: BoardLayout;
}

/** A typed edge between two claims on an evidence board. */
export interface EvidenceConnection {
  /** Unique identifier. */
  id: string;
  /** ID of the claim the connection starts from. */
  fromClaimId: string;
  /** ID of the claim the connection points to. */
  toClaimId: string;
  /** How the two claims relate. */
  relationshipType: "supports" | "contradicts" | "related" | "depends_on";
  /** Notes about the connection. */
  notes?: string;
}

/** Persisted visual layout of an evidence board. */
export interface BoardLayout {
  /** Position of each claim node on the canvas. */
  nodes: { claimId: string; x: number; y: number }[];
  /** Canvas zoom level (1 = 100%). */
  zoom: number;
  /** Horizontal pan offset in canvas coordinates. */
  panX: number;
  /** Vertical pan offset in canvas coordinates. */
  panY: number;
}

/** A named, curated collection of sources within a project. */
export interface SourceCollection {
  /** Unique identifier. */
  id: string;
  /** ID of the owning {@link ResearchProject}. */
  projectId: string;
  /** Collection name. */
  name: string;
  /** Optional description of the collection. */
  description?: string;
  /** Sources in the collection. */
  sources: Source[];
}

/**
 * A synthesized conclusion of a research project, with its supporting
 * evidence and an explicit confidence level.
 */
export interface Finding {
  /** Unique identifier. */
  id: string;
  /** ID of the owning {@link ResearchProject}. */
  projectId: string;
  /** Short finding title. */
  title: string;
  /** The full finding statement. */
  statement: string;
  /** Epistemic status of the finding. */
  evidenceStatus: EvidenceStatus;
  /** Claims that support the finding. */
  supportingClaims: Claim[];
  /** Claims that count against the finding. */
  counterEvidence?: Claim[];
  /** Descriptions of evidence that would be needed but is missing. */
  missingEvidence?: string[];
  /** Overall confidence in the finding. */
  confidence: "high" | "medium" | "low";
  /** Creation timestamp (ISO 8601). */
  createdAt: string;
  /**
   * True when any part of this finding was synthesized by the adapter layer
   * rather than carried by the underlying data (RFC #15 fabrication
   * quarantine).
   */
  synthesized?: boolean;
}
