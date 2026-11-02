/**
 * Dashboard Builder geometry catalog. Geometry never owns business data.
 * Keep released versions available for rendering and deterministic migration.
 */
export type DashboardTemplateId = "M01" | "M02" | "M03" | "M04" | "M05" | "M06";
export type TemplateSlotId = "primary" | "secondary-1" | "secondary-2" | "secondary-3";
export type TemplateCell = Readonly<{ slotId: TemplateSlotId; column: number; row: number; columnSpan: number; rowSpan: number }>;
export type DashboardTemplate = Readonly<{
  id: DashboardTemplateId;
  version: number;
  name: string;
  archived: boolean;
  columns: number;
  rows: number;
  slots: readonly TemplateCell[];
  /** Compact occupied-cell diagram, for the model gallery (not a business view). */
  thumbnail: readonly (readonly TemplateSlotId[])[];
  slotCount: number;
}>;

const define = (id: DashboardTemplateId, name: string, columns: number, rows: number, cells: readonly TemplateCell[], archived = false): DashboardTemplate => {
  const slots = Object.freeze(cells.map(cell => Object.freeze({ ...cell })));
  const thumbnail = Object.freeze(Array.from({ length: rows }, (_, row) =>
    Object.freeze(Array.from({ length: columns }, (_, column) => {
      const cell = slots.find(s => row >= s.row && row < s.row + s.rowSpan && column >= s.column && column < s.column + s.columnSpan);
      if (!cell) throw new Error(`Uncovered geometry: ${id}`);
      return cell.slotId;
    }))
  ));
  if (new Set(slots.map(s => s.slotId)).size !== slots.length || slots.some(s =>
    s.column < 0 || s.row < 0 || s.columnSpan < 1 || s.rowSpan < 1 ||
    s.column + s.columnSpan > columns || s.row + s.rowSpan > rows
  )) throw new Error(`Invalid geometry: ${id}`);
  for (const row of thumbnail) for (const slotId of row) {
    if (!slots.some(s => s.slotId === slotId)) throw new Error(`Invalid thumbnail: ${id}`);
  }
  const occupied = slots.reduce((n, s) => n + s.columnSpan * s.rowSpan, 0);
  if (occupied !== columns * rows) throw new Error(`Overlapping geometry: ${id}`);
  return Object.freeze({ id, version: 1, name, archived, columns, rows, slots, thumbnail, slotCount: slots.length });
};
const c = (slotId: TemplateSlotId, column: number, row: number, columnSpan = 1, rowSpan = 1): TemplateCell =>
  ({ slotId, column, row, columnSpan, rowSpan });

/** Append a new version rather than changing an already-released template in place. */
export const DASHBOARD_TEMPLATES: readonly DashboardTemplate[] = Object.freeze([
  define("M01", "Simple", 1, 1, [c("primary", 0, 0)]),
  define("M02", "Duo", 2, 1, [c("primary", 0, 0), c("secondary-1", 1, 0)]),
  define("M03", "Trio", 3, 1, [c("primary", 0, 0), c("secondary-1", 1, 0), c("secondary-2", 2, 0)]),
  define("M04", "Quatuor", 2, 2, [c("primary", 0, 0), c("secondary-1", 1, 0), c("secondary-2", 0, 1), c("secondary-3", 1, 1)]),
  define("M05", "Asymétrique", 3, 1, [c("primary", 0, 0, 2), c("secondary-1", 2, 0)]),
  define("M06", "Composé", 3, 2, [c("primary", 0, 0, 2, 2), c("secondary-1", 2, 0), c("secondary-2", 2, 1)]),
]);
export const getDashboardTemplate = (id: DashboardTemplateId, version?: number): DashboardTemplate | undefined =>
  DASHBOARD_TEMPLATES.find(t => t.id === id && t.version === (version ?? latestTemplateVersion(id)));
export const latestTemplateVersion = (id: DashboardTemplateId): number | undefined =>
  DASHBOARD_TEMPLATES.filter(t => t.id === id).reduce<number | undefined>((v, t) => Math.max(v ?? 0, t.version), undefined);
export const listCreatableDashboardTemplates = (): readonly DashboardTemplate[] =>
  DASHBOARD_TEMPLATES.filter(t => !t.archived && t.version === latestTemplateVersion(t.id));
export const requireCreatableDashboardTemplate = (id: DashboardTemplateId): DashboardTemplate => {
  const template = getDashboardTemplate(id);
  if (!template || template.archived) throw new Error(`Dashboard template ${id} unavailable for creation`);
  return template;
};

/** Stored slot objects retain arbitrary configuration; no business values are interpreted. */
export type VersionedTemplateBlock<T extends { templateSlotId: string }> = Readonly<{
  templateId: DashboardTemplateId;
  templateVersion: number;
  slots: readonly T[];
}>;
export type TemplateMigration<T extends { templateSlotId: string }> = Readonly<{
  templateId: DashboardTemplateId;
  fromVersion: number;
  toVersion: number;
  migrate: (slots: readonly T[]) => readonly T[];
}>;
/**
 * Explicit migrations only. Never infer a lossy transformation from geometry.
 * Throws before persistence if a path is missing or a configured slot is removed.
 * The caller must persist the returned block transactionally with a revision check.
 */
export function migrateTemplateBlock<T extends { templateSlotId: string }>(
  block: VersionedTemplateBlock<T>,
  migrations: readonly TemplateMigration<T>[],
): VersionedTemplateBlock<T> {
  const target = getDashboardTemplate(block.templateId);
  if (!target) throw new Error(`Unknown template: ${block.templateId}`);
  if (!getDashboardTemplate(block.templateId, block.templateVersion)) throw new Error("Unknown source template version");
  if (block.templateVersion > target.version) throw new Error("Future template version");
  const source = getDashboardTemplate(block.templateId, block.templateVersion)!;
  const validSourceSlots = new Set(source.slots.map(s => s.slotId));
  if (new Set(block.slots.map(s => s.templateSlotId)).size !== block.slots.length ||
      block.slots.some(s => !validSourceSlots.has(s.templateSlotId))) {
    throw new Error("Stored block has duplicate or unknown template slots");
  }
  let slots = structuredClone(block.slots) as T[];
  let version = block.templateVersion;
  while (version < target.version) {
    const candidates = migrations.filter(m => m.templateId === block.templateId && m.fromVersion === version && m.toVersion === version + 1);
    if (candidates.length !== 1) throw new Error(`Missing or ambiguous migration: ${block.templateId} v${version}`);
    const previousIds = new Set(slots.map(s => s.templateSlotId));
    if (previousIds.size !== slots.length) throw new Error("Duplicate templateSlotId");
    const next = structuredClone(candidates[0].migrate(structuredClone(slots))) as T[];
    const nextIds = new Set(next.map(s => s.templateSlotId));
    if (nextIds.size !== next.length || [...previousIds].some(id => !nextIds.has(id))) {
      throw new Error("Migration would discard or duplicate configured slots");
    }
    slots = next;
    version += 1;
  }
  const allowed = new Set(target.slots.map(s => s.slotId));
  if (slots.some(s => !allowed.has(s.templateSlotId))) throw new Error("Migration produced slot absent from geometry");
  return { templateId: block.templateId, templateVersion: version, slots };
}
