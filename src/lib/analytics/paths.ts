/** Only public marketing routes may enter analytics. Never retain access tokens. */
export function isPublicPath(path: unknown): path is string {
  if (typeof path !== 'string' || path.length > 200) return false;
  return /^\/(?:about|mission|services|careers|contact(?:\/testimonials)?|areas|getting-started|privacy|terms|accessibility|nondiscrimination|notice-of-privacy-practices)?\/?$/.test(path)
    || /^\/(?:services|areas|careers)\/[a-z0-9-]+\/?$/.test(path);
}
