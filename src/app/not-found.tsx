import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-white dark:bg-slate-900">
      {/* SVG Illustration */}
      <div className="animate-fadeIn">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-slate-300 dark:text-slate-600"
          aria-hidden="true"
        >
          {/* Document shape */}
          <rect x="40" y="20" width="120" height="160" rx="12" stroke="currentColor" strokeWidth="3" fill="none" />
          {/* Text lines */}
          <path d="M70 60h60M70 80h60M70 100h40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          {/* Question mark */}
          <text
            x="100"
            y="155"
            textAnchor="middle"
            className="fill-primary-400 dark:fill-primary-500"
            fontSize="48"
            fontWeight="bold"
          >
            ?
          </text>
        </svg>
      </div>

      <h1 className="mt-6 font-display text-5xl font-bold text-slate-900 dark:text-slate-100">
        404
      </h1>
      <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Go Home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-soft-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Dashboard
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 transition-colors hover:text-primary-600 dark:hover:text-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Pricing
        </Link>
        <Link
          href="/blog"
          className="rounded-lg px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 transition-colors hover:text-primary-600 dark:hover:text-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Blog
        </Link>
      </div>

      <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
        If you believe this is an error, please contact support.
      </p>
    </div>
  );
}
