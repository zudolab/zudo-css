/** Check if a URL is external (has a protocol scheme). */
export function isExternal(url: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(url);
}
