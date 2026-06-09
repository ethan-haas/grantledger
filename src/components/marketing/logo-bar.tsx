const logos = [
  { name: "Community Health Partners", abbrev: "CHP", weight: "font-bold" },
  { name: "Pacific Education Foundation", abbrev: "PEF", weight: "font-extrabold" },
  { name: "Southwest Family Services", abbrev: "SFS", weight: "font-semibold" },
  { name: "Northern Youth Alliance", abbrev: "NYA", weight: "font-bold" },
  { name: "Midwest Arts Council", abbrev: "MAC", weight: "font-extrabold" },
  { name: "Green Valley Environmental", abbrev: "GVE", weight: "font-semibold" },
];

export function LogoBar({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
        Trusted by nonprofits nationwide
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {logos.map((logo) => (
          <div
            key={logo.name}
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
            title={logo.name}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/60 dark:bg-slate-700/40">
              <span className="text-[10px] font-bold tracking-tight text-slate-400 dark:text-slate-400">
                {logo.abbrev}
              </span>
            </div>
            <span
              className={`text-sm tracking-tight text-slate-300 dark:text-slate-400 ${logo.weight}`}
            >
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
