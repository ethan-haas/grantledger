export interface CategoryHelp {
  definition: string;
  examples: string[];
  cfrReference: string;
  commonMistakes: string[];
}

export const CATEGORY_HELP: Record<string, CategoryHelp> = {
  personnel: {
    definition: "Compensation for employees working directly on the federal award, including salaries, wages, and overtime. Charges must be based on records that accurately reflect the work performed.",
    examples: [
      "Project director salary (proportional to time on grant)",
      "Research assistant wages",
      "Overtime for grant-funded staff during reporting periods",
    ],
    cfrReference: "2 CFR 200.430 — Compensation: Personal Services",
    commonMistakes: [
      "Charging 100% of salary when employee splits time across grants",
      "Missing time-and-effort documentation",
      "Including administrative staff not directly working on the award",
    ],
  },
  fringe_benefits: {
    definition: "Employee benefits associated with personnel costs, including health insurance, retirement contributions, FICA, workers' compensation, and leave costs.",
    examples: [
      "Health insurance premiums for grant-funded staff",
      "Employer FICA contributions",
      "Retirement plan contributions (401k match)",
      "Paid leave accrual costs",
    ],
    cfrReference: "2 CFR 200.431 — Compensation: Fringe Benefits",
    commonMistakes: [
      "Not applying fringe rate consistently across all personnel",
      "Using outdated fringe benefit rates",
      "Double-counting benefits already included in indirect cost rate",
    ],
  },
  travel: {
    definition: "Transportation, lodging, subsistence, and related items incurred by employees on official travel for the federal award. Must follow organization's travel policy or federal per diem rates.",
    examples: [
      "Conference airfare for project staff",
      "Mileage reimbursement for site visits",
      "Hotel and per diem for training events",
      "Ground transportation (taxi, rental car) for grant activities",
    ],
    cfrReference: "2 CFR 200.474 — Travel Costs",
    commonMistakes: [
      "Exceeding GSA per diem rates without justification",
      "Missing prior approval for international travel",
      "Not documenting the purpose tied to grant objectives",
    ],
  },
  equipment: {
    definition: "Tangible personal property having a useful life of more than one year and a per-unit acquisition cost that equals or exceeds the equipment threshold. The threshold depends on the OMB framework.",
    examples: [
      "Laboratory instruments above threshold",
      "Computer servers for grant data processing",
      "Specialized machinery for project activities",
    ],
    cfrReference: "2 CFR 200.439 — Equipment and Other Capital Expenditures",
    commonMistakes: [
      "Classifying items below the threshold as equipment (should be supplies)",
      "Not applying the correct threshold for the grant's OMB framework",
      "Missing prior written approval from the federal agency",
    ],
  },
  supplies: {
    definition: "All tangible personal property that does not meet the equipment threshold. Includes consumable materials, office supplies, and items with useful life under one year.",
    examples: [
      "Office supplies (paper, pens, toner)",
      "Lab consumables (chemicals, test kits)",
      "Computing devices under the equipment threshold",
      "Postage and shipping materials",
    ],
    cfrReference: "2 CFR 200.453 — Materials and Supplies Costs",
    commonMistakes: [
      "Classifying capital items as supplies to avoid equipment approval",
      "Not allocating shared supplies proportionally across grants",
      "Stockpiling supplies beyond reasonable needs",
    ],
  },
  contractual: {
    definition: "Costs of subawards, contracts, and consultant services with external entities. Includes professional services, subrecipient agreements, and procurement contracts.",
    examples: [
      "Subrecipient agreements with partner organizations",
      "IT consulting services",
      "Evaluation or audit contracts",
      "Legal services related to grant activities",
    ],
    cfrReference: "2 CFR 200.318 — General Procurement Standards",
    commonMistakes: [
      "Not distinguishing between subrecipients and contractors",
      "Missing required competition or sole-source justification",
      "Exceeding the MTDC subaward exclusion limit",
    ],
  },
  construction: {
    definition: "Costs for construction activities when specifically authorized in the federal award. Most grants do not allow construction unless explicitly stated in the award terms.",
    examples: [
      "Building renovation for grant-funded facility",
      "Site preparation and foundation work",
      "Architectural and engineering fees for construction",
    ],
    cfrReference: "2 CFR 200.439 — Equipment and Other Capital Expenditures",
    commonMistakes: [
      "Including construction costs without explicit authorization",
      "Confusing minor renovations (Other) with construction",
      "Not obtaining required environmental reviews",
    ],
  },
  other: {
    definition: "Costs that do not fit into any of the other SF-424A categories. This is a catch-all category for legitimate grant expenses that are unique to the project.",
    examples: [
      "Participant stipends or incentives",
      "Publication and printing costs",
      "Insurance costs specific to the grant",
      "Rental of space or equipment for short-term use",
      "Training and professional development",
    ],
    cfrReference: "Various sections of 2 CFR 200 Subpart E",
    commonMistakes: [
      "Using 'Other' as a dumping ground without proper categorization",
      "Not providing sufficient detail for audit documentation",
      "Missing prior approval for entertainment or food costs",
    ],
  },
  indirect_charges: {
    definition: "Facilities and administrative (F&A) costs that benefit multiple projects and cannot be easily assigned to a specific grant. Calculated using a negotiated or de minimis indirect cost rate applied to Modified Total Direct Costs (MTDC).",
    examples: [
      "Facility rent and utilities (shared across programs)",
      "Accounting and HR department costs",
      "IT infrastructure and network maintenance",
      "General administrative salaries",
    ],
    cfrReference: "2 CFR 200.414 — Indirect (F&A) Costs",
    commonMistakes: [
      "Charging costs as both direct and indirect (double-dipping)",
      "Using an expired negotiated rate agreement",
      "Applying IDC rate to costs excluded from MTDC base (equipment, subawards over threshold)",
    ],
  },
};
