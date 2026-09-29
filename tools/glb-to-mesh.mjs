/**
 * Turns a .glb into the two things the site actually loads: one quantised
 * mesh buffer and a set of WebP maps.
 *
 * The source of this model is a photogrammetry-style export — 91k triangles,
 * float32 everywhere, and a 6MB PNG roughness map. None of that survives here:
 *
 *   positions  float32 -> int16, normalised against the bounding box (6B/vert)
 *   normals    float32 -> int8   (4B/vert, one byte of padding for alignment)
 *   uvs        float32 -> uint16 (4B/vert)
 *   indices    kept as uint16    (the mesh is under 65536 vertices)
 *   textures   resized and re-encoded as WebP
 *
 * Run it from the project root:
 *   node tools/glb-to-mesh.mjs <input.glb> <public/model> <baseName>
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename } from "node:path";
import sharp from "sharp";

const [src, outDir, name = "mesh"] = process.argv.slice(2);
if (!src || !outDir) {
  console.error("usage: node tools/glb-to-mesh.mjs <in.glb> <outDir> [name]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

/* ------------------------------------------------------------------ glb -- */
const glb = readFileSync(src);
if (glb.toString("utf8", 0, 4) !== "glTF") throw new Error("not a glb");
const jsonLen = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.toString("utf8", 20, 20 + jsonLen));
const binStart = 20 + jsonLen + 8; // skip the BIN chunk header
const bin = glb.subarray(binStart);

const view = (i) => {
  const v = gltf.bufferViews[i];
  return bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength);
};
const TYPED = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const read = (i) => {
  const a = gltf.accessors[i];
  const v = gltf.bufferViews[a.bufferView];
  const T = TYPED[a.componentType];
  const off = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  return new T(bin.buffer, bin.byteOffset + off, a.count * SIZE[a.type]);
};

/* The biggest primitive is the model; anything else in the file (a backdrop
   cube, a stand) is scenery this page does not use. */
let prim = null, node = null, best = -1;
for (const n of gltf.nodes) {
  if (n.mesh === undefined) continue;
  for (const p of gltf.meshes[n.mesh].primitives) {
    const c = gltf.accessors[p.attributes.POSITION].count;
    if (c > best) { best = c; prim = p; node = n; }
  }
}
const POS = read(prim.attributes.POSITION);
const NRM = read(prim.attributes.NORMAL);
const UV = read(prim.attributes.TEXCOORD_0);
const IDX = read(prim.indices);
const vertCount = POS.length / 3;
if (vertCount > 65535) throw new Error("mesh needs 32-bit indices");

/* Node scale folded in here so the runtime never has to know about it. */
const S = node.scale ?? [1, 1, 1];
const T = node.translation ?? [0, 0, 0];
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
const world = new Float32Array(POS.length);
for (let i = 0; i < vertCount; i++) {
  for (let k = 0; k < 3; k++) {
    const v = POS[i * 3 + k] * S[k] + T[k];
    world[i * 3 + k] = v;
    if (v < min[k]) min[k] = v;
    if (v > max[k]) max[k] = v;
  }
}
/* Centred on its own bounding box, so the runtime spins it about its middle
   rather than about wherever the exporter left the origin. */
const centre = [0, 1, 2].map((k) => (min[k] + max[k]) / 2);
const extent = Math.max(...[0, 1, 2].map((k) => max[k] - min[k])) / 2;

const qpos = new Int16Array(vertCount * 3);
for (let i = 0; i < vertCount * 3; i++) {
  const k = i % 3;
  qpos[i] = Math.round(((world[i] - centre[k]) / extent) * 32767);
}
const qnrm = new Int8Array(vertCount * 4);
for (let i = 0; i < vertCount; i++) {
  let x = NRM[i * 3], y = NRM[i * 3 + 1], z = NRM[i * 3 + 2];
  const l = Math.hypot(x, y, z) || 1;
  qnrm[i * 4] = Math.max(-127, Math.round((x / l) * 127));
  qnrm[i * 4 + 1] = Math.max(-127, Math.round((y / l) * 127));
  qnrm[i * 4 + 2] = Math.max(-127, Math.round((z / l) * 127));
}
const quv = new Uint16Array(vertCount * 2);
for (let i = 0; i < vertCount * 2; i++) {
  quv[i] = Math.min(65535, Math.max(0, Math.round(UV[i] * 65535)));
}

/* header: magic, version, counts, then the scale that undoes the quantisation */
const header = Buffer.alloc(32);
header.write("TALM", 0, "ascii");
header.writeUInt32LE(1, 4);
header.writeUInt32LE(vertCount, 8);
header.writeUInt32LE(IDX.length, 12);
header.writeFloatLE(extent, 16);
header.writeFloatLE((max[1] - min[1]) / 2 / extent, 20); // half height, in units of extent
header.writeUInt32LE(0, 24);
header.writeUInt32LE(0, 28);

const out = Buffer.concat([
  header,
  Buffer.from(qpos.buffer, qpos.byteOffset, qpos.byteLength),
  Buffer.alloc((4 - (qpos.byteLength % 4)) % 4),
  Buffer.from(qnrm.buffer, qnrm.byteOffset, qnrm.byteLength),
  Buffer.from(quv.buffer, quv.byteOffset, quv.byteLength),
  Buffer.from(IDX.buffer, IDX.byteOffset, IDX.byteLength),
  Buffer.alloc((4 - (IDX.byteLength % 4)) % 4),
]);
writeFileSync(`${outDir}/${name}.bin`, out);
console.log(
  `${name}.bin ${(out.length / 1048576).toFixed(2)}MB`,
  `${vertCount} verts, ${IDX.length / 3} tris`,
);

/* --------------------------------------------------------------- maps --- */
const mat = gltf.materials[prim.material] ?? {};
const texOf = (t) => (t === undefined ? null : gltf.textures[t.index].source);
const jobs = [
  ["color", texOf(mat.pbrMetallicRoughness?.baseColorTexture), 1024, 82],
  ["normal", texOf(mat.normalTexture), 1024, 86],
  ["rough", texOf(mat.pbrMetallicRoughness?.metallicRoughnessTexture), 512, 78],
];
for (const [label, image, size, quality] of jobs) {
  if (image == null) { console.log(`${label}: none`); continue; }
  const raw = view(gltf.images[image].bufferView);
  const info = await sharp(raw).metadata();
  const buf = await sharp(raw)
    .resize(size, size, { fit: "inside" })
    .webp({ quality, effort: 6 })
    .toBuffer();
  writeFileSync(`${outDir}/${name}-${label}.webp`, buf);
  console.log(
    `${name}-${label}.webp ${(buf.length / 1024).toFixed(0)}KB`,
    `(was ${info.width}x${info.height} ${info.format}, ${(raw.length / 1024).toFixed(0)}KB)`,
  );
}
console.log("source:", basename(src));
