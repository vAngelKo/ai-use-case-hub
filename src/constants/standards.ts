/**
 * Standard values for use case fields.
 * First row of the grid = Marketing Function (headers). All other rows = Subfunctions per column.
 */

/** Marketing Function = the 5 column headers (first row) */
export const MARKETING_FUNCTIONS = [
  "Marketing Ops",
  "Portfolio Marketing",
  "Growth Strategy",
  "Demand Generation",
  "Communications",
] as const;

/** Subfunctions under each Marketing Function column (rows 2+). */
export const SUBFUNCTIONS_BY_MARKETING_FUNCTION: Record<string, readonly string[]> = {
  "Marketing Ops": [
    "Marketing Operations",
    "Web Development",
    "Marketing Database",
    "Web Operations",
  ],
  "Portfolio Marketing": [
    "Customer Marketing",
    "Industry Marketing",
    "Partner Marketing",
    "Product Marketing",
  ],
  "Growth Strategy": ["Growth Strategy"],
  "Demand Generation": [
    "Events and Field Marketing",
    "Integrated Campaigns",
    "Digital Marketing",
    "Account Based Marketing",
    "Marketing Strategy",
    "SEO",
  ],
  "Communications": [
    "Public Relations",
    "Content",
    "Communications",
    "Social Media Marketing",
    "Creative",
  ],
};

/** All subfunctions (flat list for prompts and when marketing function not selected) */
export const SUBFUNCTIONS = [
  "Marketing Operations",
  "Web Development",
  "Marketing Database",
  "Web Operations",
  "Customer Marketing",
  "Industry Marketing",
  "Partner Marketing",
  "Product Marketing",
  "Growth Strategy",
  "Events and Field Marketing",
  "Integrated Campaigns",
  "Digital Marketing",
  "Account Based Marketing",
  "Marketing Strategy",
  "SEO",
  "Public Relations",
  "Content",
  "Communications",
  "Social Media Marketing",
  "Creative",
] as const;

export const STAKEHOLDERS = [
  "AEs",
  "Alliances",
  "Customer Success",
  "Enablement",
  "Management",
  "Marketing",
  "SAM",
  "SDR",
] as const;

export const ESCALATION_TIERS = ["Tier 1", "Tier 2", "Tier 3"] as const;

export const ROI_VALUE_CATEGORIES = [
  "Time & productivity — fewer hours, faster cycles, less manual work",
  "Cost — lower spend, fewer tools, less rework",
  "Revenue / demand — pipeline, conversion, pipeline velocity (only when plausible)",
  "Quality & risk — fewer errors, compliance, brand consistency, auditability",
  "Customer / partner experience — faster response, better personalization, satisfaction",
  "Strategic / enablement — capability building, experiment that unlocks scale later",
  "Not quantified yet / exploratory — idea stage; value TBD",
] as const;

export function getRoiCategoriesForPrompt(): string {
  return ROI_VALUE_CATEGORIES.map((c, i) => `  ${i + 1}. ${c}`).join("\n");
}

export const ESCALATION_TIER_CRITERIA_FOR_MODEL = `
Use ONLY one of: ${ESCALATION_TIERS.join(", ")}. Match the conversation to ONE tier:

**Tier 1 — High impact / strategic / priority**
- Meaning: Company-wide scope; strategic initiative.
- Signals: Needs involvement from the AI team or other teams beyond marketing; priority or executive-level visibility; broad blast radius.
- Notes: Strategic; cross-functional or company-wide.

**Tier 2 — Medium impact / important**
- Meaning: Departmental impact (e.g. marketing-wide), not full company.
- Signals: Can be built **inside marketing** using **available resources**; important but not company-wide strategic.
- Notes: No requirement for AI team or other departments by default—departmental build.

**Tier 3 — Self-served / lower priority**
- Meaning: Self-built or self-served tool or idea.
- Signals: Individual or small team can build/use with existing, lightweight means; lower priority; minimal coordination.
- Notes: Can be self-built; narrowest escalation.

Pick the **single best fit**. If signals span tiers, prefer the tier that matches **scope** (company vs department vs self-serve) and **dependency on AI team / other teams**.`;

export const STATUS_OPTIONS = [
  "Idea",
  "In Progress",
  "Live",
  "On Hold",
  "Under Review",
] as const;

export function getStandardsForPrompt(): string {
  const subByFunc = Object.entries(SUBFUNCTIONS_BY_MARKETING_FUNCTION)
    .map(([func, subs]) => `  - ${func}: ${subs.join(", ")}`)
    .join("\n");
  return `
**STANDARD VALUES (use only these when applicable):**

Marketing Function (pick one): ${MARKETING_FUNCTIONS.join(", ")}
Subfunction (pick one; should align with the chosen Marketing Function):
${subByFunc}

Stakeholders (for Business Owner / Additional Stakeholders): ${STAKEHOLDERS.join(", ")}
Escalation Tier: ${ESCALATION_TIERS.join(", ")}
Status: ${STATUS_OPTIONS.join(", ")}
`;
}
