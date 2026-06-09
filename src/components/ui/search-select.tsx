"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";

interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  label,
  error,
  id,
  className = "",
  disabled = false,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setSearch("");
    setHighlightedIndex(0);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  const selectOption = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      closeDropdown();
    },
    [onChange, closeDropdown]
  );

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, closeDropdown]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const highlighted = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    highlighted?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const handleTriggerKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openDropdown();
      }
    },
    [openDropdown]
  );

  const handleSearchKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            selectOption(filteredOptions[highlightedIndex].value);
          }
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown();
          break;
      }
    },
    [filteredOptions, highlightedIndex, selectOption, closeDropdown]
  );

  const borderClass = error
    ? "border-danger-500 bg-danger-50/50 dark:bg-danger-700/10"
    : "border-slate-300 dark:border-slate-600";

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors duration-150 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-slate-800 dark:hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50 ${borderClass}`}
      >
        <span className={selectedOption ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`ml-2 h-4 w-4 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-dropdown mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-soft-lg dark:border-slate-600 dark:bg-slate-800"
          role="dialog"
          aria-label="Search and select"
        >
          <div className="border-b border-slate-200 p-2 dark:border-slate-600">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label="Search options"
              aria-activedescendant={
                filteredOptions[highlightedIndex]
                  ? `${id || "search-select"}-option-${highlightedIndex}`
                  : undefined
              }
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <ul
            ref={listRef}
            id={id ? `${id}-listbox` : undefined}
            role="listbox"
            aria-label={label || "Options"}
            className="max-h-60 overflow-auto p-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                No results found
              </li>
            ) : (
              filteredOptions.map((opt, index) => (
                <li
                  key={opt.value}
                  id={`${id || "search-select"}-option-${index}`}
                  role="option"
                  aria-selected={opt.value === value}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(opt.value)}
                  className={`cursor-pointer rounded-md px-3 py-2 text-sm transition-colors ${
                    index === highlightedIndex
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-700/20 dark:text-primary-400"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                  } ${opt.value === value ? "font-medium" : ""}`}
                >
                  {opt.label}
                  {opt.value === value && (
                    <svg
                      className="ml-auto inline h-4 w-4 text-primary-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && (
        <p id={id ? `${id}-error` : undefined} className="mt-1 text-xs text-danger-600 dark:text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
}
