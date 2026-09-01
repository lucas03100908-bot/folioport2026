import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { PROJECTS } from "@/lib/content";

/**
 * Writes a project's thumbnail and link from /studio.
 *
 * DEVELOPMENT ONLY. This endpoint writes files into the repo, so it answers
 * 404 in a production build — a deployed site must never expose a write
 * endpoint, and the deployed filesystem is read-only anyway. Every input is
 * treated as hostile even so: the id must match a known project (which is also
 * what makes path traversal impossible, since the filename is built from that
 * id and never from the upload), the extension comes from an allow-list of
 * MIME types rather than the uploaded filename, and the body is size-capped.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
  "image/gif": "gif",
};

type Override = { thumbnail?: string; projectUrl?: string };

const OVERRIDES_FILE = path.join(process.cwd(), "lib", "project-overrides.json");
const THUMBS_DIR = path.join(process.cwd(), "public", "thumbs");

const devOnly = () =>
  process.env.NODE_ENV === "production"
    ? new NextResponse("Not found", { status: 404 })
    : null;

async function readOverrides(): Promise<Record<string, Override>> {
  try {
    return JSON.parse(await readFile(OVERRIDES_FILE, "utf8"));
  } catch {
    return {};
  }
}

export async function GET() {
  const blocked = devOnly();
  if (blocked) return blocked;
  return NextResponse.json(await readOverrides());
}

export async function POST(req: Request) {
  const blocked = devOnly();
  if (blocked) return blocked;

  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  if (!PROJECTS.some((p) => p.id === id)) {
    return NextResponse.json({ error: "Unknown project id." }, { status: 400 });
  }

  const overrides = await readOverrides();
  const entry: Override = { ...overrides[id] };

  /* --- the link ------------------------------------------------------- */
  const rawUrl = String(form.get("projectUrl") ?? "").trim();
  if (rawUrl) {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json(
        { error: "That link is not a valid URL." },
        { status: 400 },
      );
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "Links must be http or https." },
        { status: 400 },
      );
    }
    entry.projectUrl = parsed.toString();
  } else if (form.has("projectUrl")) {
    delete entry.projectUrl;
  }

  /* --- the still ------------------------------------------------------ */
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Images must be under ${MAX_BYTES / 1024 / 1024} MB.` },
        { status: 413 },
      );
    }
    const ext = EXT_BY_TYPE[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Unsupported image type: ${file.type || "unknown"}.` },
        { status: 415 },
      );
    }
    // the name comes from the validated id, never from the upload
    const filename = `${id}.${ext}`;
    await writeFile(
      path.join(THUMBS_DIR, filename),
      Buffer.from(await file.arrayBuffer()),
    );
    // the query string busts Next's image cache after a re-upload
    entry.thumbnail = `/thumbs/${filename}?v=${Date.now()}`;
  }

  overrides[id] = entry;
  await writeFile(OVERRIDES_FILE, `${JSON.stringify(overrides, null, 2)}\n`);

  return NextResponse.json({ ok: true, id, ...entry });
}
