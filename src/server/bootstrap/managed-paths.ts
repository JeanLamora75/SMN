import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function managedStorageRoot(): string {
  return path.join(process.cwd(), "data", "postgres");
}
export function legacyManagedStorageRoot(): string {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) throw Error("windows-required");
  return path.join(process.env.LOCALAPPDATA, "ScrumMasterNotebook");
}
export function managedRuntimeManifestPath(): string {
  return path.join(legacyManagedStorageRoot(), "runtime.json");
}
/** Resolve only locally computed paths; a manifest may not inject filesystem paths. */
export function managedPostgresExecutable(name: "pg_dump.exe" | "pg_restore.exe"): string | null {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) return null;
  try {
    const config=JSON.parse(readFileSync(managedRuntimeManifestPath(),"utf8"));
    const root=config.version===1?legacyManagedStorageRoot():config.version===2?managedStorageRoot():null;
    if(!root||config.pgBin!==path.join(root,"pgsql","bin")||config.cluster!==path.join(root,"data"))return null;
    const exe=path.join(root,"pgsql","bin",name);
    return existsSync(exe)?exe:null;
  }catch{return null;}
}
