import { randomBytes, timingSafeEqual } from "node:crypto";
import { prepareManaged } from "./portable";
import { prepareExisting, rememberExisting, validateExistingDbInput } from "./existing";
import { installExpress } from "../installation/install";

type Status = "idle" | "working" | "complete" | "failed";
/**
 * Only pre-declared, non-sensitive diagnostic identifiers may reach an
 * unauthenticated installation status endpoint. Never forward arbitrary
 * errors from fs, pg, spawn or libraries (paths and credentials may appear).
 */
const publicBootstrapErrors = new Set([
  "postgres-credentials-invalid","unsupported-postgres","postgres-auth-invalid",
  "postgres-permission-denied","postgres-unreachable","postgres-connection-failed",
  "configuration-key-missing","configuration-key-invalid","configuration-key-unavailable",
  "configuration-decryption-failed","postgres-config-invalid","postgres-config-save-failed",
  "managed-config-invalid","managed-cluster-unrecognized","managed-cluster-needs-recovery",
  "managed-cluster-running","managed-cluster-unsafe","managed-pg-no-bindable-port",
  "managed-pg-bind-denied","managed-pg-port-in-use","managed-pg-locked","managed-pg-shared-memory",
  "managed-pg-permission-denied","managed-pg-runtime-incomplete","managed-pg-config-invalid",
  "managed-pg-data-incompatible","managed-pg-start-failed","postgres-runtime-invalid",
  "postgres-download-unavailable","postgres-archive-invalid","postgres-archive-too-large",
  "manual-connection-configured","windows-required","installation-failed",
  "verification-failed","not-empty","createdb-required","database-already-present",
  "database-missing","configuration-missing","configuration-invalid","virgin",
  "initialized","schema-incompatible","installation-incomplete","connection-error",
  "permissions-insufficient","server-version-unsupported",
  "baseline-v32-unavailable","baseline-v32-incompatible",
]);
export function safeBootstrapError(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  return publicBootstrapErrors.has(code) ? code : "installation-failed";
}
type BootstrapState = { status: Status; step: string; progress: number; error: string | null; task: Promise<void> | null };
type Store = { secret: string; state: BootstrapState };
declare global { var __smnInstaller: Store | undefined; }
function store(): Store {
  return globalThis.__smnInstaller ??= {
    secret: randomBytes(32).toString("hex"),
    state: { status: "idle", step: "", progress: 0, error: null, task: null },
  };
}
export function localCookieValue(): string { return store().secret; }
export function checkLocalCookie(raw: string | undefined): boolean {
  const secret = store().secret;
  if (!raw || raw.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(raw), Buffer.from(secret));
}
export function bootstrapStatus(): { status: Status; step: string; progress: number; error: string | null } {
  const { status, step, progress, error } = store().state;
  return { status, step, progress, error };
}
export function validateDatabaseChoice(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const data = raw as Record<string,unknown>;
  return data.dbMode === "portable" ||
    (data.dbMode === "existing" && validateExistingDbInput(raw) !== null);
}
export function beginBootstrap(body: unknown): boolean {
  const owner = store(), s = owner.state;
  if (!validateDatabaseChoice(body) || (s.status !== "idle" && s.status !== "failed")) return false;
  const data = body as { dbMode: "portable" | "existing"; recoverPartial?: unknown };
  // Consentement de récupération séparé et lié au diagnostic observé.
  const approvedRecovery = data.dbMode === "portable" && data.recoverPartial === true;
  if (data.recoverPartial === true && !approvedRecovery) return false;
  if (approvedRecovery && !(s.status === "failed" && s.error === "managed-cluster-needs-recovery")) return false;
  s.status = "working"; s.error = null; s.progress = 5; s.step = "Vérification des informations";
  s.task = (async () => {
    try {
      let uri: string;
      if (data.dbMode === "existing") {
        const input = validateExistingDbInput(body);
        if (!input) throw new Error("postgres-credentials-invalid");
        s.progress = 20; s.step = "Connexion au serveur PostgreSQL local";
        uri = await prepareExisting(input);
        s.progress = 45; s.step = "Serveur PostgreSQL vérifié";
      } else {
        s.progress = 15;
        uri = await prepareManaged(step => {
          s.step = step;
          // Avancement par étapes réelles, jamais une estimation du téléchargement.
          if (step.includes("composants")) s.progress = 25;
          else if (step.includes("Création d'une instance")) s.progress = 45;
          else if (step.includes("Démarrage")) s.progress = 60;
        }, approvedRecovery);
        s.progress = 65;
      }
      s.step = "Création de la base SMN et de ses tables"; s.progress = 70;
      const result = await installExpress(body, uri);
      if (!result.ok) throw new Error(result.status);
      s.progress = 90; s.step = "Enregistrement de la configuration";
      if (data.dbMode === "existing") {
        const input = validateExistingDbInput(body);
        if (!input) throw new Error("postgres-credentials-invalid");
        await rememberExisting(input);
      }
      s.progress = 100; s.status = "complete"; s.step = "Installation terminée";
    } catch (error) {
      s.status = "failed";
      s.error = safeBootstrapError(error);
      s.step = "Installation interrompue : voir le message de diagnostic";
    }
  })();
  return true;
}
