import { randomBytes, timingSafeEqual } from "node:crypto";
import { prepareManaged } from "./portable";
import { installExpress } from "../installation/install";

type Status = "idle" | "working" | "complete" | "failed";
type BootstrapState = { status: Status; step: string; error: string | null; task: Promise<void> | null };
type Store = { secret: string; state: BootstrapState };
declare global { var __smnInstaller: Store | undefined; }
function store(): Store {
  return globalThis.__smnInstaller ??= {
    secret: randomBytes(32).toString("hex"),
    state: { status: "idle", step: "", error: null, task: null },
  };
}
export function localCookieValue(): string { return store().secret; }
export function checkLocalCookie(raw: string | undefined): boolean {
  const secret = store().secret;
  if (!raw || raw.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(raw), Buffer.from(secret));
}
export function bootstrapStatus(): { status: Status; step: string; error: string | null } {
  const { status, step, error } = store().state;
  return { status, step, error };
}
export function beginBootstrap(body: unknown): boolean {
  const owner = store();
  const s = owner.state;
  if (s.status !== "idle" && s.status !== "failed") return false;
  s.status = "working"; s.error = null;
  s.step = "Préparation de SMN";
  s.task = (async () => {
    try {
      const uri = await prepareManaged(step => { s.step = step; });
      s.step = "Création du produit, de l'équipe et du compte Administrateur";
      const result = await installExpress(body, uri);
      if (!result.ok) throw new Error(result.status);
      s.status = "complete";
      s.step = "Installation terminée";
    } catch (error) {
      s.status = "failed";
      s.error = error instanceof Error ? error.message : "installation-failed";
      s.step = "Installation interrompue sans réinitialisation automatique";
    }
  })();
  return true;
}
