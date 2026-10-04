/**
 * Boundary tests for the domain seam (RFC #15):
 *  1. Map exhaustiveness over the real data files.
 *  2. Direction/polarity pins for the corrected mappings.
 *  3. No-fabrication invariants for research projects and trace nodes.
 *  4. View-model contracts.
 *  5. Whole-dataset integrity.
 */

import { describe, expect, it } from "vitest";

import { sources as dataSources } from "../../../data/sources";
import { entities as dataEntities } from "../../../data/entities";
import { timelineEvents as dataTimelineEvents } from "../../../data/timeline";
import { researchProjects as dataResearchProjects } from "../../../data/research";
import { topics as dataTopics } from "../../../data/topics";

import {
  SOURCE_TYPE_MAP,
  ENTITY_TYPE_MAP,
  RELATIONSHIP_TYPE_MAP,
  EVENT_MODE_MAP,
  EVENT_TYPE_MAP,
  SIGNIFICANCE_MAP,
  EVIDENCE_STATUS_MAP,
  TRACE_CHANGE_TYPE,
  LOSSY_MAPPINGS,
} from "../maps";
import { adaptResearchProject } from "../adapt";
import { buildTraceHistory, validateDataset } from "../resolve";
import { getResearchProjectView, getTopicView, resolveTopicRef } from "../viewModels";
import type { TraceHistoryNode } from "../../../models/timeline";

// ---------------------------------------------------------------------------
// 1. Map exhaustiveness
// ---------------------------------------------------------------------------

const LOSSY_TARGETS = new Set(["other", "related_to"]);

function lossyEntries(mapName: string): Set<string> {
  return new Set(
    (LOSSY_MAPPINGS[mapName] ?? []).map((entry) => entry.split(" → ")[0]),
  );
}

