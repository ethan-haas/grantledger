import type { ReactNode } from "react";

type SectionBackground = "white" | "neutral" | "gradient" | "dark" | "mesh";
type SectionPadding = "sm" | "md" | "lg";

interface SectionProps {
  children: ReactNode;
  background?: SectionBackground;
  padding?: SectionPadding;
  className?: string;
  id?: string;
}

const bgStyles: Record<SectionBackground, string> = {
  white: "bg-white dark:bg-slate-900",
  neutral: "bg-neutral-50 dark:bg-slate-800/50",
  gradient: "bg-gradient-subtle",
  dark: "bg-neutral-950 text-white",
  mesh: "bg-mesh",
};

const paddingStyles: Record<SectionPadding, string> = {
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-20 lg:py-24",
  lg: "py-20 sm:py-28 lg:py-32",
};

export function Section({
  children,
  background = "white",
  padding = "md",
  className = "",
  id,
}: SectionProps) {
  return (
    <section id={id} className={`${bgStyles[background]} ${paddingStyles[padding]} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
