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
  // jsonb normalizes object keys; the row hash is based on all column values.
  // The digest is order-independent, including tables lacking a primary key.
  const result=await db.query<{rows:string;sha256:string}>(`
   SELECT count(*)::text AS rows,
    md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' ORDER BY
     md5(to_jsonb(t)::text)),'')) AS sha256
   FROM public.${ident} t`);
  const row=result.rows[0],count=Number(row?.rows);
  if(!Number.isSafeInteger(count)||count<0||!row?.sha256)
   throw Error("fingerprint-row-count-invalid");
  tables.push({table:tablename,rows:count,sha256:row.sha256});
 }
 const digest=createHash("sha256")
  .update(tables.map(t=>t.table+"|"+t.rows+"|"+t.sha256).join("\n")).digest("hex");
 return {tables,digest};
}
