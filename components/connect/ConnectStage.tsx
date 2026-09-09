"use client";

/**
 * Stage 4.
 *
 * Almost nothing here on purpose — but the spider cannot do all the guiding on
 * its own, because nothing else on the page says it is there. The only sentence
 * that explained it used to live inside the iOS motion-permission dialog, which
 * desktop and Android visitors never see. So the screen now says what to do. Everything in this layer is pointer-events:none except
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
          <p className="px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted md:text-[10px] md:tracking-[0.24em]">
            {/* same split the work stage uses for scroll vs swipe */}
            <span className="max-[899px]:hidden">Move the cursor to read them</span>
            <span className="min-[900px]:hidden">Tilt the phone to read them</span>
          </p>
        </div>
      </div>
    </section>
  );
}