describe("map exhaustiveness over real data", () => {
  it("every observed source type is mapped", () => {
    for (const source of dataSources) {
      expect(SOURCE_TYPE_MAP[source.sourceType], source.sourceType).toBeDefined();
    }
  });

  it("no source type collapses to a lossy target unless registered", () => {
    const allowed = lossyEntries("SOURCE_TYPE_MAP");
    for (const [dataValue, modelValue] of Object.entries(SOURCE_TYPE_MAP)) {
      if (LOSSY_TARGETS.has(modelValue)) {
        expect(allowed.has(dataValue), `${dataValue} → ${modelValue}`).toBe(true);
      }
    }
  });

  it("every observed entity type is mapped", () => {
    for (const entity of dataEntities) {
      expect(ENTITY_TYPE_MAP[entity.type], entity.type).toBeDefined();
    }
  });

  it("every observed relationship type is mapped", () => {
    for (const entity of dataEntities) {
      for (const rel of entity.relationships) {
        expect(RELATIONSHIP_TYPE_MAP[rel.type], rel.type).toBeDefined();
      }
    }
  });

  it("no relationship type collapses to a lossy target unless registered", () => {
    const allowed = lossyEntries("RELATIONSHIP_TYPE_MAP");
    for (const [dataValue, modelValue] of Object.entries(RELATIONSHIP_TYPE_MAP)) {
      if (LOSSY_TARGETS.has(modelValue)) {
        expect(allowed.has(dataValue), `${dataValue} → ${modelValue}`).toBe(true);
      }
    }
  });

  it("every observed event type/mode/significance is mapped", () => {
    for (const event of dataTimelineEvents) {
      expect(EVENT_MODE_MAP[event.eventType], event.eventType).toBeDefined();
      expect(
        EVENT_TYPE_MAP[event.eventType][event.mode],
        `${event.eventType}/${event.mode}`,
      ).toBeDefined();
      expect(SIGNIFICANCE_MAP[event.significance], String(event.significance)).toBeDefined();
    }
  });

  it("every observed evidence status is mapped", () => {
    for (const project of dataResearchProjects) {
      for (const claim of project.claims) {
        expect(EVIDENCE_STATUS_MAP[claim.evidenceStatus], claim.evidenceStatus).toBeDefined();
      }
    }
  });

  it("every observed trace change type is mapped", () => {
    for (const event of dataTimelineEvents) {
      expect(TRACE_CHANGE_TYPE[event.eventType], event.eventType).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Direction / polarity pins
// ---------------------------------------------------------------------------

describe("direction and polarity pins", () => {
  it('regulated-by maps to "regulated_by" (not inverted to "regulates")', () => {
    expect(RELATIONSHIP_TYPE_MAP["regulated-by"]).toBe("regulated_by");
  });

  it('amends maps to "amends" (not inverted to "amended_by")', () => {
    expect(RELATIONSHIP_TYPE_MAP.amends).toBe("amends");
  });

  it("other directional pairs keep their forward direction", () => {
    expect(RELATIONSHIP_TYPE_MAP.supersedes).toBe("supersedes");
    expect(RELATIONSHIP_TYPE_MAP.overruled).toBe("overturns");
    expect(RELATIONSHIP_TYPE_MAP.established).toBe("establishes");
    // Already-inverse data values keep inverse model values.
    expect(RELATIONSHIP_TYPE_MAP["created-by"]).toBe("established_by");
    expect(RELATIONSHIP_TYPE_MAP["challenged-by"]).toBe("challenged_by");
  });

  it("significance polarity: data 1 = most significant → milestone", () => {
    expect(SIGNIFICANCE_MAP[1]).toBe("milestone");
    expect(SIGNIFICANCE_MAP[2]).toBe("major");
    expect(SIGNIFICANCE_MAP[3]).toBe("minor");
  });
});

// ---------------------------------------------------------------------------
// 3. No-fabrication invariants
// ---------------------------------------------------------------------------

describe("no-fabrication invariants", () => {
  it("adapted claim count equals data claim count, each claim in exactly one question", () => {
    for (const project of dataResearchProjects) {
      const adapted = adaptResearchProject(project);
      const distributed = adapted.questions.flatMap((q) => q.claims);
      expect(distributed.length, project.id).toBe(project.claims.length);
      const seen = new Set<string>();
      for (const claim of distributed) {
        expect(seen.has(claim.id), `${project.id}:${claim.id} duplicated`).toBe(false);
        seen.add(claim.id);
      }
      expect(new Set(project.claims.map((c) => c.id))).toEqual(seen);
    }
  });

  it("adapted findings carry synthesized: true", () => {
    for (const project of dataResearchProjects) {
      const adapted = adaptResearchProject(project);
      expect(adapted.findings.length).toBe(project.findings.length);
      for (const finding of adapted.findings) {
        expect(finding.synthesized, finding.id).toBe(true);
      }
    }
  });

  it("trace nodes never invent changeDescription prose and are marked synthesized", () => {
    const walk = (node: TraceHistoryNode): TraceHistoryNode[] => [
      node,
      ...node.children.flatMap(walk),
    ];
    for (const topic of dataTopics) {
      const root = buildTraceHistory(topic);
      if (!root) continue;
      for (const node of walk(root)) {
        expect(node.changeDescription, node.id).toBeUndefined();
        expect(node.synthesized, node.id).toBe(true);
        expect(node.source, node.id).toBeDefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. View-model contracts
// ---------------------------------------------------------------------------

describe("view-model contracts", () => {
  it("getTopicView returns undefined for a nonexistent slug", () => {
    expect(getTopicView("nonexistent-slug")).toBeUndefined();
  });

  it("a topic ref pointing at a nonexistent entity yields existsInGraph: false", () => {
    // Find a real topic ref with no matching knowledge-graph entity, if any
    // exist; otherwise verify the fallback contract synthetically via a slug
    // lookup on every topic's refs.
    const views = dataTopics
      .map((t) => getTopicView(t.slug))
      .filter((v): v is NonNullable<typeof v> => v !== undefined);
    const allRefs = views.flatMap((v) => [
      ...v.legislation,
      ...v.regulations,
      ...v.agencies,
      ...v.organizations,
      ...v.people,
    ]);
    const knownIds = new Set(dataEntities.map((e) => e.id));
    for (const ref of allRefs) {
      expect(ref.existsInGraph, ref.entity.id).toBe(knownIds.has(ref.entity.id));
      if (!ref.existsInGraph) {
        expect(ref.entity.relationships).toEqual([]);
        expect(ref.entity.sources).toEqual([]);
      }
    }
    // Direct boundary check: a ref pointing at a nonexistent entity yields
    // the display-only fallback with existsInGraph: false.
    const fallback = resolveTopicRef({
      entityId: "ent-does-not-exist",
      name: "Placeholder Entity",
      description: "Not in the knowledge graph.",
    });
    expect(fallback.existsInGraph).toBe(false);
    expect(fallback.entity).toMatchObject({
      id: "ent-does-not-exist",
      name: "Placeholder Entity",
      relationships: [],
      sources: [],
    });
  });

  it('getResearchProjectView("rp-001") returns questions/boards/findings arrays', () => {
    const view = getResearchProjectView("rp-001");
    expect(view).toBeDefined();
    expect(Array.isArray(view?.questions)).toBe(true);
    expect(Array.isArray(view?.evidenceBoards)).toBe(true);
    expect(Array.isArray(view?.findings)).toBe(true);
    expect(Array.isArray(view?.sourceCollections)).toBe(true);
  });

  it("getResearchProjectView returns undefined for unknown ids", () => {
    expect(getResearchProjectView("rp-does-not-exist")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5. Integrity
// ---------------------------------------------------------------------------

describe("dataset integrity", () => {
  it("validateDataset() over the real dataset returns no errors", () => {
    expect(validateDataset()).toEqual([]);
  });
});
