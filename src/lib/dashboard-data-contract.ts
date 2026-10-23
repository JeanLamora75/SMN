/**
 * SMN-21 / SMN-235 à SMN-238 — Contrat de projection collective.
 *
 * Types de contrat partagés, sans SQL ni mutation dans ce module.
 * Les lecteurs SMN-235 utilisent ces types sans jamais convertir
 * une absence de source en 0, ni projeter des données individuelles.
 */
export type DashboardDataSource =
  | "manual"
  | "calculated"
  | "imported"
  | "recorded-events"
  | "closure-snapshot";

export type DashboardUnavailableReason =
  | "producer-not-ready"
  | "schema-missing"
  | "history-missing"
  | "access-denied"
  | "read-failed";

export type DashboardMetric =
  | Readonly<{
      state: "available";
      value: number;
      quality: "known" | "estimated";
      source: DashboardDataSource;
      updatedAt: string | null;
      snapshotVersion: number | null;
    }>
  | Readonly<{ state: "not-recorded" }>
  | Readonly<{
      state: "unavailable";
      reason: DashboardUnavailableReason;
    }>;

export type DashboardCollection<T> =
  | Readonly<{
      state: "available";
      items: readonly T[];
      total: number;
      source: DashboardDataSource;
      snapshotVersion: number | null;
    }>
  | Readonly<{
      state: "unavailable";
      reason: DashboardUnavailableReason;
    }>;

export type DashboardGoal = Readonly<{
  id: string;
  title: string;
  evaluation: "not_evaluated" | "achieved" | "partially_achieved" | "not_achieved";
}>;

export type DashboardEvent = Readonly<{
  id: string;
  kind: "template" | "ceremony" | "exceptional";
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  generationSource: "standard" | "reconstructed" | null;
}>;

export type DashboardAttention = Readonly<{
  id: string;
  kind: "obstacle" | "risk" | "note" | "alert";
  title: string;
  status: string;
}>;

/** Toutes les sections concernent le MÊME cycle de la MÊME équipe. */
export type CollectiveCycleProjection = Readonly<{
  teamId: string;
  cycleId: string;
  cycleStatus: string;
  snapshotVersion: number | null;
  goals: DashboardCollection<DashboardGoal>;
  capacity: Readonly<{ initialJh: DashboardMetric; actualJh: DashboardMetric }>;
  storyPoints: Readonly<{ initial: DashboardMetric; done: DashboardMetric }>;
  tickets: Readonly<{ initial: DashboardMetric; done: DashboardMetric }>;
  workingDaysRemaining: DashboardMetric;
  events: DashboardCollection<DashboardEvent>;
  obstacles: DashboardCollection<DashboardAttention>;
  risks: DashboardCollection<DashboardAttention>;
  notesAndAlerts: DashboardCollection<DashboardAttention>;
}>;

/** Ne pas confondre indisponibilité technique, absence de saisie et zéro réel. */
export function metricNotRecorded(): DashboardMetric {
  return { state: "not-recorded" };
}

export function metricUnavailable(reason: DashboardUnavailableReason): DashboardMetric {
  return { state: "unavailable", reason };
}

/** Ne crée une donnée numérique que si sa valeur et sa provenance sont connues. */
export function metricAvailable(
  value: number,
  metadata: Readonly<{
    quality: "known" | "estimated";
    source: DashboardDataSource;
    updatedAt?: string | null;
    snapshotVersion?: number | null;
  }>
): DashboardMetric {
  if (!Number.isFinite(value)) throw new Error("dashboard-invalid-metric");
  if (metadata.snapshotVersion != null &&
      (!Number.isSafeInteger(metadata.snapshotVersion) || metadata.snapshotVersion < 1))
    throw new Error("dashboard-invalid-snapshot-version");
  return {
    state: "available",
    value,
    quality: metadata.quality,
    source: metadata.source,
    updatedAt: metadata.updatedAt ?? null,
    snapshotVersion: metadata.snapshotVersion ?? null
  };
}

export function collectionUnavailable<T = never>(
  reason: DashboardUnavailableReason
): DashboardCollection<T> {
  return { state: "unavailable", reason };
}

/** items=[] n'est licite qu'après consultation effective d'un producteur fiable. */
export function collectionAvailable<T>(
  items: readonly T[],
  total: number,
  metadata: Readonly<{ source: DashboardDataSource; snapshotVersion?: number | null }>
): DashboardCollection<T> {
  if (!Number.isSafeInteger(total) || total < items.length)
    throw new Error("dashboard-invalid-collection-total");
  if (metadata.snapshotVersion != null &&
      (!Number.isSafeInteger(metadata.snapshotVersion) || metadata.snapshotVersion < 1))
    throw new Error("dashboard-invalid-snapshot-version");
  return {
    state: "available",
    items,
    total,
    source: metadata.source,
    snapshotVersion: metadata.snapshotVersion ?? null
  };
}
