"use client";

import { useEffect, useState } from "react";
import { useStarredGrants } from "@/hooks/use-starred-grants";
import { GrantOverviewCard } from "@/components/dashboard/grant-overview-card";
import type { OmbFramework } from "@/lib/supabase/database.types";

interface GrantSummary {
  id: string;
  name: string;
  fundingAgency: string;
  ombFramework: string;
  periodEnd: string;
  totalBudget: number;
  totalSpent: number;
  utilization: number;
  alertCount: number;
  pendingCount: number;
}

interface StarredGrantCardsProps {
  grants: GrantSummary[];
}

export function StarredGrantCards({ grants }: StarredGrantCardsProps) {
  const { isStarred } = useStarredGrants();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sorted = [...grants].sort((a, b) => {
    if (!mounted) return 0;
    const aStarred = isStarred(a.id) ? 1 : 0;
    const bStarred = isStarred(b.id) ? 1 : 0;
    return bStarred - aStarred;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((grant) => (
        <GrantOverviewCard
          key={grant.id}
          id={grant.id}
          name={grant.name}
          fundingAgency={grant.fundingAgency}
          ombFramework={grant.ombFramework as OmbFramework}
          periodEnd={grant.periodEnd}
          totalBudget={grant.totalBudget}
          totalSpent={grant.totalSpent}
          utilization={grant.utilization}
          alertCount={grant.alertCount}
          pendingCount={grant.pendingCount}
        />
      ))}
    </div>
  );
}
