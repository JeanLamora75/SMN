import {createHash} from "node:crypto";
import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import type {Snapshot} from "./diagnostic";

export const NATIVE_V32_NAME="smn_v32_native_baseline";
// Resolve at runtime: bundlers must not require this optional SQL file at build time.
export const NATIVE_V32_FILE=()=>resolve(process.cwd(),"prisma","baseline","v32","schema.sql");

export function nativeBaselineSql():string|null {
 const file=NATIVE_V32_FILE();
 if(!existsSync(file))return null;
 const sql=readFileSync(file,"utf8");
 // A dump from a historical installation is NOT automatically a native baseline.
 // It must contain the neutral installation contract and be reviewed separately.
 if(!sql.includes("smn_installation")||!sql.includes("smn_account")||
    !sql.includes("agile_mode")||!sql.includes("smn_team"))return null;
 if(/CREATE TABLE\s+"public"\."smn_installation"\s*\([^;]*"mode"\s+"text"/i.test(sql))return null;
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
