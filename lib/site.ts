/**
 * Where this build thinks it lives.
 *
 * Vercel hands the production host to the build; a preview deploy gets its own,
 * and locally there is neither. Resolved rather than hardcoded so a preview
 * never advertises the production URL as its canonical one.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;

  const any = process.env.VERCEL_URL;
  if (any) return `https://${any}`;

  return "http://localhost:3000";
}
