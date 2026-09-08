import { notFound } from "next/navigation";
import { PROJECTS } from "@/lib/content";
import StudioClient from "./StudioClient";

export const metadata = { title: "Studio — MINHO" };
export const dynamic = "force-dynamic";

/**
 * A local filling-in tool: drop a still onto each project and paste its link.
 * It writes straight into public/thumbs and lib/project-overrides.json, so the
 * site fills up without anyone editing code.
 *
 * Development only — the API behind it refuses to run in a production build.
 */
export default function StudioPage() {
  /*
   * Gone entirely in production, rather than standing there explaining itself.
   *
   * It used to answer 200 with a note saying the tool only runs locally — which
   * is true and useful to whoever is running `npm run dev`, and they are the
   * one person who does not need to be told. To everyone else it is a live URL
   * on a portfolio, indexable, that leads nowhere.
   */
  if (process.env.NODE_ENV === "production") notFound();

  return <StudioClient projects={PROJECTS} />;
}
