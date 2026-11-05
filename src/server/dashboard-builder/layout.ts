import { randomUUID } from "node:crypto";
import {isDashboardIcon} from "../../lib/dashboard-builder/icon-catalog";
import {isCeremonyIconColor,type CeremonyIconColor} from "../../lib/ceremony-appearance";
import {validateBlockDimensions,type BlockDimensions} from "../../lib/dashboard-builder/dimensions";
import {normalizeSlotOptions,type SlotOptions} from "../../lib/dashboard-builder/slot-options";
import { requireDashboardPermission } from "./permissions";
import { resolveDashboardSource, type SourceDescriptor } from "./sources";
import type { Client } from "pg";
import { getDashboardTemplate, type DashboardTemplateId } from "../../lib/dashboard-builder/templates";

export const DASHBOARD_LAYOUT_SCHEMA_VERSION = 1;
export type DashboardSlot = { id: string; templateSlotId: string; source?: string; view?: string; title?:string; icon?:string; iconColor?:CeremonyIconColor; filters?: Record<string,unknown> };
export type DashboardBlock = { id: string; templateId: DashboardTemplateId; templateVersion: number; title?:string; icon?:string; iconColor?:CeremonyIconColor; dimensions?:BlockDimensions; slots: DashboardSlot[] };
export type DashboardRow = { id: string; blocks: DashboardBlock[] };
export type DashboardLayout = { schemaVersion: number; header: { blocks: DashboardBlock[] }; rows: DashboardRow[] };
export type LayoutScope = { installationId: string; accountId: string; teamId: string };
export type StoredLayout = { layout: DashboardLayout; revision: number; persisted: boolean };

