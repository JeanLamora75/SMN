import { randomBytes, timingSafeEqual } from "node:crypto";
import { prepareManaged } from "./portable";
import { existingUri, saveExistingConfig } from "./settings";
import { installExpress } from "../installation/install";
import { validateExpressInput } from "../installation/contract";

type State = "idle" | "working" | "complete" | "failed";
export type BootstrapProgress = { status: State; step: string; progress: number; error: string | null };
type Job = BootstrapProgress & { task: Promise<void> | null };
type Store = { secret: string; job: Job };
declare global { var __smnInstaller: Store | undefined; }
function store(): Store {
  return globalThis.__smnInstaller ??= {
    secret: randomBytes(32).toString("hex"),
    job: { status: "idle", step: "", progress: 0, error: null, task: null },
  };
}
export function localCookieValue(): string { return store().secret; }
export function checkLocalCookie(raw: string | undefined): boolean {
  const secret = store().secret;
  if (!raw || raw.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(raw), Buffer.from(secret));
}
export function bootstrapStatus(): BootstrapProgress {
  const { status, step, error, progress } = store().job;
  return { status, step, progress, error };
}
function failCode(error: unknown): string {
  const value = error instanceof Error ? error.message : "";
  const allowed = new Set([
    "windows-required","manual-connection-configured","managed-config-invalid",
    "managed-cluster-needs-recovery","managed-port-occupied","postgres-archive-invalid",
    "postgres-download-unavailable","postgres-runtime-invalid",
    "postgres-credentials-invalid","createdb-required","unsupported-postgres",
    "database-already-present","database-missing","installation-incomplete",
    "schema-incompatible","not-empty","permissions-insufficient","connection-error",
    "installation-failed","verification-failed","postgres-error","postgres-config-invalid",
    "configuration-key-invalid","configuration-encrypted-invalid",
  ]);
  return allowed.has(value) ? value : "installation-failed";
}
export function beginBootstrap(body: unknown): boolean {
  const validated = validateExpressInput(body);
  if (!validated || !body || typeof body !== "object") return false;
  const fields = body as Record<string, unknown>;
  const existing = fields.databaseMode === "existing";
  if (!existing && fields.databaseMode !== "portable") return false;
  const username = typeof fields.postgresUser === "string" ? fields.postgresUser : "";
  const password = typeof fields.postgresPassword === "string" ? fields.postgresPassword : "";
  const port = fields.postgresPort === undefined ? 5432 : Number(fields.postgresPort);
  if (existing) {
    try { existingUri(username, password, port); } catch { return false; }
  }
  const s = store().job;
  if (s.status !== "idle" && s.status !== "failed") return false;
  s.status = "working"; s.error = null; s.progress = 5; s.step = "Vérification des informations";
  const advance = (progress: number, step: string) => { s.progress = progress; s.step = step; };
  s.task = (async () => {
    try {
      let uri: string;
      if (existing) {
        advance(15, "Connexion à votre serveur PostgreSQL local");
        uri = existingUri(username, password, port);
      } else {
        advance(12, "Préparation de PostgreSQL pour SMN");
        uri = await prepareManaged(step => {
          const level = /Recherche/i.test(step) ? 16 : /composants/i.test(step) ? 26 : /Création/i.test(step) ? 45 : 60;
          advance(level, step);
        });
      }
      advance(72, "Création de la base SMN et application des migrations");
      const result = await installExpress(validated, uri);
      if (!result.ok) throw new Error(result.status);
      advance(92, "Vérification et enregistrement de la configuration");
      if (existing) await saveExistingConfig(username, password, port);
      advance(100, "Installation terminée");
      s.status = "complete";
    } catch (error) {
      s.status = "failed";
      s.error = failCode(error);
      s.step = "Installation interrompue. Consultez le message ci-dessous.";
    } finally { s.task = null; }
  })();
  return true;
}
