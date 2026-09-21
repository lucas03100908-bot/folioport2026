"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * A heading that rises into its own line the first time it comes into view,
 * like a title card lifting into frame.
 *
 * Visible by default: the hidden state only applies once this script has
 * armed the element (`data-armed`), so a failed hydration can never leave a
 * heading invisible. Change `k` to replay it, e.g. when the text changes.
 */
export default function Reveal({
  as: Tag = "h2",
  className = "",
  children,
  k,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  k?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.removeAttribute("data-in");
    el.setAttribute("data-armed", "");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        // one frame so the armed state paints before the transition starts
        requestAnimationFrame(() => el.setAttribute("data-in", ""));
        io.disconnect();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [k]);

  return (
    <Tag ref={ref} className={`reveal ${className}`}>
      <span className="reveal-line">{children}</span>
    </Tag>
  );
}
