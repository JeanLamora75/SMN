import { lstat, mkdir, rename, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

export type RecoveryOutcome = Readonly<{ archivedAt: string }>;

/**
 * Met de côté UN seul cluster situé sous le profil SMN, sans supprimer
 * ni modifier ses données. L'appelant contrôle d'abord l'absence de runtime.json
 * et de processus PostgreSQL actif, ainsi que le consentement explicite.
 */
export async function archiveIncompleteCluster(root: string): Promise<RecoveryOutcome> {
  const data = path.join(root, "data");
  const stat = await lstat(data);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("managed-cluster-unsafe");
  const pid = path.join(data, "postmaster.pid");
  try {
    await access(pid);
    throw new Error("managed-cluster-running-or-unclean");
  } catch (e) {
    if (!(e && typeof e === "object" && "code" in e && e.code === "ENOENT"))
      throw e;
  }
  const backupRoot = path.join(root, "recovery");
  await mkdir(backupRoot, { recursive: true, mode: 0o700 });
  const name = "data-partial-" + new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomBytes(4).toString("hex");
  const archive = path.join(backupRoot, name);
  // Déplacement atomique dans le même profil/dans le même volume.
  await rename(data, archive);
  return { archivedAt: name };
}