const validId = (s: unknown): s is string => typeof s === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(s);
const checkId = (ids: Set<string>, id: unknown): void => {
  if (!validId(id) || ids.has(id)) throw new Error("dashboard-layout-invalid-id");
  ids.add(id);
};
export function validateDashboardLayout(layout: DashboardLayout, sources?:readonly SourceDescriptor[]): void {
  if (!layout || layout.schemaVersion !== DASHBOARD_LAYOUT_SCHEMA_VERSION ||
      !layout.header || !Array.isArray(layout.header.blocks) || layout.header.blocks.length !== 2 ||
      !Array.isArray(layout.rows)) throw new Error("dashboard-layout-invalid-schema");
  const ids = new Set<string>();
  const validateBlock = (block: DashboardBlock) => {
    checkId(ids, block.id);
    if(block.title!==undefined&&(typeof block.title!=="string"||block.title.length>100))throw Error("dashboard-block-title-invalid");
    if(block.icon!==undefined&&!isDashboardIcon(block.icon))throw Error("dashboard-block-icon-invalid");
    if(block.iconColor!==undefined&&!isCeremonyIconColor(block.iconColor))throw Error("dashboard-block-icon-color-invalid");
    if(block.dimensions!==undefined)validateBlockDimensions(block.dimensions);
    const template = getDashboardTemplate(block.templateId, block.templateVersion);
    if (!template || !Array.isArray(block.slots) || block.slots.length !== template.slotCount)
      throw new Error("dashboard-layout-invalid-template");
    const expected = new Set<string>(template.slots.map(s => s.slotId));
    const actual = new Set<string>();
    for (const slot of block.slots) {
      checkId(ids, slot.id);
      if(slot.title!==undefined&&(typeof slot.title!=="string"||slot.title.length>100))throw Error("dashboard-slot-title-invalid");
      if(slot.icon!==undefined&&!isDashboardIcon(slot.icon))throw Error("dashboard-slot-icon-invalid");
      if(slot.iconColor!==undefined&&!isCeremonyIconColor(slot.iconColor))throw Error("dashboard-slot-icon-color-invalid");
      if (!expected.has(slot.templateSlotId) || actual.has(slot.templateSlotId))
        throw new Error("dashboard-layout-invalid-slot");
      actual.add(slot.templateSlotId);
      if(slot.filters!==undefined){
       if(!slot.source||typeof slot.filters!=="object"||Array.isArray(slot.filters))throw Error("dashboard-slot-option-invalid");
       const category=slot.source.split(":")[0];
       normalizeSlotOptions(slot.filters as SlotOptions,category,slot.filters.cycleIdOverride?[String(slot.filters.cycleIdOverride)]:[]);
      }
      if(slot.source!==undefined || slot.view!==undefined){
        if(typeof slot.source!=="string"||typeof slot.view!=="string"||!slot.source||!slot.view)
          throw new Error("dashboard-layout-invalid-view");
        if(sources){
          const choice=resolveDashboardSource(sources,slot.source,slot.view);
          if(choice.status!=="available")throw new Error("dashboard-layout-incompatible-view");
        }
      }
    }
  };
  for (const block of layout.header.blocks) validateBlock(block);
  for (const row of layout.rows) {
    checkId(ids, row.id);
    if (!Array.isArray(row.blocks)) throw new Error("dashboard-layout-invalid-row");
    for (const block of row.blocks) validateBlock(block);
  }
}
function defaultBlock(): DashboardBlock {
  const model = getDashboardTemplate("M01")!;
  return { id: randomUUID(), templateId: model.id, templateVersion: model.version,
    slots: model.slots.map(s => ({ id: randomUUID(), templateSlotId: s.slotId })) };
}
export function createDefaultDashboardLayout(mode: "scrum"|"kanban"): DashboardLayout {
  if (mode !== "scrum" && mode !== "kanban") throw new Error("dashboard-invalid-mode");
  // The source configuration is intentionally empty; no inferred metric or fake values.
  return { schemaVersion: DASHBOARD_LAYOUT_SCHEMA_VERSION,
    header: { blocks: [defaultBlock(), defaultBlock()] },
    rows: [
      { id: randomUUID(), blocks: [defaultBlock(), defaultBlock()] },
      { id: randomUUID(), blocks: [defaultBlock(), defaultBlock()] },
      { id: randomUUID(), blocks: [defaultBlock()] },
    ] };
}
async function checkScope(db: Client, s: LayoutScope): Promise<"scrum"|"kanban"> {
  if (![s.installationId,s.accountId,s.teamId].every(validId)) throw new Error("dashboard-scope-invalid");
  const q = await db.query<{mode:string}>(`
SELECT COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode') AS mode
FROM public.smn_installation i
JOIN public.smn_account a ON a.installation_id=i.id AND a.id=$2
JOIN public.smn_team t ON t.installation_id=i.id AND t.id=$3
WHERE i.id=$1 AND i.state='initialized' AND a.is_active=true
AND a.must_change_password=false
AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
LIMIT 1`, [s.installationId,s.accountId,s.teamId]);
  const mode=q.rows[0]?.mode;
  if (mode !== "scrum" && mode !== "kanban") throw new Error("dashboard-scope-forbidden");
  return mode;
}
/** Missing row returns a transient default: reading never writes. */
export async function readDashboardLayout(db: Client, scope: LayoutScope): Promise<StoredLayout> {
  await requireDashboardPermission(db,scope,"read");
  const mode=await checkScope(db,scope);
  const result=await db.query<{layout:DashboardLayout;revision:string}>(`
SELECT layout,revision FROM public.smn_dashboard_layout
WHERE installation_id=$1 AND account_id=$2 AND team_id=$3`,
[scope.installationId,scope.accountId,scope.teamId]);
  if (!result.rows.length) return {layout:createDefaultDashboardLayout(mode),revision:0,persisted:false};
  const row=result.rows[0];
  validateDashboardLayout(row.layout);
  return {layout:row.layout,revision:Number(row.revision),persisted:true};
}
/** A cancelled draft never calls this method. Expected revision 0 inserts; any conflict fails. */
export async function saveDashboardLayout(db:Client,scope:LayoutScope,layout:DashboardLayout,expectedRevision:number):Promise<StoredLayout>{
  validateDashboardLayout(layout);
  if (!Number.isSafeInteger(expectedRevision)||expectedRevision<0) throw new Error("dashboard-revision-invalid");
  await db.query("BEGIN");
  try {
    await requireDashboardPermission(db,scope,"edit");
    await checkScope(db,scope);
    const referencedCycles=[...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)].flatMap(b=>b.slots)
     .map(slot=>slot.filters?.cycleIdOverride).filter((id):id is string=>typeof id==="string");
    if(referencedCycles.length){
     const cycles=await db.query<{id:string}>(`SELECT id FROM public.smn_sprint WHERE team_id=$1 AND deleted_at IS NULL AND id=ANY($2::text[])
      UNION SELECT id FROM public.smn_kanban_period WHERE team_id=$1 AND deleted_at IS NULL AND id=ANY($2::text[])`,[scope.teamId,referencedCycles]);
     if(referencedCycles.some(id=>!cycles.rows.some(c=>c.id===id)))throw Error("dashboard-slot-cycle-forbidden");
    }
    const q=expectedRevision===0
      ? await db.query<{revision:string}>(`INSERT INTO public.smn_dashboard_layout
(installation_id,account_id,team_id,schema_version,revision,layout)
VALUES($1,$2,$3,$4,1,$5::jsonb) ON CONFLICT DO NOTHING RETURNING revision`,
[scope.installationId,scope.accountId,scope.teamId,layout.schemaVersion,JSON.stringify(layout)])
      : await db.query<{revision:string}>(`UPDATE public.smn_dashboard_layout
SET layout=$5::jsonb,schema_version=$4,revision=revision+1,updated_at=now()
WHERE installation_id=$1 AND account_id=$2 AND team_id=$3 AND revision=$6
RETURNING revision`,
[scope.installationId,scope.accountId,scope.teamId,layout.schemaVersion,JSON.stringify(layout),expectedRevision]);
    if (q.rows.length!==1) throw new Error("dashboard-revision-conflict");
    await db.query("COMMIT");
    return {layout,revision:Number(q.rows[0].revision),persisted:true};
  } catch(error) { await db.query("ROLLBACK");throw error; }
}
