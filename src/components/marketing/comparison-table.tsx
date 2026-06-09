"use client";

const features = [
  { name: "AI expense categorization", grantledger: true, spreadsheets: false, generic: false },
  { name: "SF-424A budget mapping", grantledger: true, spreadsheets: "manual", generic: false },
  { name: "2 CFR 200 citations", grantledger: true, spreadsheets: false, generic: false },
  { name: "Dual OMB framework support", grantledger: true, spreadsheets: false, generic: false },
  { name: "Budget-to-actual tracking", grantledger: true, spreadsheets: "manual", generic: "limited" },
  { name: "QuickBooks / Xero sync", grantledger: true, spreadsheets: false, generic: true },
  { name: "Audit-ready PDF reports", grantledger: true, spreadsheets: false, generic: false },
  { name: "Equipment threshold alerts", grantledger: true, spreadsheets: false, generic: false },
  { name: "Single audit preparation", grantledger: true, spreadsheets: "manual", generic: false },
  { name: "Confidence ratings", grantledger: true, spreadsheets: false, generic: false },
];

type CellValue = boolean | string;

function CellDisplay({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <svg className="mx-auto h-5 w-5 text-success-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  }
  if (value === false) {
    return (
      <svg className="mx-auto h-5 w-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return <span className="text-xs font-medium text-slate-500 capitalize dark:text-slate-400">{value}</span>;
}

export function ComparisonTable({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <caption className="sr-only">Feature comparison: GrantLedger vs Spreadsheets vs Generic Accounting</caption>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th scope="col" className="w-1/4 py-4 pr-6 text-left font-medium text-slate-500 dark:text-slate-400">Feature</th>
            <th scope="col" className="w-1/4 py-4 px-6 text-center">
              <span className="inline-flex items-center gap-1.5 font-semibold text-primary-700">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary-600 text-[10px] font-bold text-white">GL</span>
                GrantLedger
              </span>
            </th>
            <th scope="col" className="w-1/4 py-4 px-6 text-center font-medium text-slate-500 dark:text-slate-400">Spreadsheets</th>
            <th scope="col" className="w-1/4 py-4 pl-6 text-center font-medium text-slate-500 dark:text-slate-400">Generic Accounting</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {features.map((row) => (
            <tr key={row.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
              <td className="py-3.5 pr-6 text-sm text-slate-700 dark:text-slate-300">{row.name}</td>
              <td className="py-3.5 px-6 text-center bg-primary-50/30 dark:bg-primary-900/20">
                <CellDisplay value={row.grantledger} />
              </td>
              <td className="py-3.5 px-6 text-center">
                <CellDisplay value={row.spreadsheets} />
              </td>
              <td className="py-3.5 pl-6 text-center">
                <CellDisplay value={row.generic} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
