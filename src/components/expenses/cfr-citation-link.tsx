"use client";

import { InfoPopover } from "@/components/ui/info-popover";
import { CFR_CITATIONS } from "@/lib/constants/cfr-citations";

interface CfrCitationLinkProps {
  citation: string | null;
}

export function CfrCitationLink({ citation }: CfrCitationLinkProps) {
  if (!citation) return <span className="text-xs text-slate-400">&mdash;</span>;

  const sectionMatch = citation.match(/200\.\d+/);
  const sectionKey = sectionMatch ? sectionMatch[0] : null;
  const summary = sectionKey ? CFR_CITATIONS[sectionKey] : null;

  if (!summary) {
    return <span className="text-xs text-slate-500 dark:text-slate-400">{citation}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-xs text-slate-500 dark:text-slate-400">{citation}</span>
      <InfoPopover title={`2 CFR ${sectionKey}`}>
        <p>{summary}</p>
      </InfoPopover>
    </span>
  );
}
