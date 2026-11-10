import "server-only";
import {installedDatabaseUri} from "@/server/auth/database";
import {probePostgres} from "@/server/db/probe";
import {classifySnapshot} from "@/server/installation/diagnostic";
import {evaluateDatabaseUpdatePolicy} from "../../../scripts/windows/schema-update-policy.mjs";

export type UpdateSchemaEvidence=Readonly<{
 postgresMajor:18; schemaVersion:33; migrationCount:number; checkedAt:string;
}>;

/** Read-only, fail-closed gate. No DDL or migration execution is permitted. */
export async function inspectUpdateSchema():Promise<UpdateSchemaEvidence>{
 const snapshot=await probePostgres(await installedDatabaseUri());
 const policy=evaluateDatabaseUpdatePolicy({
  diagnostic:classifySnapshot(snapshot).status,
  postgresMajor:Math.floor((snapshot.serverVersion??0)/10000),
  schemaVersion:snapshot.installations?.[0]?.schema_version,
  indicatorV33Valid:snapshot.indicatorV33SchemaValid===true,
  migrations:(snapshot.migrations??[]).map(row=>({
   name:row.migration_name,checksum:row.checksum,
   finished:!!row.finished_at,rolledBack:!!row.rolled_back_at
  }))
 },{nodeMajor:24,postgresMajor:18,schemaVersion:33});
 return {postgresMajor:18,schemaVersion:33,migrationCount:policy.migrationCount,checkedAt:new Date().toISOString()};
}
