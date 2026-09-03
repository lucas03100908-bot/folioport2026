"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CATEGORIES, type CategoryId, type Project } from "@/lib/content";
import { getLenis, scrollToStage } from "@/components/ScrollEngine";

type Filter = CategoryId | "all";

type Ctx = {
  category: Filter;
  setCategory: (c: Filter) => void;
  active: Project | null;
  open: (p: Project) => void;
  close: () => void;
};

const WorkCtx = createContext<Ctx | null>(null);

export const useWork = () => {
  const c = useContext(WorkCtx);
  if (!c) throw new Error("useWork must be used inside <WorkProvider>");
  return c;
};

const VALID = new Set(CATEGORIES.map((c) => c.id));

export default function WorkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [category, setCategoryState] = useState<Filter>("all");
  const [active, setActive] = useState<Project | null>(null);

  /**
   * The rail always opens on the discipline chooser. A stale `#motion` left in
   * the address bar from a previous visit would otherwise drop people straight
   * into a category with no idea the choice existed — so the hash is cleared on
   * load and only ever written *by* a selection. It still tracks live hash
   * changes, so the nav's own links keep working.
   */
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    const fromHash = () => {
      const h = window.location.hash.replace("#", "") as Filter;
      if (VALID.has(h)) setCategoryState(h);
    };
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const setCategory = useCallback((c: Filter) => {
    setCategoryState(c);
    const url = c === "all" ? window.location.pathname : `#${c}`;
    window.history.replaceState(null, "", url);
    // land at the first card of the deck you just opened
    scrollToStage("work");
  }, []);

  /**
   * Opening the panel pushes a history entry, so the browser's own back button
   * closes it. That is the control people reach for to leave something that
   * fills the screen, and without an entry to go back to it took them off the
   * site altogether.
   */
  const open = useCallback((p: Project) => {
    setActive(p);
    window.history.pushState({ minhoDetail: p.id }, "");
  }, []);

  const close = useCallback(() => {
    // going back is what actually clears it — popstate below does the closing
    if (window.history.state?.minhoDetail) window.history.back();
    else setActive(null);
  }, []);

  useEffect(() => {
    const onPop = () => setActive(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // The detail panel freezes the page without losing the scroll position.
  useEffect(() => {
    const lenis = getLenis();
    if (active) {
      lenis?.stop();
      document.documentElement.classList.add("lenis-stopped");
    } else {
      lenis?.start();
      document.documentElement.classList.remove("lenis-stopped");
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);

  const value = useMemo<Ctx>(
    () => ({ category, setCategory, active, open, close }),
    [category, setCategory, active, open, close],
  );

  return <WorkCtx.Provider value={value}>{children}</WorkCtx.Provider>;
}
