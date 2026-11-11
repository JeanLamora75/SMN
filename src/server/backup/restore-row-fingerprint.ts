import {createHash} from "node:crypto";
import type {Client} from "pg";

/**
 * Compute deterministic hashes of public table row contents without exporting
 * raw personal information. Intended for read-only, isolated PG18 snapshots.
 * A matching hash requires independent restorations; it does not certify
 * absence of historical erasures or authorize a live cutover.
 */
const tableName=/^[a-z_][a-z0-9_]{0,62}$/;
export type TableFingerprint=Readonly<{table:string;rows:number;sha256:string}>;
export type FingerprintSet=Readonly<{tables:readonly TableFingerprint[];digest:string}>;
export function compareFingerprints(a:FingerprintSet,b:FingerprintSet){
 const left=new Map(a.tables.map(t=>[t.table,t]));
 const right=new Map(b.tables.map(t=>[t.table,t]));
 const names=[...new Set([...left.keys(),...right.keys()])].sort();
 const changed=names.filter(name=>{
  const x=left.get(name),y=right.get(name);
  return !x||!y||x.rows!==y.rows||x.sha256!==y.sha256;
 });
 return {equivalent:changed.length===0&&a.digest===b.digest,
  tableCountA:a.tables.length,tableCountB:b.tables.length,
  differences:changed};
}
export async function fingerprintPublicTables(db:Pick<Client,"query">):Promise<FingerprintSet>{
 const relations=await db.query<{tablename:string}>(`
  SELECT tablename FROM pg_catalog.pg_tables
  WHERE schemaname='public' ORDER BY tablename`);
 if(relations.rows.length===0||relations.rows.length>1000)
  throw Error("fingerprint-table-scope-invalid");
 const tables:TableFingerprint[]=[];
 for(const {tablename} of relations.rows){
  if(!tableName.test(tablename))throw Error("fingerprint-name-invalid");
  const ident='"'+tablename+'"';
  // Hash each normalized row inside PostgreSQL; never fetch raw values.
  // A stable order preserves duplicates and does not need primary keys.
  const result=await db.query<{row_hash:string}>(`
   SELECT encode(sha256(convert_to(to_jsonb(t)::text,'UTF8')),'hex') AS row_hash
   FROM public.${ident} t
   ORDER BY row_hash`);
  if(result.rows.length>200000)throw Error("fingerprint-table-too-large");
  const hashes=createHash("sha256");
  for(const row of result.rows){
   if(!/^[a-f0-9]{64}$/.test(row.row_hash))
    throw Error("fingerprint-row-hash-invalid");
   hashes.update(row.row_hash+"\\n");
  }
  tables.push({table:tablename,rows:result.rows.length,sha256:hashes.digest("hex")});
 }
 const digest=createHash("sha256")
  .update(tables.map(t=>t.table+"|"+t.rows+"|"+t.sha256).join("\n")).digest("hex");
 return {tables,digest};
}
