export const INITIAL_MIGRATION = "20261020_smn12_initial";
export const INSTALLATION_RELATIONS = [
  "public._prisma_migrations:r", "public.smn_installation:r", "public.smn_product:r",
  "public.smn_team:r", "public.smn_account:r",
] as const;
export type ExpressInput = Readonly<{ mode: "scrum" | "kanban"; product: string; team: string; password: string }>;
export function validateExpressInput(body: unknown): ExpressInput | null {
  if (!body || typeof body !== "object") return null;
  const v = body as Record<string, unknown>;
  if (v.mode !== "scrum" && v.mode !== "kanban") return null;
  const product = typeof v.product === "string" ? v.product.trim() : "";
  const team = typeof v.team === "string" ? v.team.trim() : "";
  const password = v.password;
  if (product.length < 1 || product.length > 120 || team.length < 1 || team.length > 120 ||
      typeof password !== "string" || password.length < 14 || password.length > 256 ||
      !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return null;
  return { mode: v.mode, product, team, password };
}
