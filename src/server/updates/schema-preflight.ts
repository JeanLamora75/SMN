import "server-only";
import {installedDatabaseUri} from "@/server/auth/database";
import {probePostgres} from "@/server/db/probe";
import {classifySnapshot} from "@/server/installation/diagnostic";

export type UpdateSchemaEvidence=Readonly<{
 postgresMajor:18; schemaVersion:33; migrationCount:number; checkedAt:string;
}>;

/** Read-only, fail-closed gate for signed application updates.
 * Database upgrades require their own versioned, separately approved maintenance
 * workflow; a ZIP must never introduce implicit DDL.
 */
export async function inspectUpdateSchema():Promise<UpdateSchemaEvidence>{
 const snapshot=await probePostgres(await installedDatabaseUri());
 if(classifySnapshot(snapshot).status!=="initialized")
  throw Error("update-schema-diagnostic-failed");
 const installations=snapshot.installations??[];
 if(installations.length!==1||installations[0].id!=="singleton"||
    installations[0].state!=="initialized"||installations[0].schema_version!==33)
  throw Error("update-schema-version-incompatible");
 if(!Number.isSafeInteger(snapshot.serverVersion)||
    Math.floor(snapshot.serverVersion!/10000)!==18)
  throw Error("update-postgres-version-incompatible");
 const migrations=snapshot.migrations;
 if(!Array.isArray(migrations)||migrations.length===0)
  throw Error("update-migration-history-ambiguous");
 const names=new Set<string>();
 for(const row of migrations){
  if(!row.migration_name||names.has(row.migration_name)||!row.finished_at||
    row.rolled_back_at||!/^[0-9a-f]{64}$/.test(row.checksum??""))
   throw Error("update-migration-history-ambiguous");
  names.add(row.migration_name);
 }
 if(snapshot.indicatorV33SchemaValid!==true)
  throw Error("update-indicator-schema-invalid");
 return {postgresMajor:18,schemaVersion:33,migrationCount:migrations.length,
  checkedAt:new Date().toISOString()};
}
