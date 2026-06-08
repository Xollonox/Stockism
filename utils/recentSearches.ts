const STORAGE_KEY = 'stockism_recent_searches';

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addRecentSearch(query: string): string[] {
  if (!query.trim()) return getRecentSearches();
  const existing = getRecentSearches().filter(s => s.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...existing].slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY);
}
