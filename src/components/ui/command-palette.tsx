"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCommandPalette, type CommandFilter } from "@/hooks/use-command-palette";

const SECTION_ICONS: Record<string, React.ReactNode> = {
  Navigation: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  Actions: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Grants: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
};

const FILTER_TABS: CommandFilter[] = ["All", "Grants", "Expenses", "Settings"];

export function CommandPalette() {
  const {
    isOpen,
    close,
    query,
    setQuery,
    results,
    selectedIndex,
    onKeyDown,
    select,
    activeFilter,
    setActiveFilter,
    recentSearches,
    applyRecentSearch,
  } = useCommandPalette();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector("[data-selected=true]");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Group results by section
  const sections: Record<string, typeof results> = {};
  results.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-command-palette bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* Palette */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-0 bottom-0 z-command-palette mx-auto max-w-lg overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl md:inset-x-4 md:bottom-auto md:top-[20vh] md:rounded-2xl dark:border-slate-700 dark:bg-slate-800"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 px-4">
              <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search grants, pages, actions..."
                className="w-full border-0 bg-transparent py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100"
              />
              <kbd className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 sm:inline">
                ESC
              </kbd>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-700 px-4 py-1.5">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilter(tab)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    activeFilter === tab
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Recent searches */}
            {!query && recentSearches.length > 0 && (
              <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-2">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recent Searches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      type="button"
                      onClick={() => applyRecentSearch(search)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                      <svg className="h-3 w-3 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
              {results.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {query ? (
                    <>No results found for &ldquo;{query}&rdquo;</>
                  ) : (
                    <>No items match the selected filter.</>
                  )}
                </div>
              ) : (
                Object.entries(sections).map(([section, items]) => (
                  <div key={section} role="group" aria-label={section}>
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {section}
                    </div>
                    {items.map((item) => {
                      flatIndex++;
                      const idx = flatIndex;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          data-selected={isSelected}
                          onClick={() => select(idx)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isSelected
                              ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <span className={isSelected ? "text-primary-500" : "text-slate-400"}>
                            {SECTION_ICONS[section]}
                          </span>
                          <span className="truncate">{item.label}</span>
                          {isSelected && (
                            <span className="ml-auto text-xs text-primary-400">Enter</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-800">&uarr;</kbd>
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-800">&darr;</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-800">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-800">Esc</kbd>
                Close
              </span>
              <span className="ml-auto">
                Press <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-800">?</kbd> for all shortcuts
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
