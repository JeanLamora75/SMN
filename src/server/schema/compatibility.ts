/** SMN-328 — Contrat central de compatibilité (aucune migration implicite). */
export const CURRENT_SCHEMA_VERSION=32 as const;
export const MIN_MULTI_TEAM_SCHEMA_VERSION=28 as const;
export type SchemaCapability="multi-team"|"per-team-agile-mode"|"company-catalog"|"links"|"country-consolidation";
const thresholds:Readonly<Record<SchemaCapability,number>>={
 "multi-team":28,
 "per-team-agile-mode":32,
 "company-catalog":31,
 "links":29,
 "country-consolidation":30
};
export type SchemaCompatibility=
 |Readonly<{ok:true;version:number;capability:SchemaCapability}>
 |Readonly<{ok:false;reason:"invalid-version"|"unsupported-version"|"capability-unavailable";version:number|null;capability:SchemaCapability}>;
/** Fail-closed for future unknown schema versions. Physical integrity remains checked separately. */
export function evaluateSchemaCapability(value:unknown,capability:SchemaCapability):SchemaCompatibility{
 const version=typeof value==="number"&&Number.isSafeInteger(value)?value:null;
 if(version===null||version<1)return {ok:false,reason:"invalid-version",version,capability};
 if(version>CURRENT_SCHEMA_VERSION)return {ok:false,reason:"unsupported-version",version,capability};
 if(version<thresholds[capability])return {ok:false,reason:"capability-unavailable",version,capability};
 return {ok:true,version,capability};
}
export function assertSchemaCapability(value:unknown,capability:SchemaCapability):number{
 const result=evaluateSchemaCapability(value,capability);
 if(!result.ok)throw new Error("smn-schema-"+result.reason);
 return result.version;
}
