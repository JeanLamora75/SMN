import type {Client} from "pg";
const expected=new Set(["smn_historical_csv_attempt","smn_historical_csv_batch","smn_historical_csv_change"]);
/** Lecture seule : le chemin d'import ne modifie jamais le schéma. */
export async function assertHistoricalCsvTable(db:Client,table:string){
 if(!expected.has(table))throw Error("historical-csv-schema-invalid");
 const result=await db.query<{ready:boolean}>("SELECT to_regclass($1) IS NOT NULL AS ready",["public."+table]);
 if(!result.rows[0]?.ready)throw Error("historical-csv-schema-missing: "+table+"; run pnpm exec tsx scripts/apply-historical-csv-schema-v32.ts --apply");
}
