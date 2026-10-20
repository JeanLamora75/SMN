// Source et empreinte fournie par EnterpriseDB pour PG 18.6-5 Windows x64.
// https://github.com/EnterpriseDB/edb-installers/issues/733
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat, readFile } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

export const PG_ARCHIVE = "postgresql-18.6-5-windows-x64-binaries.zip";
export const PG_URL = "https://get.enterprisedb.com/postgresql/" + PG_ARCHIVE;
export const PG_SHA256 = "e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2";

export async function verifyPgArchive(file) {
  const bytes = await readFile(file);
  return createHash("sha256").update(bytes).digest("hex") === PG_SHA256;
}
export async function acquirePgArchive(destination, bundled) {
  if (bundled) {
    try { if (await verifyPgArchive(bundled)) return bundled; }
    catch { /* archive absente, téléchargement autorisé après confirmation */ }
    throw new Error("postgres-archive-invalid");
  }
  await mkdir(path.dirname(destination), { recursive: true });
  try { if (await verifyPgArchive(destination)) return destination; }
  catch { /* archive absente */ }
  const tmp = destination + ".downloading";
  await rm(tmp, { force: true });
  try {
    const response = await fetch(PG_URL, { signal: AbortSignal.timeout(180000), redirect: "follow" });
    if (!response.ok || !response.body) throw new Error("postgres-download-unavailable");
    const expected = Number(response.headers.get("content-length") ?? 0);
    if (expected > 450 * 1024 * 1024) throw new Error("postgres-archive-too-large");
    let bytes = 0;
    const limit = new Transform({ transform(chunk, _encoding, callback) {
      bytes += chunk.length;
      if (bytes > 450 * 1024 * 1024) callback(new Error("postgres-archive-too-large"));
      else callback(null, chunk);
    }});
    await pipeline(Readable.fromWeb(response.body), limit, createWriteStream(tmp, { flags: "wx" }));
    if (!await verifyPgArchive(tmp)) throw new Error("postgres-archive-invalid");
    await rename(tmp, destination);
    return destination;
  } catch (e) {
    await rm(tmp, { force: true });
    throw e;
  }
}
