import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
export const PG_ARCHIVE = "postgresql-18.6-5-windows-x64-binaries.zip";
const PG_URL = "https://get.enterprisedb.com/postgresql/" + PG_ARCHIVE;
const PG_SHA256 = "e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2";
// SHA-256 communiqué par EnterpriseDB : https://github.com/EnterpriseDB/edb-installers/issues/733
async function checksum(file: string): Promise<boolean> {
  const data = await readFile(file);
  return createHash("sha256").update(data).digest("hex") === PG_SHA256;
}
export async function acquirePgArchive(destination: string, bundled?: string): Promise<string> {
  if (bundled) {
    if (await checksum(bundled)) return bundled;
    throw new Error("postgres-archive-invalid");
  }
  await mkdir(path.dirname(destination), { recursive: true });
  try { if (await checksum(destination)) return destination; } catch { /* absent */ }
  const tmp = destination + ".downloading";
  await rm(tmp, { force: true });
  try {
    const r = await fetch(PG_URL, { signal: AbortSignal.timeout(180000) });
    if (!r.ok || !r.body || Number(r.headers.get("content-length") ?? 0) > 450 * 1024 * 1024)
      throw new Error("postgres-download-unavailable");
    let total = 0;
    const cap = new Transform({ transform(chunk: Buffer, _encoding, next) {
      total += chunk.length;
      next(total > 450 * 1024 * 1024 ? new Error("postgres-archive-too-large") : null, chunk);
    }});
    await pipeline(Readable.fromWeb(r.body as import("node:stream/web").ReadableStream), cap, createWriteStream(tmp, { flags: "wx" }));
    if (!await checksum(tmp)) throw new Error("postgres-archive-invalid");
    await rename(tmp, destination);
    return destination;
  } catch (e) { await rm(tmp, { force: true }); throw e; }
}
