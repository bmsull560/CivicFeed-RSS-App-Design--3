// Sample Research Projects — demonstrate the evidence-first workflow:
// questions -> claims (with evidence status) -> evidence boards -> findings.

export type EvidenceStatus =
  | "supported"
  | "partially-supported"
  | "contested"
  | "unsupported"
  | "pending";

export interface Claim {
  id: string;
  statement: string;
  evidenceStatus: EvidenceStatus;
  sourceIds: string[]; // src-NNN
  entityIds: string[]; // ent-NNN
  note?: string;
}

export interface EvidenceBoard {
  id: string;
  title: string;
  description: string;
  claimIds: string[];
  eventIds: string[]; // evt-NNN
}

export interface SourceCollection {
  id: string;
  name: string;
  description: string;
  sourceIds: string[];
}

export interface ResearchProject {
  id: string;
  title: string;
  topicIds: string[];
  createdAt: string;
  updatedAt: string;
  questions: string[];
  claims: Claim[];
  evidenceBoards: EvidenceBoard[];
  sourceCollections: SourceCollection[];
  findings: string[];
}

export const researchProjects: ResearchProject[] = [
  // ---------- Project 1: Climate policy evolution ----------
  {
    id: "rp-001",
    title: "How did climate policy evolve from 2009–2024?",
    topicIds: ["tp-001", "tp-004"],
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2024-09-20T15:30:00Z",
    questions: [
      "Why did climate policy shift from command-and-control regulation to incentive-based spending?",
      "How did Supreme Court decisions reshape EPA's regulatory options between 2007 and 2022?",
      "What mechanisms does the IRA use to achieve emissions reductions, and how are they funded?",
    ],
    claims: [
      {
        id: "clm-001",
        statement: "The 2007 Massachusetts v. EPA ruling created the legal foundation for all subsequent federal greenhouse gas regulation.",
        evidenceStatus: "supported",
        sourceIds: ["src-006", "src-032"],
        entityIds: ["ent-051", "ent-031", "ent-010"],
      },
      {
        id: "clm-002",
        statement: "The Clean Power Plan was never implemented because it was stayed by the Supreme Court and later repealed before taking effect.",
        evidenceStatus: "supported",
        sourceIds: ["src-002", "src-003"],
        entityIds: ["ent-040", "ent-050"],
      },
      {
        id: "clm-003",
        statement: "West Virginia v. EPA (2022) eliminated EPA's authority to regulate greenhouse gases under the Clean Air Act.",
        evidenceStatus: "contested",
        sourceIds: ["src-003", "src-031", "src-004"],
        entityIds: ["ent-050", "ent-010"],
        note: "The ruling rejected generation-shifting specifically; EPA continued to finalize methane and vehicle rules afterward, so 'eliminated' overstates the holding.",
      },
      {
        id: "clm-004",
        statement: "The Inflation Reduction Act committed roughly $369 billion to climate and clean energy, the largest such investment in U.S. history.",
        evidenceStatus: "supported",
        sourceIds: ["src-001", "src-005"],
        entityIds: ["ent-030", "ent-070", "ent-061"],
      },
      {
        id: "clm-005",
        statement: "Post-2022 climate rules are legally narrower than pre-2022 rules because of the major questions doctrine.",
        evidenceStatus: "partially-supported",
        sourceIds: ["src-003", "src-004", "src-031"],
        entityIds: ["ent-050", "ent-010"],
        note: "Consistent with agency statements and rule preambles, but the doctrinal effect is still being litigated.",
      },
    ],
    evidenceBoards: [
      {
        id: "clm-001-board",
        title: "Regulation Era (2007–2021)",
        description: "Clean Air Act litigation and rulemaking from Mass v. EPA through the Clean Power Plan's demise.",
        claimIds: ["clm-001", "clm-002"],
        eventIds: ["evt-001", "evt-002", "evt-003"],
      },
      {
        id: "clm-004-board",
        title: "Incentive Era (2022–2024)",
        description: "IRA spending programs and narrowed post-West Virginia rulemaking.",
        claimIds: ["clm-003", "clm-004", "clm-005"],
        eventIds: ["evt-004", "evt-005", "evt-006", "evt-007"],
      },
    ],
    sourceCollections: [
      {
        id: "rp-001-coll-1",
        name: "Court Opinions",
        description: "The three controlling Supreme Court decisions.",
        sourceIds: ["src-006", "src-003"],
      },
      {
        id: "rp-001-coll-2",
        name: "IRA Implementation",
        description: "Statute text and EPA grant announcements.",
        sourceIds: ["src-001", "src-005", "src-032"],
      },
    ],
    findings: [
      "Federal climate policy moved through three distinct eras: statutory interpretation (2007–2015), regulatory ambition and judicial retrenchment (2015–2022), and incentive-driven spending (2022–present).",
      "The judiciary, not Congress, set the boundaries of regulatory climate policy; only the IRA represents durable legislative action.",
      "IRA implementation is the key open variable: $27B in GGRF awards were announced in April 2024, but emissions outcomes depend on execution through 2026 and beyond.",
    ],
  },

  // ---------- Project 2: Immigration reform effectiveness ----------
  {
    id: "rp-002",
    title: "What is the evidence for immigration reform effectiveness?",
    topicIds: ["tp-002"],
    createdAt: "2024-08-10T09:00:00Z",
    updatedAt: "2024-09-18T11:00:00Z",
    questions: [
      "What outcomes can be attributed to DACA since 2012?",
      "Did the 2019 public charge rule change benefit enrollment among eligible families?",
      "Why has comprehensive legislation repeatedly failed while executive actions proliferate?",
    ],
    claims: [
      {
        id: "clm-010",
        statement: "DACA was created administratively in 2012 only after the DREAM Act failed to pass Congress for over a decade.",
        evidenceStatus: "supported",
        sourceIds: ["src-012", "src-007"],
        entityIds: ["ent-034", "ent-041", "ent-011"],
      },
      {
        id: "clm-011",
        statement: "The Supreme Court upheld DACA on the merits as lawful policy.",
        evidenceStatus: "unsupported",
        sourceIds: ["src-008"],
        entityIds: ["ent-052", "ent-041"],
        note: "The Court ruled only that the 2017 rescission was procedurally defective under the APA; it did not rule on DACA's legality. District courts have since ruled against the program for new applicants.",
      },
      {
        id: "clm-012",
        statement: "The 2019 public charge rule produced documented chilling effects on benefit enrollment before being rescinded in 2021.",
        evidenceStatus: "partially-supported",
        sourceIds: ["src-010", "src-033"],
        entityIds: ["ent-042", "ent-012"],
        note: "DHS acknowledged chilling effects in the rescission; magnitude estimates vary across studies.",
      },
      {
        id: "clm-013",
        statement: "The 2024 border entry restrictions were a direct response to the collapse of the bipartisan Senate border deal.",
        evidenceStatus: "supported",
        sourceIds: ["src-011", "src-029"],
        entityIds: ["ent-011", "ent-002", "ent-072"],
      },
    ],
    evidenceBoards: [
      {
        id: "rp-002-board-1",
        title: "Legislative Failure Timeline",
        description: "From the 2001 DREAM Act to the failed 2013 Senate bill and 2024 border deal.",
        claimIds: ["clm-010", "clm-013"],
        eventIds: ["evt-008", "evt-010", "evt-014"],
      },
      {
        id: "rp-002-board-2",
        title: "Executive Action & Judicial Review",
        description: "DACA and public charge as case studies in administrative policymaking and its limits.",
        claimIds: ["clm-011", "clm-012"],
        eventIds: ["evt-009", "evt-011", "evt-012", "evt-013"],
      },
    ],
    sourceCollections: [
      {
        id: "rp-002-coll-1",
        name: "Primary Legal Documents",
        description: "Memos, rules, and opinions governing DACA and public charge.",
        sourceIds: ["src-007", "src-008", "src-010", "src-033"],
      },
    ],
    findings: [
      "Immigration policy since 2001 has been made primarily through executive action and litigation, not legislation — every comprehensive bill has failed.",
      "Evaluating 'effectiveness' requires care: key claims (e.g., DACA's legality, chilling-effect magnitudes) are frequently misstated in secondary coverage and must be checked against primary documents.",
      "The 2024 sequence — Senate deal collapse followed by executive entry restrictions — replicates the 2012 pattern that produced DACA.",
    ],
  },

  // ---------- Project 3: Cross-agency AI regulation ----------
  {
    id: "rp-003",
    title: "How are AI regulations developing across agencies?",
    topicIds: ["tp-005"],
    createdAt: "2024-08-20T14:00:00Z",
    updatedAt: "2024-09-22T09:45:00Z",
    questions: [
      "Which agencies hold binding versus advisory AI authority?",
      "How does EO 14110 delegate responsibilities across NIST, OMB, and sector regulators?",
      "Is enforcement under existing statutes (FTC Act §5) substituting for new AI legislation?",
    ],
    claims: [
      {
        id: "clm-020",
        statement: "OMB M-24-10 is the first binding government-wide policy on federal agency use of AI, with compliance deadlines in December 2024.",
        evidenceStatus: "supported",
        sourceIds: ["src-024"],
        entityIds: ["ent-045", "ent-064"],
      },
      {
        id: "clm-021",
        statement: "NIST's AI Risk Management Framework is voluntary and carries no enforcement mechanism.",
        evidenceStatus: "supported",
        sourceIds: ["src-025"],
        entityIds: ["ent-017", "ent-024"],
      },
      {
        id: "clm-022",
        statement: "The FTC is applying existing Section 5 consumer protection authority to AI rather than relying on new AI-specific statutes.",
        evidenceStatus: "supported",
        sourceIds: ["src-028"],
        entityIds: ["ent-018", "ent-005"],
      },
      {
        id: "clm-023",
        statement: "EO 14110 created new statutory regulatory authority over private AI developers.",
        evidenceStatus: "contested",
        sourceIds: ["src-023", "src-026"],
        entityIds: ["ent-064", "ent-063"],
        note: "The order relied on existing authority (notably the Defense Production Act) for frontier-model reporting; its durability and scope for private developers remain legally untested.",
      },
    ],
    evidenceBoards: [
      {
        id: "rp-003-board-1",
        title: "Cross-Agency Authority Map",
        description: "Binding (OMB), advisory (NIST), and enforcement (FTC) roles compared.",
        claimIds: ["clm-020", "clm-021", "clm-022"],
        eventIds: ["evt-026", "evt-028", "evt-029", "evt-030"],
      },
      {
        id: "rp-003-board-2",
        title: "Statutory Foundation",
        description: "What Congress has actually enacted versus executive improvisation.",
        claimIds: ["clm-023"],
        eventIds: ["evt-025", "evt-027"],
      },
    ],
    sourceCollections: [
      {
        id: "rp-003-coll-1",
        name: "Framework Documents",
        description: "EO 14110, OMB M-24-10, and the NIST AI RMF.",
        sourceIds: ["src-023", "src-024", "src-025"],
      },
      {
        id: "rp-003-coll-2",
        name: "Enforcement & Institutions",
        description: "AISI launch and FTC enforcement sweep.",
        sourceIds: ["src-027", "src-028", "src-030"],
      },
    ],
    findings: [
      "Federal AI governance is layered: voluntary standards (NIST RMF), binding internal rules for agencies (OMB M-24-10), and external enforcement via existing statutes (FTC §5).",
      "No comprehensive AI statute exists; the National AI Initiative Act created coordination structures, not regulatory authority.",
      "The sharpest legal uncertainty is the reach of EO 14110 over private frontier-model developers, which rests on Defense Production Act authority and remains untested in court.",
    ],
  },
];

export const getProjectById = (id: string): ResearchProject | undefined =>
  researchProjects.find((p) => p.id === id);
