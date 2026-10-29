import { randomUUID } from "node:crypto";
import type { Client } from "pg";
import { completeConfigurationTask } from "../configuration/tasks";
import {validPalette,type Palette} from "@/lib/appearance";

export type SettingsValues = Readonly<{
  locale: "fr" | "en";
  theme: "light" | "dark";
  palette: Palette;
  referenceCountry: string | null;
}>;
export type GeneralSettings = SettingsValues & Readonly<{
  revision: number;
  updatedAt: Date;
  mode: "scrum" | "kanban";
  product: string;
}>;
export type SettingsResult = {ok:true;settings:GeneralSettings;changed:boolean} |
  {ok:false;error:"invalid-input"|"conflict"|"configuration-unavailable"};

const keys = ["locale","theme","palette","referenceCountry","revision"];
export function parseGeneralSettings(input: unknown): (Omit<SettingsValues,"palette"> & {palette?:Palette;revision:number}) | null {
  if (!input || typeof input!=="object" || Array.isArray(input)) return null;
  const obj = input as Record<string,unknown>;
  // An explicit allowlist prevents changing the immutable mode/product through this endpoint.
  if ((Object.keys(obj).length!==keys.length && Object.keys(obj).length!==keys.length-1) || Object.keys(obj).some(k=>!keys.includes(k))) return null;
  if ((obj.locale!=="fr" && obj.locale!=="en") ||
      (obj.theme!=="light" && obj.theme!=="dark") ||
      (obj.palette!==undefined && !validPalette(obj.palette)) ||
      !Number.isSafeInteger(obj.revision) || (obj.revision as number)<0 ||
      !(obj.referenceCountry===null || (typeof obj.referenceCountry==="string" &&
        /^[A-Z]{2}$/.test(obj.referenceCountry)))) return null;
  return {
    locale:obj.locale,theme:obj.theme,...(validPalette(obj.palette)?{palette:obj.palette}:{}),referenceCountry:obj.referenceCountry as string|null,
    revision:obj.revision as number,
  };
}

type Row = {locale:string;theme:string;palette:string;reference_country:string|null;revision:number;
  updated_at:Date;mode:string;product:string};
function project(row:Row):GeneralSettings {
  if ((row.locale!=="fr" && row.locale!=="en") ||
      (row.theme!=="light" && row.theme!=="dark") ||
      !validPalette(row.palette) ||
      (row.mode!=="scrum" && row.mode!=="kanban") ||
      !Number.isSafeInteger(row.revision) ||
      (row.reference_country!==null && !/^[A-Z]{2}$/.test(row.reference_country)) ||
      typeof row.product!=="string") throw new Error("settings-corrupt");
  return {locale:row.locale,theme:row.theme,palette:row.palette,referenceCountry:row.reference_country,
    revision:row.revision,updatedAt:row.updated_at,
    mode:row.mode,product:row.product};
}
const select = `SELECT s.locale,s.theme,s.palette,s.reference_country,s.revision,s.updated_at,i.mode,COALESCE(p.name,'') AS product
 FROM public.smn_general_settings s
 JOIN public.smn_installation i ON i.id=s.installation_id
 LEFT JOIN LATERAL (SELECT pr.name FROM public.smn_team t
  JOIN public.smn_product pr ON pr.id=t.product_id AND pr.installation_id=t.installation_id
  WHERE t.installation_id=i.id ORDER BY t.id LIMIT 1) p ON true
 WHERE s.installation_id='singleton' AND i.state='initialized'`;
export async function readGeneralSettings(client:Client):Promise<GeneralSettings> {
  const rows=await client.query<Row>(select);
  if (rows.rowCount!==1) throw new Error("settings-unavailable");
  return project(rows.rows[0]);
}
export async function updateGeneralSettings(client:Client,actorId:string,raw:unknown):Promise<SettingsResult> {
  const input=parseGeneralSettings(raw);
  if (!input || typeof actorId!=="string" || !actorId) return {ok:false,error:"invalid-input"};
  await client.query("BEGIN");
  try {
    // Row lock + optimistic revision prevents lost updates from concurrent tabs.
    const rows=await client.query<Row>(select+" FOR UPDATE OF s");
    if (rows.rowCount!==1) {await client.query("ROLLBACK");return {ok:false,error:"configuration-unavailable"};}
    const previous=project(rows.rows[0]);
    if (previous.revision!==input.revision) {
      await client.query("ROLLBACK");return {ok:false,error:"conflict"};
    }
    const before={locale:previous.locale,theme:previous.theme,palette:previous.palette,referenceCountry:previous.referenceCountry};
    const after={locale:input.locale,theme:input.theme,palette:input.palette??previous.palette,referenceCountry:input.referenceCountry};
    if (JSON.stringify(before)===JSON.stringify(after)) {
      await client.query("COMMIT");
      return {ok:true,settings:previous,changed:false};
    }
    const changed=await client.query<{
      locale:string;theme:string;reference_country:string|null;revision:number;updated_at:Date
    }>(`UPDATE public.smn_general_settings SET locale=$1,theme=$2,palette=$3,reference_country=$4,
      revision=revision+1,updated_at=now(),updated_by=$5
      WHERE installation_id='singleton' AND revision=$6
      RETURNING locale,theme,palette,reference_country,revision,updated_at`,
      [input.locale,input.theme,after.palette,input.referenceCountry,actorId,input.revision]);
    if (changed.rowCount!==1) throw new Error("settings-update-failed");
    await client.query(`INSERT INTO public.smn_general_settings_audit
       (id,installation_id,actor_id,old_values,new_values)
       VALUES($1,'singleton',$2,$3::jsonb,$4::jsonb)`,
       [randomUUID(),actorId,JSON.stringify(before),JSON.stringify(after)]);
    if (input.referenceCountry !== null) await completeConfigurationTask(client,"reference-country");
    await client.query("COMMIT");
    const newRow=changed.rows[0];
    return {ok:true,changed:true,settings:{...previous,...after,revision:newRow.revision,updatedAt:newRow.updated_at}};
  } catch(error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  }
}
