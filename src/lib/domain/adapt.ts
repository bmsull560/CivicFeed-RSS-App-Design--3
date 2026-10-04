/**
 * Pure per-record converters from the flat data shapes (`src/data/*`) to the
 * domain models (`src/models/*`). Each function converts exactly one record;
 * cross-record resolution and dataset-level queries live in `./resolve`, and
 * the enum mappings live in `./maps`.
 */

import type {
  Source as ModelSource,
  Claim as ModelClaim,
} from "../../models/evidence";
import type {
  Entity as ModelEntity,
  EntityRelationship as ModelEntityRelationship,
} from "../../models/entities";
import type { TimelineEvent as ModelTimelineEvent } from "../../models/timeline";
import type {
  ResearchProject as ModelResearchProject,
  ResearchQuestion as ModelResearchQuestion,
  EvidenceBoard as ModelEvidenceBoard,
  SourceCollection as ModelSourceCollection,
  Finding as ModelFinding,
} from "../../models/research";

import type { Source as DataSource } from "../../data/sources";
import type { Entity as DataEntity } from "../../data/entities";
import type { TimelineEvent as DataTimelineEvent } from "../../data/timeline";
import type {
  ResearchProject as DataResearchProject,
  Claim as DataClaim,
} from "../../data/research";

import {
  SOURCE_TYPE_MAP,
  ENTITY_TYPE_MAP,
  RELATIONSHIP_TYPE_MAP,
  EVENT_MODE_MAP,
  EVENT_TYPE_MAP,
  SIGNIFICANCE_MAP,
  EVIDENCE_STATUS_MAP,
} from "./maps";
import { resolveSources } from "./resolve";

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export function adaptSource(source: DataSource): ModelSource {
  return {
    id: source.id,
    url: source.url,
    title: source.title,
    sourceType: SOURCE_TYPE_MAP[source.sourceType],
    publicationDate: source.publicationDate,
    author: source.author,
    issuingOrganization: source.issuingOrganization,
    relevantPassage: source.relevantPassage,
    retrievedAt: source.retrievedAt,
  };
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export function adaptEntity(entity: DataEntity): ModelEntity {
  const relationships: ModelEntityRelationship[] = entity.relationships.map(
    (rel, index) => ({
      id: `${entity.id}-rel-${index}`,
      sourceEntityId: entity.id,
      targetEntityId: rel.targetId,
      relationshipType: RELATIONSHIP_TYPE_MAP[rel.type],
      description: rel.note,
      sources: [],
    })
  );
  return {
    id: entity.id,
    type: ENTITY_TYPE_MAP[entity.type],
    name: entity.name,
    description: entity.description,
    url: entity.url,
    establishedDate: entity.establishedDate,
    relationships,
    sources: resolveSources(entity.sources),
  };
}

// ---------------------------------------------------------------------------
// Timeline events
// ---------------------------------------------------------------------------

export function adaptTimelineEvent(event: DataTimelineEvent): ModelTimelineEvent {
  return {
    id: event.id,
    date: event.date,
    title: event.title,
    description: event.description,
    eventType: EVENT_TYPE_MAP[event.eventType][event.mode],
    mode: EVENT_MODE_MAP[event.eventType],
    entities: event.entities,
    sources: resolveSources(event.sources),
    significance: SIGNIFICANCE_MAP[event.significance],
  };
}

// ---------------------------------------------------------------------------
// Research projects
// ---------------------------------------------------------------------------

export function adaptClaim(claim: DataClaim): ModelClaim {
  return {
    id: claim.id,
    statement: claim.statement,
    evidenceStatus: EVIDENCE_STATUS_MAP[claim.evidenceStatus],
    sources: resolveSources(claim.sourceIds),
    notes: claim.note,
  };
}

/**
 * The data layer does not carry a per-question status, so derive it from the
 * claims assembled for the question instead of fabricating one.
 */
function deriveQuestionStatus(
  claims: ModelClaim[],
): ModelResearchQuestion["status"] {
  return claims.length > 0 ? "investigating" : "open";
}

/**
 * Findings are synthesized from the project's raw finding statements; the
 * data layer carries no confidence or evidence status for them, so both are
 * derived from the documented claims and the finding is marked
 * `synthesized: true` (RFC #15 fabrication quarantine).
 */
function adaptFinding(
  statement: string,
  index: number,
  project: DataResearchProject,
  documentedClaims: ModelClaim[],
): ModelFinding {
  return {
    id: `${project.id}-f${index + 1}`,
    projectId: project.id,
    title: statement.length > 60 ? `${statement.slice(0, 57)}…` : statement,
    statement,
    evidenceStatus: documentedClaims.length > 0 ? "documented" : "inferred",
    supportingClaims: documentedClaims,
    confidence:
      documentedClaims.length >= 2 ? "high" : documentedClaims.length === 1 ? "medium" : "low",
    createdAt: project.updatedAt,
    synthesized: true,
  };
}

export function adaptResearchProject(project: DataResearchProject): ModelResearchProject {
  const claims = project.claims.map(adaptClaim);

  const questions: ModelResearchQuestion[] = project.questions.map((question, index) => {
    // FABRICATION (retained, RFC #15): the data layer does not link claims to
    // questions, so claims are distributed across questions deterministically
    // (round-robin) such that each claim appears in exactly one question.
    const questionClaims =
      project.questions.length > 0
        ? claims.filter((_, claimIndex) => claimIndex % project.questions.length === index)
        : [];
    return {
      id: `${project.id}-q${index + 1}`,
      projectId: project.id,
      question,
      status: deriveQuestionStatus(questionClaims),
      claims: questionClaims,
    };
  });

  const evidenceBoards: ModelEvidenceBoard[] = project.evidenceBoards.map((board) => ({
    id: board.id,
    projectId: project.id,
    title: board.title,
    description: board.description,
    claims: board.claimIds
      .map((claimId) => claims.find((c) => c.id === claimId))
      .filter((c): c is ModelClaim => c !== undefined),
    connections: [],
  }));

  const sourceCollections: ModelSourceCollection[] = project.sourceCollections.map(
    (collection) => ({
      id: collection.id,
      projectId: project.id,
      name: collection.name,
      description: collection.description,
      sources: resolveSources(collection.sourceIds),
    })
  );

  const documentedClaims = claims.filter((c) => c.evidenceStatus === "documented");
  const findings: ModelFinding[] = project.findings.map((statement, index) =>
    adaptFinding(statement, index, project, documentedClaims),
  );

  return {
    id: project.id,
    title: project.title,
    // FABRICATION (retained, RFC #15): the data layer has no project
    // description, so one is synthesized from the topic IDs.
    description: `Evidence-first research workspace covering ${project.topicIds.length} topic(s): ${project.topicIds.join(", ")}.`,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    questions,
    evidenceBoards,
    sourceCollections,
    findings,
  };
}
