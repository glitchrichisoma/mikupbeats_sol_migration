// Utility to remove query params from the URL without navigating
export function removeQueryParams(keys: string[]): void {
  const url = new URL(window.location.href);
  for (const key of keys) {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, "", url.toString());
}
