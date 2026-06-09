interface ChangelogEntryProps {
  date: string;
  version?: string;
  badges: { label: string; color: string }[];
  title: string;
  items: string[];
  isLast?: boolean;
}

export function ChangelogEntry({ date, version, badges, title, items, isLast }: ChangelogEntryProps) {
  return (
    <div className="relative pl-8 pb-12 last:pb-0">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
      )}
      {/* Timeline dot */}
      <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-2 border-primary-500 bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary-500" />
      </div>
      {/* Content */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500 dark:text-slate-400">{date}</span>
          {version && (
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{version}</span>
          )}
        </div>
        <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span key={badge.label} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
          ))}
        </div>
        <ul className="mt-3 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
