// Consumer Topic Taxonomy for CivicFeed
//
// These 6 consumer-facing life topics are the primary navigation axis for end users.
// They exist in parallel to the 21 government-department categories used for backend
// organization and power-user source inspection.
//
// See ADR-001 for the full decision record.

export interface ConsumerTopic {
  key: string;
  label: string;
  description: string;
  /** Which existing department categories map to this consumer topic */
  departmentCategories: string[];
}

export const consumerTopics: ConsumerTopic[] = [
  {
    key: "cost-of-living",
    label: "Cost of Living",
    description: "Inflation, groceries, housing, energy, and interest rates",
    departmentCategories: [
      "Finance & Economy",
      "Commerce & Trade",
      "Agriculture & Food",
      "Housing, Urban Development, & Infrastructure",
      "Environment & Energy",
    ],
  },
  {
    key: "taxes-your-money",
    label: "Taxes & Your Money",
    description: "Tax changes, government spending, benefits, and household finances",
    departmentCategories: [
      "Finance & Economy",
      "Oversight & Audits",
      "Executive & Press",
    ],
  },
  {
    key: "health-safety",
    label: "Health & Safety",
    description: "Drug recalls, food safety, healthcare policy, and public health",
    departmentCategories: [
      "Health & Science",
      "Safety & Consumer Protection",
      "Veterans Affairs, Healthcare, & Benefits",
      "Agriculture & Food",
    ],
  },
  {
    key: "jobs-wages",
    label: "Jobs & Wages",
    description: "Employment data, workplace rules, wages, and worker protections",
    departmentCategories: [
      "Labor & Employment",
      "Commerce & Trade",
      "Development & Education",
    ],
  },
  {
    key: "laws-decisions",
    label: "Laws & Decisions",
    description: "Legislation, votes, executive orders, and regulations",
    departmentCategories: [
      "Congress & Legislation",
      "Courts & Judiciary",
      "Rulemaking & Regulations",
      "Executive & Press",
    ],
  },
  {
    key: "your-community",
    label: "Your Community",
    description: "State and local government, housing, schools, and infrastructure",
    departmentCategories: [
      "Transportation",
      "Housing, Urban Development, & Infrastructure",
      "Development & Education",
      "General",
      "Grants & Arts",
      "Environment & Energy",
    ],
  },
];

/**
 * Map a department category to its consumer topic keys.
 * Returns multiple topics when a category spans consumer concerns
 * (e.g., "Agriculture & Food" maps to both "cost-of-living" and "health-safety").
 */
export function getConsumerTopicsForCategory(category: string): string[] {
  return consumerTopics
    .filter((t) => t.departmentCategories.includes(category))
    .map((t) => t.key);
}

/**
 * Get consumer topic metadata by key.
 */
export function getConsumerTopic(key: string): ConsumerTopic | undefined {
  return consumerTopics.find((t) => t.key === key);
}