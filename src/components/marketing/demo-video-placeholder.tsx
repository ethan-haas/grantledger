"use client";

import { useState } from "react";

interface DemoVideoPlaceholderProps {
  videoUrl?: string;
}

export function DemoVideoPlaceholder({ videoUrl }: DemoVideoPlaceholderProps) {
  const [showModal, setShowModal] = useState(false);

  function handleClick() {
    if (videoUrl) {
      window.open(videoUrl, "_blank", "noopener");
    } else {
      setShowModal(true);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="group relative mx-auto block w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 shadow-soft-lg transition-all duration-300 hover:shadow-soft-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:border-slate-700"
        aria-label="Watch 2-minute demo"
      >
        {/* 16:9 aspect ratio container */}
        <div className="relative aspect-video bg-gradient-to-br from-primary-600 via-accent-600 to-violet-600">
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-grid opacity-20" />

          {/* Play button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                <svg className="ml-1 h-8 w-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
            </div>
            <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              Watch 2-minute demo
            </span>
          </div>

          {/* Corner decoration */}
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -top-6 -left-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
        </div>
      </button>

      {/* Coming soon modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-soft-xl animate-scaleIn dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
              <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Demo Coming Soon</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              We&apos;re recording a walkthrough of GrantLedger. Sign up for early access to be notified when it&apos;s ready.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
