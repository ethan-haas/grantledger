import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Bento Card — used in problem/features sections                            */
/* -------------------------------------------------------------------------- */

interface BentoCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  accentColor?: string;
}

export function BentoCard({ icon, title, description, accentColor = "bg-primary-500" }: BentoCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-soft-sm transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accentColor}`} />
      <div className="mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat Card — used in benefits/features section                             */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  stat: ReactNode;
  label: string;
  description: string;
}

export function StatCard({ stat, label, description }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft-sm transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800">
      <div className="text-4xl font-bold font-display text-gradient">
        {stat}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
