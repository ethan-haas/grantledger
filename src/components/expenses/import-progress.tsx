"use client";

interface ImportProgressProps {
  current: number;
  total: number;
  phase: "importing" | "categorizing" | "done";
}

export function ImportProgress({ current, total, phase }: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const labels = {
    importing: "Importing expenses...",
    categorizing: "AI categorizing expenses...",
    done: "Complete!",
  };

  return (
    <div className="space-y-3" aria-live="polite" aria-atomic="true">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">{labels[phase]}</span>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">
          {current}/{total} ({percentage}%)
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            phase === "done"
              ? "bg-gradient-to-r from-success-500 to-success-400"
              : "bg-gradient-to-r from-primary-600 to-accent-500 bg-[length:200%_100%] animate-shimmer"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {phase === "done" && (
        <p className="text-xs text-success-600 dark:text-success-400 font-medium">
          {current} of {total} expenses categorized by AI
        </p>
      )}
    </div>
  );
}
