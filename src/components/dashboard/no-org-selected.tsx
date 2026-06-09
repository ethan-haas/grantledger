"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

export function NoOrgSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center max-w-lg">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
          Select your organization
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          GrantLedger requires an active organization. If you already have one,
          select it below. Otherwise, create a new one to get started.
        </p>
        <div className="mt-6 flex justify-center">
          <OrganizationSwitcher
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
            hidePersonal
            appearance={{
              elements: {
                rootBox: "flex items-center justify-center",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
