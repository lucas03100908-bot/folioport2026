"use client";

import { useRef, useState } from "react";
import type { Project } from "@/lib/content";
import { TODO_URL } from "@/lib/content";

type Status = { kind: "idle" | "saving" | "saved" | "error"; message?: string };

export default function StudioClient({ projects }: { projects: Project[] }) {
  return (
    <main className="mx-auto max-w-[1100px] px-5 py-20 md:px-10">
      <p className="eyebrow">Studio</p>
      <h1 className="display mt-4 text-[clamp(1.8rem,4vw,3rem)]">
        Stills &amp; links
      </h1>
      <p className="mt-5 max-w-[62ch] text-[13px] leading-[1.9] text-muted">
        Drop a still on a project and paste the link its <em>View Project</em>{" "}
        button should open. Saving writes the image into{" "}
        <code className="text-ink">public/thumbs</code> and records it in{" "}
        <code className="text-ink">lib/project-overrides.json</code>, so the change
        is committed with the repo rather than living in a database. Runs locally
        only.
      </p>

      <div className="mt-14 flex flex-col gap-4">
        {projects.map((p) => (
          <Row key={p.id} project={p} />
        ))}
      </div>
    </main>
  );
}

function Row({ project }: { project: Project }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState(
    project.projectUrl === TODO_URL ? "" : project.projectUrl,
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const input = useRef<HTMLInputElement>(null);

  const take = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setStatus({ kind: "error", message: "That file is not an image." });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus({ kind: "idle" });
  };

  const save = async () => {
    setStatus({ kind: "saving" });
    const body = new FormData();
    body.set("id", project.id);
    body.set("projectUrl", url.trim());
    if (file) body.set("file", file);
    try {
      const res = await fetch("/api/studio", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`);
      setStatus({ kind: "saved" });
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Something went wrong.",
      });
    }
  };

  const shown = preview ?? project.thumbnail;

  return (
    <div className="glass grid grid-cols-1 gap-6 rounded-xl p-5 md:grid-cols-[220px_1fr] md:p-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          take(e.dataTransfer.files?.[0]);
        }}
        onClick={() => input.current?.click()}
        className="group relative cursor-pointer overflow-hidden rounded-lg border border-dashed border-white/20 transition-colors hover:border-accent"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shown}
          alt=""
          className="aspect-[3/2] w-full object-cover opacity-70 transition-opacity group-hover:opacity-100"
        />
        <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-center font-mono text-[9px] tracking-[0.2em] text-muted">
          {file ? "READY TO SAVE" : "DROP OR CLICK"}
        </span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => take(e.target.files?.[0])}
        />
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div>
          <p className="eyebrow eyebrow-dim">{project.eyebrow}</p>
          <h2 className="display mt-1.5 text-[1.3rem] text-ink">{project.title}</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="url"
            inputMode="url"
            placeholder="https://…  (View Project link)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/50 px-4 py-2.5 font-mono text-[11px] tracking-[0.06em] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
          <button
            onClick={save}
            disabled={status.kind === "saving"}
            className="shrink-0 rounded-md border border-white/20 px-5 py-2.5 font-mono text-[10px] tracking-[0.2em] text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            {status.kind === "saving" ? "SAVING…" : "SAVE"}
          </button>
        </div>

        <p
          className={`font-mono text-[10px] tracking-[0.18em] ${
            status.kind === "error" ? "text-accent" : "text-faint"
          }`}
        >
          {status.kind === "saved"
            ? "SAVED — RELOAD THE SITE TO SEE IT"
            : status.kind === "error"
              ? status.message?.toUpperCase()
              : project.id}
        </p>
      </div>
    </div>
  );
}
