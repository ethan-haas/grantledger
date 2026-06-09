interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <li key={step.label} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                    isCompleted
                      ? "bg-primary-600 text-white shadow-sm"
                      : isCurrent
                        ? "bg-primary-100 text-primary-700 ring-2 ring-primary-600 ring-offset-2 dark:bg-primary-900/30 dark:text-primary-400 dark:ring-offset-slate-900"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`hidden text-sm font-medium sm:inline ${
                  isCurrent ? "text-primary-700 dark:text-primary-400" : isCompleted ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"
                }`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-6 sm:w-12 ${isCompleted ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-700"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
