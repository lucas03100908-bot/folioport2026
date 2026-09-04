"use client";

import { useRef, useState } from "react";
import { CONTACT, EMAIL, SOCIALS } from "@/lib/content";

export default function Footer() {
  const [state, setState] = useState<"idle" | "copied" | "selected">("idle");
  const address = useRef<HTMLSpanElement>(null);
  /** so a second press restarts the message rather than inheriting its timer */
  const revert = useRef(0);

  /*
   * A mailto on a phone throws you into whatever mail app happens to be
   * registered, which is often not the one you use — and there was no other
   * way to get the address off this page.
   *
   * The clipboard can refuse: an insecure context, a denied permission, an
   * embedded view. Failing silently would leave a button that visibly does
   * nothing, so the fallback selects the address in place — one keystroke
   * away, or a long-press on a phone — and says which of the two happened.
   */
  const copy = async () => {
    try {
      /* Raced, because a blocked clipboard does not always reject — in some
         embedded views the promise simply never settles, and an un-awaited
         `await` there leaves a button that looks alive and does nothing. */
      await Promise.race([
        navigator.clipboard.writeText(EMAIL),
        new Promise((_, reject) => window.setTimeout(reject, 600)),
      ]);
      setState("copied");
    } catch {
      const node = address.current;
      const sel = window.getSelection();
      if (node && sel) {
        const range = document.createRange();
        range.selectNodeContents(node);
        sel.removeAllRanges();
        sel.addRange(range);
        setState("selected");
      }
    }
    window.clearTimeout(revert.current);
    revert.current = window.setTimeout(() => setState("idle"), 2400);
  };

  return (
    /* z-20 puts it above the connect layers (z-11/12). They are `fixed` and
       full-viewport, so at z-10 the blurred link field was painting straight
       over the spec sheet and washing it out. */
    <footer className="relative z-20 w-full bg-black px-5 py-16 md:px-12">
      {/* the added layer: the link field dissolves into solid black on the way
          in, so the footer arrives rather than collides */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-32 bg-gradient-to-b from-transparent via-black/70 to-black"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/12" />
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-[1fr_auto]">
        <div className="glass glass-rim max-w-[620px] rounded-xl p-7 md:p-9">
          <p className="eyebrow">Contact — Spec Sheet</p>
          <dl className="mt-7 flex flex-col gap-3.5">
            {CONTACT.map(([k, v]) => (
              <div key={k} className="dotted text-muted">
                <dt className="uppercase tracking-[0.18em] text-faint">{k}</dt>
                <dd className="text-ink">
                  {v === EMAIL ? (
                    <button
                      type="button"
                      onClick={copy}
                      aria-label={`Copy email address ${EMAIL}`}
                      className="group inline-flex items-center gap-2.5 transition-colors duration-300 hover:text-accent"
                    >
                      <span ref={address}>{EMAIL}</span>
                      <span
                        aria-hidden
                        className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint transition-colors duration-300 group-hover:text-accent"
                      >
                        {state === "copied"
                          ? "Copied"
                          : state === "selected"
                            ? "Press ⌘C"
                            : "Copy"}
                      </span>
                    </button>
                  ) : (
                    v
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="display text-[clamp(1.4rem,3vw,2.4rem)] text-ink/80 transition-colors duration-300 hover:text-accent"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-[1400px] items-center justify-between border-t border-white/10 pt-6">
        <span className="font-mono text-[10px] tracking-[0.2em] text-faint">
          © {new Date().getFullYear()} KIM MINHO
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-faint">
          SCROLL-DRIVEN / 2026
        </span>
      </div>
    </footer>
  );
}
