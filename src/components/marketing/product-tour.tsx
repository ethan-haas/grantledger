"use client";

import { useState } from "react";

const steps = [
  {
    id: "import",
    label: "Import",
    title: "Connect your accounting data",
    description: "Import expenses from QuickBooks, Xero, or CSV. Our guided column mapper handles any format.",
    mockup: (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          </div>
          <span className="text-sm font-semibold text-slate-900">Import Expenses</span>
        </div>
        <div className="mt-4 space-y-3">
          {["QuickBooks Online", "Xero", "CSV Upload"].map((source) => (
            <div key={source} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:border-primary-200 hover:bg-primary-50/50 transition-colors cursor-pointer">
              <div className="h-6 w-6 rounded bg-slate-100" />
              <span className="text-sm text-slate-700">{source}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "categorize",
    label: "AI Categorize",
    title: "AI categorizes every expense",
    description: "GPT-4o Mini maps each expense to an SF-424A category with confidence levels and CFR citations.",
    mockup: (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft-sm">
        <div className="space-y-3">
          {[
            { vendor: "Office Depot", amount: "$2,450", category: "Supplies", confidence: "High", color: "bg-green-100 text-green-700" },
            { vendor: "Delta Airlines", amount: "$890", category: "Travel", confidence: "High", color: "bg-green-100 text-green-700" },
            { vendor: "Acme Consulting", amount: "$15,000", category: "Contractual", confidence: "Medium", color: "bg-amber-100 text-amber-700" },
          ].map((exp) => (
            <div key={exp.vendor} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{exp.vendor}</p>
                <p className="text-xs text-slate-500">{exp.amount}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">{exp.category}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${exp.color}`}>{exp.confidence}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Track budget vs. actual in real time",
    description: "See spending by category, overspend alerts, and equipment threshold warnings across all your grants.",
    mockup: (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft-sm">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Budget", value: "$250,000" },
            { label: "Spent", value: "$142,800" },
            { label: "Utilization", value: "57.1%" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {[
            { cat: "Personnel", pct: 65 },
            { cat: "Travel", pct: 42 },
            { cat: "Supplies", pct: 88 },
          ].map((bar) => (
            <div key={bar.cat} className="flex items-center gap-3">
              <span className="w-20 text-xs text-slate-600">{bar.cat}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${bar.pct > 80 ? "bg-amber-500" : "bg-primary-500"}`} style={{ width: `${bar.pct}%` }} />
              </div>
              <span className="w-10 text-right text-xs font-medium text-slate-700">{bar.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    title: "Generate audit-ready reports",
    description: "Export PDF or CSV reports with CFR citations, confirmation timestamps, and reviewer identities for your single audit.",
    mockup: (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-danger-50 flex items-center justify-center">
            <svg className="h-4 w-4 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Compliance Report</p>
            <p className="text-xs text-slate-500">Generated Feb 24, 2026</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between"><span>Total Expenses:</span><span className="font-medium">247</span></div>
          <div className="flex justify-between"><span>Confirmed:</span><span className="font-medium text-success-600">235</span></div>
          <div className="flex justify-between"><span>With CFR Citations:</span><span className="font-medium">100%</span></div>
          <div className="flex justify-between"><span>Audit Trail:</span><span className="font-medium text-success-600">Complete</span></div>
        </div>
      </div>
    ),
  },
];

export function ProductTour({ className = "" }: { className?: string }) {
  const [activeStep, setActiveStep] = useState("import");
  const current = steps.find((s) => s.id === activeStep) ?? steps[0];

  return (
    <div className={className}>
      {/* Tab nav */}
      <div className="flex justify-center gap-1 rounded-xl bg-slate-100/80 p-1.5 dark:bg-slate-800/80" role="tablist" aria-label="Product tour steps">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={activeStep === step.id}
            aria-controls={`tabpanel-${step.id}`}
            onClick={() => setActiveStep(step.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeStep === step.id
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-center" role="tabpanel" id={`tabpanel-${current.id}`} aria-label={current.title}>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {current.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {current.description}
          </p>
        </div>
        <div className="animate-fadeIn">{current.mockup}</div>
      </div>
    </div>
  );
}
