import type { Sf424aCategory } from "@/lib/supabase/database.types";

export const SF424A_CATEGORIES: {
  value: Sf424aCategory;
  label: string;
  description: string;
}[] = [
  { value: "personnel", label: "Personnel", description: "Salaries and wages" },
  {
    value: "fringe_benefits",
    label: "Fringe Benefits",
    description: "Employee benefits and payroll taxes",
  },
  { value: "travel", label: "Travel", description: "Staff and participant travel" },
  {
    value: "equipment",
    label: "Equipment",
    description: "Tangible personal property with useful life >1 year",
  },
  {
    value: "supplies",
    label: "Supplies",
    description: "Consumable materials and items below equipment threshold",
  },
  {
    value: "contractual",
    label: "Contractual",
    description: "Subawards, contracts, and consultant services",
  },
  {
    value: "construction",
    label: "Construction",
    description: "Construction costs (if applicable)",
  },
  {
    value: "other",
    label: "Other",
    description: "Costs not fitting other categories",
  },
  {
    value: "indirect_charges",
    label: "Indirect Charges",
    description: "Facilities and administrative costs (F&A / IDC)",
  },
  {
    value: "total",
    label: "Total",
    description: "Sum of all budget categories",
  },
];

export const SF424A_CATEGORY_VALUES = SF424A_CATEGORIES
  .filter(c => c.value !== "total")
  .map(c => c.value) as [string, ...string[]];

export const CATEGORY_COLORS: Record<Sf424aCategory, string> = {
  personnel: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  fringe_benefits: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  travel: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  equipment: "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
  supplies: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  contractual: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  construction: "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400",
  other: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
  indirect_charges: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  total: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};
