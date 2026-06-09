/**
 * Standard headers for authenticated API responses.
 * Prevents CDN/browser caching of user-specific data.
 */
export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
} as const;
