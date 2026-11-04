import {createHash} from "node:crypto";
import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import type {Snapshot} from "./diagnostic";

export const NATIVE_V33_NAME="smn_v33_native_baseline";
export const NATIVE_V33_FILE=()=>resolve(process.cwd(),"prisma","baseline","v33","schema.sql");

/** Exactly one approved v33 DDL snapshot; no runtime dependency on v32 migrations. */
export function nativeV33BaselineSql():string|null{
 const file=NATIVE_V33_FILE();
 if(!existsSync(file))return null;
 const sql=readFileSync(file,"utf8");
 return nativeV33BaselineReady(sql)?sql:null;
}
export function nativeV33BaselineReady(sql:string):boolean{
 if(!sql||sql.length<200000)return false;
 for(const object of ["smn_installation","smn_account","smn_team","agile_mode",
   "smn_indicator_definition","smn_indicator_manual_value","smn_indicator_team_grant",
   "smn_indicator_dashboard_slot","smn_indicator_assert_cycle_integrity","red-purple"])
  if(!sql.includes(object))return false;
 return !/CREATE\s+TABLE\s+(?:(?:"?public"?\.)?)"?smn_installation"?\s*\([^;]*"?mode"?\s+(?:"?text"?)\s+NOT\s+NULL/i.test(sql);
}
export function nativeV33HistoryValid(snapshot:Snapshot,sql:string|null):boolean{
 if(!sql||!nativeV33BaselineReady(sql)||snapshot.installations?.length!==1||
    snapshot.installations[0].schema_version!==33||
    snapshot.installations[0].state!=="initialized")return false;
 const rows=snapshot.migrations;
 if(!rows||rows.length!==1)return false;
 const row=rows[0];
 if(row.migration_name!==NATIVE_V33_NAME||!row.finished_at||row.rolled_back_at)return false;
 if(row.checksum!==createHash("sha256").update(sql).digest("hex"))return false;
 const names=new Set(snapshot.tables);
 return snapshot.shapeValid===true&&snapshot.multiTeamSchemaValid===true&&
  snapshot.teamAgileModeSchemaValid===true&&snapshot.indicatorV33SchemaValid===true&&
  snapshot.paletteSchemaValid===true&&snapshot.tableRead===true&&snapshot.migrationsRead===true&&
  ["public.smn_indicator_team_grant:r","public.smn_indicator_dashboard_slot:r",
    "public.smn_indicator_definition:r","public.smn_indicator_manual_value:r"]
   .every(name=>names.has(name));
}
