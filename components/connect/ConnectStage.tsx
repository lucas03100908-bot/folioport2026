"use client";

/**
 * Stage 4.
 *
 * Almost nothing here on purpose: the spider does the guiding, so the copy only
 * has to name the place. Everything in this layer is pointer-events:none except
 * the words themselves — the links in <ConnectField/> sit behind it and must
 * stay clickable through every gap.
 */
export default function ConnectStage() {
  return (
    <section
      data-stage="connect"
      className="pointer-events-none relative h-[200vh] w-full"
    >
      <div className="sticky top-0 flex h-svh w-full items-end justify-center px-5 pb-20 md:px-12">
        <div className="relative flex flex-col items-center gap-3 text-center">
          <p className="eyebrow">Connect</p>
          <p className="px-6 text-[13px] leading-relaxed tracking-[0.1em] text-ink/80 md:text-[12px] md:tracking-[0.14em] md:text-muted">
            Follow it — every word is a link.
          </p>
        </div>
      </div>
    </section>
  );
}
