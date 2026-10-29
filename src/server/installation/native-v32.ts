import {createHash} from "node:crypto";
import {existsSync,readFileSync} from "node:fs";
import type {Snapshot} from "./diagnostic";

export const NATIVE_V32_NAME="smn_v32_native_baseline";
export const NATIVE_V32_FILE=new URL("../../../prisma/baseline/v32/schema.sql",import.meta.url);

export function nativeBaselineSql():string|null {
 if(!existsSync(NATIVE_V32_FILE))return null;
 const sql=readFileSync(NATIVE_V32_FILE,"utf8");
 // A dump from a historical installation is NOT automatically a native baseline.
 // It must contain the neutral installation contract and be reviewed separately.
 if(!sql.includes("smn_installation")||!sql.includes("smn_account")||
    !sql.includes("agile_mode")||!sql.includes("smn_team"))return null;
 if(/\bmode\s+text\s+NOT\s+NULL/i.test(sql))return null;
 return sql;
}
export function nativeV32HistoryValid(snapshot:Snapshot,sql:string|null):boolean {
 if(!sql||snapshot.installations?.[0]?.schema_version!==32)return false;
 const rows=snapshot.migrations;
 if(!rows||rows.length!==1)return false;
 const row=rows[0];
 if(row.migration_name!==NATIVE_V32_NAME||!row.finished_at||row.rolled_back_at)return false;
 if(row.checksum!==createHash("sha256").update(sql).digest("hex"))return false;
 return snapshot.shapeValid===true&&snapshot.teamAgileModeSchemaValid===true&&
  snapshot.tableRead===true&&snapshot.migrationsRead===true;
}
