import Link from "next/link";

/**
 * A wrong address used to land on Next's own white page — the one screen on
 * the site that belonged to no part of it. Same room, same type, one way back.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col justify-between bg-black px-gutter pt-[calc(var(--nav-h)+3.5rem)] pb-safe-[3rem]">
      <p className="text-label uppercase text-ink">Minho</p>

      <div className="mx-auto w-full max-w-page">
        <p className="font-mono text-caption text-faint tabular-nums">404</p>
        <h1 className="display mt-4 text-display-1">Nothing on this reel</h1>
        <p className="mt-6 max-w-[46ch] text-small text-muted">
          The address doesn&rsquo;t match anything here. The work is all on the
          main page.
        </p>
        <Link
          href="/"
          className="hit mt-10 inline-flex items-center gap-3 border border-white/25 px-7 py-4 text-label uppercase text-ink transition-[border-color,background-color] hover:border-accent hover:bg-accent-soft"
        >
          Back to the site
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden>
            <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" fill="none" />
          </svg>
        </Link>
      </div>

      <p className="text-label text-faint">© {new Date().getFullYear()} Kim Minho</p>
    </main>
  );
}
