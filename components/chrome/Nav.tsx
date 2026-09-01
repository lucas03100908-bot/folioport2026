"use client";

import CategoryBar from "@/components/work/CategoryBar";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="glass border-x-0 border-t-0">
        <div className="mx-auto flex h-[var(--nav-h)] max-w-[1400px] items-center gap-4 px-5 md:px-12">
          <a
            href="#top"
            className="shrink-0 text-[13px] font-extrabold uppercase tracking-[0.3em] text-ink transition-colors duration-300 hover:text-accent"
          >
            Minho
          </a>
          <span className="hidden h-4 w-px bg-white/15 md:block" />
          {/* mounted once — never unmounts for the whole scroll */}
          <CategoryBar />
        </div>
      </div>
      {/* scroll-progress hairline */}
      <div className="relative h-px w-full bg-white/8">
        <div
          data-engine="progress"
          className="engine-driven h-px w-full origin-left bg-accent"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </header>
  );
}
