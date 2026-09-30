// Only same-origin paths. Rejects '//host', '/\host', '@host' and full URLs,
// which would otherwise turn the auth callback into an open redirect.
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
