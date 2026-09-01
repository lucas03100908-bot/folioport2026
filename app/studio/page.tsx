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
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-32">
        <p className="eyebrow">Studio</p>
        <p className="mt-5 text-[13px] leading-relaxed text-muted">
          The studio only runs locally. Start the site with{" "}
          <code className="text-ink">npm run dev</code> and open{" "}
          <code className="text-ink">/studio</code> there to add stills and links.
        </p>
      </main>
    );
  }

  return <StudioClient projects={PROJECTS} />;
}
