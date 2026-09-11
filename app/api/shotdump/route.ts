import { writeFile } from "node:fs/promises";
export async function POST(req: Request) {
  const b = Buffer.from(await req.arrayBuffer());
  await writeFile("/private/tmp/claude-501/-Users-kimminho-Desktop-Port/91ee4e93-d831-4d82-ba15-edea3d298343/scratchpad/shot.png", b);
  return new Response("ok");
}
