// Knowledge Graph Entities — people, agencies, organizations, statutes,
// regulations, court cases, programs, and funding streams.
// All relationships reference valid entity IDs in this file.

export type EntityType =
  | "person"
  | "agency"
  | "organization"
  | "statute"
  | "regulation"
  | "court-case"
  | "program"
  | "funding";

export type RelationshipType =
  | "leads"
  | "administers"
  | "enforces"
  | "implements"
  | "created-by"
  | "amends"
  | "challenged-by"
  | "overruled"
  | "funds"
  | "advocates-for"
  | "regulated-by"
  | "part-of"
  | "supersedes"
  | "established";

export interface EntityRelationship {
  targetId: string;
  type: RelationshipType;
  note?: string;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description: string;
  establishedDate: string; // ISO 8601 (enactment/appointment/founding date)
  url: string;
  relationships: EntityRelationship[];
  sources: string[]; // src-NNN ids
}

export const entities: Entity[] = [
  // ================= PEOPLE =================
  {
    id: "ent-001",
    type: "person",
    name: "Michael S. Regan",
    description: "EPA Administrator (2021–2025). Led finalization of heavy-duty vehicle GHG standards, methane rules, and the $27B Greenhouse Gas Reduction Fund.",
    establishedDate: "2021-03-11",
    url: "https://www.epa.gov/aboutepa/epas-administrator",
    relationships: [
      { targetId: "ent-010", type: "leads", note: "Confirmed as 16th EPA Administrator" },
    ],
    sources: ["src-004", "src-005"],
  },
  {
    id: "ent-002",
    type: "person",
    name: "Alejandro Mayorkas",
    description: "Secretary of Homeland Security (2021–2025). Oversaw DACA preservation efforts, the 2024 border entry restrictions, and CBP/USCIS operations.",
    establishedDate: "2021-02-02",
    url: "https://www.dhs.gov/person/alejandro-mayorkas",
    relationships: [{ targetId: "ent-011", type: "leads" }],
    sources: ["src-011", "src-008"],
  },
  {
    id: "ent-003",
    type: "person",
    name: "Xavier Becerra",
    description: "Secretary of Health and Human Services (2021–2025). Oversaw implementation of Medicare drug price negotiation and ACA enrollment expansion.",
    establishedDate: "2021-03-19",
    url: "https://www.hhs.gov/about/leadership/secretary/index.html",
    relationships: [{ targetId: "ent-013", type: "leads" }],
    sources: ["src-015"],
  },
  {
    id: "ent-004",
    type: "person",
    name: "Gary Gensler",
    description: "SEC Chair (2021–2025). Championed the climate disclosure rule, crypto enforcement, and equity market structure reforms.",
    establishedDate: "2021-04-17",
    url: "https://www.sec.gov/about/leadership/gensler",
    relationships: [{ targetId: "ent-015", type: "leads" }],
    sources: ["src-019"],
  },
  {
    id: "ent-005",
    type: "person",
    name: "Lina Khan",
    description: "FTC Chair (2021–2025). Led 'Operation AI Comply' enforcement sweep and revived aggressive antitrust enforcement.",
    establishedDate: "2021-06-15",
    url: "https://www.ftc.gov/about-ftc/commissioners/lina-m-khan",
    relationships: [{ targetId: "ent-018", type: "leads" }],
    sources: ["src-028"],
  },

  // ================= AGENCIES =================
  {
    id: "ent-010",
    type: "agency",
    name: "Environmental Protection Agency (EPA)",
    description: "Federal agency responsible for environmental protection; administers the Clean Air Act and major IRA climate grant programs.",
    establishedDate: "1970-12-02",
    url: "https://www.epa.gov",
    relationships: [
      { targetId: "ent-031", type: "enforces" },
      { targetId: "ent-040", type: "administers" },
      { targetId: "ent-061", type: "administers" },
    ],
    sources: ["src-002", "src-032"],
  },
  {
    id: "ent-011",
    type: "agency",
    name: "Department of Homeland Security (DHS)",
    description: "Cabinet department overseeing border security, immigration enforcement, and immigration services.",
    establishedDate: "2002-11-25",
    url: "https://www.dhs.gov",
    relationships: [
      { targetId: "ent-041", type: "administers", note: "DACA administered through USCIS" },
      { targetId: "ent-012", type: "part-of" },
    ],
    sources: ["src-007", "src-011"],
  },
  {
    id: "ent-012",
    type: "agency",
    name: "U.S. Citizenship and Immigration Services (USCIS)",
    description: "DHS component administering lawful immigration, naturalization, asylum, and DACA renewals.",
    establishedDate: "2003-03-01",
    url: "https://www.uscis.gov",
    relationships: [
      { targetId: "ent-011", type: "part-of" },
      { targetId: "ent-042", type: "administers", note: "Issued 2019 public charge rule; rescinded 2021" },
    ],
    sources: ["src-010", "src-033"],
  },
  {
    id: "ent-013",
    type: "agency",
    name: "Department of Health and Human Services (HHS)",
    description: "Cabinet department overseeing public health, Medicare, and Medicaid.",
    establishedDate: "1980-05-04",
    url: "https://www.hhs.gov",
    relationships: [{ targetId: "ent-014", type: "part-of" }],
    sources: ["src-015"],
  },
  {
    id: "ent-014",
    type: "agency",
    name: "Centers for Medicare & Medicaid Services (CMS)",
    description: "HHS agency administering Medicare, Medicaid, CHIP, and the ACA marketplaces; runs the Medicare Drug Price Negotiation Program.",
    establishedDate: "1977-03-09",
    url: "https://www.cms.gov",
    relationships: [
      { targetId: "ent-013", type: "part-of" },
      { targetId: "ent-060", type: "administers" },
      { targetId: "ent-062", type: "administers" },
      { targetId: "ent-032", type: "implements" },
    ],
    sources: ["src-015", "src-016"],
  },
  {
    id: "ent-015",
    type: "agency",
    name: "Securities and Exchange Commission (SEC)",
    description: "Independent agency regulating securities markets; adopted the 2024 climate disclosure rule.",
    establishedDate: "1934-06-06",
    url: "https://www.sec.gov",
    relationships: [
      { targetId: "ent-043", type: "administers" },
      { targetId: "ent-033", type: "enforces" },
    ],
    sources: ["src-019"],
  },
  {
    id: "ent-016",
    type: "agency",
    name: "Consumer Financial Protection Bureau (CFPB)",
    description: "Independent bureau created by Dodd-Frank to enforce federal consumer financial laws.",
    establishedDate: "2011-07-21",
    url: "https://www.consumerfinance.gov",
    relationships: [
      { targetId: "ent-033", type: "created-by" },
      { targetId: "ent-044", type: "administers" },
      { targetId: "ent-071", type: "part-of", note: "Funded via Federal Reserve transfers" },
    ],
    sources: ["src-018", "src-020", "src-021"],
  },
  {
    id: "ent-017",
    type: "agency",
    name: "National Institute of Standards and Technology (NIST)",
    description: "Commerce Department lab developing the AI Risk Management Framework and housing the U.S. AI Safety Institute.",
    establishedDate: "1901-03-03",
    url: "https://www.nist.gov",
    relationships: [
      { targetId: "ent-063", type: "administers" },
      { targetId: "ent-045", type: "implements", note: "AI RMF and red-teaming guidance under EO 14110" },
    ],
    sources: ["src-025", "src-027"],
  },
  {
    id: "ent-018",
    type: "agency",
    name: "Federal Trade Commission (FTC)",
    description: "Independent agency enforcing antitrust and consumer protection law, including deceptive AI claims.",
    establishedDate: "1914-09-26",
    url: "https://www.ftc.gov",
    relationships: [{ targetId: "ent-023", type: "regulated-by", note: "ABA member institutions subject to FTC UDAP authority" }],
    sources: ["src-028"],
  },

  // ================= ORGANIZATIONS =================
  {
    id: "ent-020",
    type: "organization",
    name: "Sierra Club",
    description: "National environmental advocacy organization; intervened in major Clean Air Act litigation and advocates for IRA implementation.",
    establishedDate: "1892-05-28",
    url: "https://www.sierraclub.org",
    relationships: [
      { targetId: "ent-030", type: "advocates-for" },
      { targetId: "ent-040", type: "advocates-for" },
    ],
    sources: ["src-001", "src-002"],
  },
  {
    id: "ent-021",
    type: "organization",
    name: "National Immigration Forum",
    description: "Bipartisan advocacy organization working with business, law enforcement, and faith leaders on immigration reform.",
    establishedDate: "1982-01-01",
    url: "https://immigrationforum.org",
    relationships: [
      { targetId: "ent-035", type: "advocates-for" },
      { targetId: "ent-034", type: "advocates-for" },
    ],
    sources: ["src-009"],
  },
  {
    id: "ent-022",
    type: "organization",
    name: "Families USA",
    description: "Consumer health advocacy organization supporting ACA implementation, Medicaid expansion, and drug price negotiation.",
    establishedDate: "1981-01-01",
    url: "https://familiesusa.org",
    relationships: [
      { targetId: "ent-032", type: "advocates-for" },
      { targetId: "ent-060", type: "advocates-for" },
    ],
    sources: ["src-013", "src-016"],
  },
  {
    id: "ent-023",
    type: "organization",
    name: "American Bankers Association (ABA)",
    description: "Banking industry trade association; litigated against CFPB rules and advocated on Dodd-Frank implementation.",
    establishedDate: "1875-07-20",
    url: "https://www.aba.com",
    relationships: [{ targetId: "ent-044", type: "challenged-by", note: "Industry litigation stayed the late-fee rule in 2024" }],
    sources: ["src-020"],
  },
  {
    id: "ent-024",
    type: "organization",
    name: "Partnership on AI",
    description: "Nonprofit multi-stakeholder coalition of tech companies, civil society, and academia developing AI best practices.",
    establishedDate: "2016-09-28",
    url: "https://partnershiponai.org",
    relationships: [{ targetId: "ent-063", type: "advocates-for", note: "Participates in NIST AI safety convenings" }],
    sources: ["src-025"],
  },

  // ================= STATUTES =================
  {
    id: "ent-030",
    type: "statute",
    name: "Inflation Reduction Act of 2022",
    description: "Reconciliation law providing ~$369B for climate and clean energy, ACA subsidy extensions, and Medicare drug price negotiation.",
    establishedDate: "2022-08-16",
    url: "https://www.congress.gov/bill/117th-congress/house-bill/5376",
    relationships: [
      { targetId: "ent-061", type: "created-by" },
      { targetId: "ent-070", type: "created-by" },
      { targetId: "ent-015", type: "regulated-by", note: "Related securities disclosure debates" },
    ],
    sources: ["src-001", "src-015"],
  },
  {
    id: "ent-031",
    type: "statute",
    name: "Clean Air Act",
    description: "Foundational 1970 air pollution statute (amended 1977, 1990); statutory basis for federal greenhouse gas regulation under Section 111 and Title II.",
    establishedDate: "1970-12-31",
    url: "https://www.govinfo.gov/content/pkg/USCODE-2022-title42/html/USCODE-2022-title42-chap85.htm",
    relationships: [
      { targetId: "ent-040", type: "created-by", note: "CPP issued under CAA §111(d)" },
      { targetId: "ent-050", type: "challenged-by" },
    ],
    sources: ["src-032", "src-006"],
  },
  {
    id: "ent-032",
    type: "statute",
    name: "Patient Protection and Affordable Care Act (ACA)",
    description: "2010 health reform law creating insurance marketplaces, Medicaid expansion, and consumer protections.",
    establishedDate: "2010-03-23",
    url: "https://www.congress.gov/bill/111th-congress/house-bill/3590",
    relationships: [
      { targetId: "ent-060", type: "created-by" },
      { targetId: "ent-053", type: "challenged-by" },
    ],
    sources: ["src-013", "src-014"],
  },
  {
    id: "ent-033",
    type: "statute",
    name: "Dodd-Frank Wall Street Reform and Consumer Protection Act",
    description: "2010 financial reform law creating the CFPB, FSOC, the Volcker Rule, and enhanced prudential regulation.",
    establishedDate: "2010-07-21",
    url: "https://www.congress.gov/bill/111th-congress/house-bill/4173",
    relationships: [{ targetId: "ent-016", type: "established" }],
    sources: ["src-018"],
  },
  {
    id: "ent-034",
    type: "statute",
    name: "DREAM Act",
    description: "First introduced in 2001; proposed conditional permanent residency for undocumented individuals brought to the U.S. as minors. Never enacted; repeated failures prompted DACA.",
    establishedDate: "2001-08-01",
    url: "https://www.congress.gov/bill/107th-congress/senate-bill/1291",
    relationships: [{ targetId: "ent-041", type: "supersedes", note: "DACA created administratively after DREAM Act failed in 2010" }],
    sources: ["src-012"],
  },
  {
    id: "ent-035",
    type: "statute",
    name: "Border Security, Economic Opportunity, and Immigration Modernization Act (2013)",
    description: "Senate-passed comprehensive immigration reform bill (68–32); died without House action.",
    establishedDate: "2013-06-27",
    url: "https://www.congress.gov/bill/113th-congress/senate-bill/744",
    relationships: [{ targetId: "ent-021", type: "advocates-for" }],
    sources: ["src-009"],
  },
  {
    id: "ent-036",
    type: "statute",
    name: "National AI Initiative Act of 2020",
    description: "Enacted as Division E of the FY2021 NDAA; created the National AI Initiative Office and directed NSF AI Research Institutes.",
    establishedDate: "2021-01-01",
    url: "https://www.congress.gov/bill/116th-congress/house-bill/6395",
    relationships: [
      { targetId: "ent-073", type: "created-by" },
      { targetId: "ent-017", type: "administers", note: "NIST given AI standards role" },
    ],
    sources: ["src-026", "src-030"],
  },
  {
    id: "ent-037",
    type: "statute",
    name: "American Rescue Plan Act of 2021",
    description: "$1.9T COVID relief law; temporarily expanded ACA premium tax credits (later extended by the IRA).",
    establishedDate: "2021-03-11",
    url: "https://www.congress.gov/bill/117th-congress/house-bill/1319",
    relationships: [{ targetId: "ent-032", type: "amends", note: "Enhanced premium tax credits through 2022" }],
    sources: ["src-017"],
  },

  // ================= REGULATIONS =================
  {
    id: "ent-040",
    type: "regulation",
    name: "Clean Power Plan",
    description: "2015 EPA rule setting state CO2 emission guidelines for existing power plants under CAA §111(d); stayed in 2016, repealed 2019, effectively voided by West Virginia v. EPA.",
    establishedDate: "2015-10-23",
    url: "https://www.federalregister.gov/documents/2015/10/23/2015-22842",
    relationships: [
      { targetId: "ent-031", type: "created-by" },
      { targetId: "ent-050", type: "challenged-by" },
    ],
    sources: ["src-002", "src-003"],
  },
  {
    id: "ent-041",
    type: "regulation",
    name: "Deferred Action for Childhood Arrivals (DACA)",
    description: "2012 DHS policy granting deferred action and work authorization to eligible individuals brought to the U.S. as children; codified by rulemaking in 2022.",
    establishedDate: "2012-06-15",
    url: "https://www.federalregister.gov/documents/2012/06/15/2012-14850",
    relationships: [
      { targetId: "ent-011", type: "created-by" },
      { targetId: "ent-052", type: "challenged-by" },
    ],
    sources: ["src-007", "src-008"],
  },
  {
    id: "ent-042",
    type: "regulation",
    name: "Public Charge Rule (2019)",
    description: "DHS rule expanding public charge inadmissibility to non-cash benefit use; vacated in litigation and rescinded in 2021.",
    establishedDate: "2019-08-14",
    url: "https://www.federalregister.gov/documents/2019/08/14/2019-17142",
    relationships: [{ targetId: "ent-012", type: "created-by" }],
    sources: ["src-010", "src-033"],
  },
  {
    id: "ent-043",
    type: "regulation",
    name: "SEC Climate-Related Disclosure Rule",
    description: "2024 final rule requiring disclosure of material climate risks and Scope 1/2 emissions for large filers; stayed pending consolidated Eighth Circuit litigation.",
    establishedDate: "2024-03-06",
    url: "https://www.sec.gov/newsroom/press-releases/2024-31",
    relationships: [{ targetId: "ent-015", type: "created-by" }],
    sources: ["src-019"],
  },
  {
    id: "ent-044",
    type: "regulation",
    name: "CFPB Credit Card Late Fee Rule",
    description: "2024 Regulation Z amendment capping late fees at $8 for large card issuers; stayed by federal court after industry challenge.",
    establishedDate: "2024-03-15",
    url: "https://www.federalregister.gov/documents/2024/03/15/2024-04777",
    relationships: [
      { targetId: "ent-016", type: "created-by" },
      { targetId: "ent-023", type: "challenged-by" },
    ],
    sources: ["src-020"],
  },
  {
    id: "ent-045",
    type: "regulation",
    name: "OMB M-24-10: Federal Agency AI Governance Requirements",
    description: "First binding government-wide AI policy: Chief AI Officers, AI inventories, and safeguards for rights- and safety-impacting AI by Dec 1, 2024.",
    establishedDate: "2024-03-28",
    url: "https://www.whitehouse.gov/wp-content/uploads/2024/03/M-24-10.pdf",
    relationships: [{ targetId: "ent-064", type: "implements", note: "Implements EO 14110 §10" }],
    sources: ["src-024"],
  },

  // ================= COURT CASES =================
  {
    id: "ent-050",
    type: "court-case",
    name: "West Virginia v. EPA (2022)",
    description: "Supreme Court held EPA lacked authority for generation-shifting emissions caps under CAA §111(d); landmark major questions doctrine ruling.",
    establishedDate: "2022-06-30",
    url: "https://www.supremecourt.gov/opinions/21pdf/20-1530_new_3dq6.pdf",
    relationships: [{ targetId: "ent-040", type: "overruled" }],
    sources: ["src-003"],
  },
  {
    id: "ent-051",
    type: "court-case",
    name: "Massachusetts v. EPA (2007)",
    description: "Supreme Court held greenhouse gases are 'air pollutants' under the Clean Air Act, enabling federal GHG regulation.",
    establishedDate: "2007-04-02",
    url: "https://www.supremecourt.gov/opinions/06pdf/05-1120.pdf",
    relationships: [{ targetId: "ent-031", type: "implements", note: "Interpreted CAA §202(a)(1)" }],
    sources: ["src-006"],
  },
  {
    id: "ent-052",
    type: "court-case",
    name: "DHS v. Regents of the University of California (2020)",
    description: "Supreme Court held the 2017 DACA rescission arbitrary and capricious under the APA, preserving the program.",
    establishedDate: "2020-06-18",
    url: "https://www.supremecourt.gov/opinions/19pdf/18-587_5ifl.pdf",
    relationships: [{ targetId: "ent-041", type: "implements", note: "Rescission vacated; program preserved" }],
    sources: ["src-008"],
  },
  {
    id: "ent-053",
    type: "court-case",
    name: "California v. Texas (2021)",
    description: "Supreme Court dismissed the third major ACA challenge for lack of standing, leaving the law intact.",
    establishedDate: "2021-06-17",
    url: "https://www.supremecourt.gov/opinions/20pdf/19-840_6jfm.pdf",
    relationships: [{ targetId: "ent-032", type: "challenged-by" }],
    sources: ["src-014"],
  },
  {
    id: "ent-054",
    type: "court-case",
    name: "CFPB v. Community Financial Services Association (2024)",
    description: "Supreme Court upheld the CFPB's Federal Reserve funding mechanism against an Appropriations Clause challenge.",
    establishedDate: "2024-05-16",
    url: "https://www.supremecourt.gov/opinions/23pdf/22-448_8n59.pdf",
    relationships: [{ targetId: "ent-071", type: "challenged-by" }],
    sources: ["src-021"],
  },

  // ================= PROGRAMS =================
  {
    id: "ent-060",
    type: "program",
    name: "Medicaid Expansion (ACA)",
    description: "ACA option extending Medicaid to adults up to 138% FPL; adopted by 40 states + D.C., covering 20M+ adults.",
    establishedDate: "2014-01-01",
    url: "https://www.medicaid.gov/medicaid/expansion-of-medicaid/index.html",
    relationships: [
      { targetId: "ent-032", type: "created-by" },
      { targetId: "ent-014", type: "administers" },
    ],
    sources: ["src-016"],
  },
  {
    id: "ent-061",
    type: "program",
    name: "Greenhouse Gas Reduction Fund",
    description: "$27B EPA grant program (NCIF, CCIA, Solar for All) financing clean energy projects, especially in low-income communities.",
    establishedDate: "2024-04-04",
    url: "https://www.epa.gov/greenhouse-gas-reduction-fund",
    relationships: [
      { targetId: "ent-030", type: "created-by" },
      { targetId: "ent-010", type: "administers" },
    ],
    sources: ["src-005"],
  },
  {
    id: "ent-062",
    type: "program",
    name: "Medicare Drug Price Negotiation Program",
    description: "CMS program negotiating prices for high-cost Part D drugs; first 10 negotiated prices take effect in 2026.",
    establishedDate: "2023-08-29",
    url: "https://www.cms.gov/inflation-reduction-act-and-medicare",
    relationships: [
      { targetId: "ent-030", type: "created-by" },
      { targetId: "ent-014", type: "administers" },
    ],
    sources: ["src-015"],
  },
  {
    id: "ent-063",
    type: "program",
    name: "U.S. AI Safety Institute (AISI)",
    description: "NIST institute created under EO 14110 to develop testing, evaluations, and guidelines for advanced AI systems.",
    establishedDate: "2024-02-07",
    url: "https://www.nist.gov/aisi",
    relationships: [
      { targetId: "ent-064", type: "created-by" },
      { targetId: "ent-017", type: "administers" },
    ],
    sources: ["src-027"],
  },
  {
    id: "ent-064",
    type: "program",
    name: "Executive Order 14110 Implementation (Federal AI Governance)",
    description: "Government-wide implementation of the 2023 AI executive order across NIST, OMB, Commerce, and sector regulators.",
    establishedDate: "2023-10-30",
    url: "https://www.federalregister.gov/documents/2023/11/01/2023-24283",
    relationships: [
      { targetId: "ent-045", type: "established" },
      { targetId: "ent-063", type: "established" },
    ],
    sources: ["src-023", "src-024"],
  },

  // ================= FUNDING =================
  {
    id: "ent-070",
    type: "funding",
    name: "IRA Climate & Clean Energy Appropriations (~$369B)",
    description: "Tax credits, grants, and loan programs for clean energy, manufacturing, and environmental justice under the IRA.",
    establishedDate: "2022-08-16",
    url: "https://www.congress.gov/bill/117th-congress/house-bill/5376",
    relationships: [
      { targetId: "ent-030", type: "created-by" },
      { targetId: "ent-061", type: "funds" },
    ],
    sources: ["src-001", "src-005"],
  },
  {
    id: "ent-071",
    type: "funding",
    name: "CFPB Federal Reserve Funding Mechanism",
    description: "Statutory funding via Federal Reserve transfers (capped ~12% of Fed operating expenses), upheld by the Supreme Court in 2024.",
    establishedDate: "2011-07-21",
    url: "https://www.consumerfinance.gov/about-us/budget-strategy/",
    relationships: [
      { targetId: "ent-016", type: "funds" },
      { targetId: "ent-033", type: "created-by" },
    ],
    sources: ["src-021", "src-018"],
  },
  {
    id: "ent-072",
    type: "funding",
    name: "DHS Border Operations Funding (FY2024 debates)",
    description: "Contested FY2024 border funding; the bipartisan Senate deal ($20B) failed, and supplemental appropriations passed without the border security package.",
    establishedDate: "2024-04-24",
    url: "https://www.congress.gov/bill/118th-congress/house-bill/815",
    relationships: [{ targetId: "ent-011", type: "funds" }],
    sources: ["src-029"],
  },
  {
    id: "ent-073",
    type: "funding",
    name: "NSF National AI Research Institutes ($500M+ cumulative)",
    description: "Cross-agency grant program funding 25 AI research institutes with NSF, USDA, DHS, and industry partners.",
    establishedDate: "2020-08-26",
    url: "https://www.nsf.gov/funding/initiatives/ai/national-artificial-intelligence-research-institutes",
    relationships: [{ targetId: "ent-036", type: "created-by" }],
    sources: ["src-030", "src-026"],
  },
];

export const getEntityById = (id: string): Entity | undefined =>
  entities.find((e) => e.id === id);

export const getEntitiesByType = (type: EntityType): Entity[] =>
  entities.filter((e) => e.type === type);
