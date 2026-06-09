import { GrantForm } from "@/components/grants/grant-form";

export default function NewGrantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Create Grant</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Set up a new federal grant with budget allocation.
        </p>
      </div>
      <GrantForm />
    </div>
  );
}
