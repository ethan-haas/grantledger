const categories = [
  { name: "Personnel", budget: 85, color: "bg-primary-500" },
  { name: "Fringe", budget: 62, color: "bg-accent-500" },
  { name: "Travel", budget: 45, color: "bg-violet-500" },
  { name: "Supplies", budget: 78, color: "bg-emerald-500" },
  { name: "Contractual", budget: 33, color: "bg-amber-500" },
];

const expenses = [
  { vendor: "Office Depot", amount: "$1,245.00", category: "Supplies", confidence: "High" },
  { vendor: "Delta Airlines", amount: "$892.50", category: "Travel", confidence: "High" },
  { vendor: "ADP Payroll", amount: "$24,500.00", category: "Personnel", confidence: "High" },
];

export function ProductMockup() {
  return (
    <div className="relative mx-auto max-w-4xl" role="img" aria-label="GrantLedger dashboard showing budget tracking, expense categorization, and compliance monitoring">
      {/* Gradient border wrapper */}
      <div className="rounded-2xl bg-gradient-to-b from-slate-200 via-slate-200 to-slate-300/50 p-px shadow-soft-xl">
        {/* Browser chrome */}
        <div className="rounded-2xl bg-white overflow-hidden" aria-hidden="true">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            </div>
            <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-slate-100 text-[10px] text-slate-400">
              app.grantledger.com/dashboard
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-6">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Budget", value: "$250,000", sub: "FY 2025" },
                { label: "Spent", value: "$147,350", sub: "58.9%" },
                { label: "Confirmed", value: "142", sub: "expenses" },
                { label: "Pending", value: "8", sub: "to review" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-medium text-slate-400">{stat.label}</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">{stat.value}</p>
                  <p className="text-[9px] text-slate-400">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-4">
              {/* Budget bars */}
              <div className="col-span-3 rounded-lg border border-slate-100 p-4">
                <p className="mb-3 text-xs font-semibold text-slate-700">Budget vs Actual</p>
                <div className="space-y-2.5">
                  {categories.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <span className="w-16 text-[10px] text-slate-500 truncate">{cat.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${cat.color}`}
                          style={{ width: `${cat.budget}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[10px] tabular-nums text-slate-500">{cat.budget}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent expenses */}
              <div className="col-span-2 rounded-lg border border-slate-100 p-4">
                <p className="mb-3 text-xs font-semibold text-slate-700">Recent Expenses</p>
                <div className="space-y-2">
                  {expenses.map((exp) => (
                    <div key={exp.vendor} className="flex items-center justify-between rounded-md bg-slate-50/80 px-2.5 py-2">
                      <div>
                        <p className="text-[10px] font-medium text-slate-700">{exp.vendor}</p>
                        <p className="text-[9px] text-slate-400">{exp.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold tabular-nums text-slate-800">{exp.amount}</p>
                        <span className="inline-block rounded-full bg-success-50 px-1.5 py-0.5 text-[8px] font-medium text-success-700">
                          {exp.confidence}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
