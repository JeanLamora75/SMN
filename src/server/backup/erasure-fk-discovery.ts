import "server-only";
import type {Client} from "pg";
import type {TableImpact} from "./erasure-impact-graph";
import type {ImpactCategory} from "./exceptional-erasure-policy";

type ForeignKey=Readonly<{
 child_table:string;parent_table:string;child_column:string;parent_column:string;
}>;
const IDENT=/^smn_[a-z][a-z0-9_]*$/;
const COL=/^[a-z_][a-z0-9_]*$/;
const quote=(s:string)=>'"'+s+'"';
const MAX_EDGES=250,MAX_PATHS=100,MAX_DEPTH=3;
const category=(name:string):ImpactCategory=>
 /absence|calendar/.test(name)?"calendars":
 /history|audit|revision|version|event|snapshot/.test(name)?"history":"associations";
/**
 * Traverses only *incoming* FK edges rooted at smn_member, never outward
 * into shared team/account objects. Resolves actual v33 constraints, including
 * additive tables created after the immutable baseline.
 */
export async function inspectMemberForeignKeys(db:Client,memberId:string):Promise<TableImpact[]>{
 const response=await db.query<ForeignKey>(`
  SELECT child.relname AS child_table,parent.relname AS parent_table,
   ca.attname AS child_column,pa.attname AS parent_column
  FROM pg_catalog.pg_constraint c
  JOIN pg_catalog.pg_class child ON child.oid=c.conrelid
  JOIN pg_catalog.pg_namespace nc ON nc.oid=child.relnamespace
  JOIN pg_catalog.pg_class parent ON parent.oid=c.confrelid
  JOIN pg_catalog.pg_namespace np ON np.oid=parent.relnamespace
  JOIN pg_catalog.pg_attribute ca ON ca.attrelid=c.conrelid
    AND ca.attnum=c.conkey[1]
  JOIN pg_catalog.pg_attribute pa ON pa.attrelid=c.confrelid
    AND pa.attnum=c.confkey[1]
  WHERE c.contype='f' AND nc.nspname='public' AND np.nspname='public'
    AND array_length(c.conkey,1)=1 AND array_length(c.confkey,1)=1
    AND child.relname LIKE 'smn_%' AND parent.relname LIKE 'smn_%'
  ORDER BY child.relname,parent.relname,ca.attname
  LIMIT $1`,[MAX_EDGES+1]);
 if(response.rows.length>MAX_EDGES||response.rows.some(r=>
  !IDENT.test(r.child_table)||!IDENT.test(r.parent_table)||
  !COL.test(r.child_column)||!COL.test(r.parent_column)))
  return [{table:"foreign-key-catalog",count:null,state:"unknown",
   category:"associations",scope:"indirect"}];
 type Path=Readonly<{node:string;edges:readonly ForeignKey[];visited:readonly string[]}>;
 const pending:Path[]=[{node:"smn_member",edges:[],visited:["smn_member"]}];
 const results:TableImpact[]=[];
 let expanded=0;
 while(pending.length){
  const parent=pending.shift()!;
  if(parent.edges.length>=MAX_DEPTH)continue;
  const children=response.rows.filter(edge=>edge.parent_table===parent.node);
  for(const edge of children){
   if(parent.visited.includes(edge.child_table))continue;
   expanded++;
   if(expanded>MAX_PATHS)return [...results,{table:"foreign-key-path-limit",count:null,
    state:"unknown",category:"associations",scope:"indirect"}];
   const chain=[...parent.edges,edge];
   let query='SELECT count(*)::text AS n FROM public."smn_member" t0 ';
   chain.forEach((link,i)=>{
    query+=`JOIN public.${quote(link.child_table)} t${i+1}
      ON t${i+1}.${quote(link.child_column)}::text
      =t${i}.${quote(link.parent_column)}::text `;
   });
   query+='WHERE t0.id::text=$1 AND t0.installation_id=\'singleton\'';
   try{
    const value=await db.query<{n:string}>(query,[memberId]);
    const number=Number(value.rows[0]?.n);
    if(!Number.isSafeInteger(number)||number<0)throw new Error("count-invalid");
    results.push({table:edge.child_table,scope:chain.length===1?"direct":"indirect",
     category:category(edge.child_table),count:number,state:"inspected"});
   }catch{
    results.push({table:edge.child_table,scope:"indirect",
     category:category(edge.child_table),count:null,state:"unknown"});
   }
   pending.push({node:edge.child_table,edges:chain,
    visited:[...parent.visited,edge.child_table]});
  }
 }
 return results;
}
