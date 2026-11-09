import type {Client} from "pg";
import type {TableImpact} from "./erasure-impact-graph";
import type {ImpactCategory} from "./exceptional-erasure-policy";

type ForeignKey=Readonly<{
 child_table:string;parent_table:string;
 child_columns:readonly string[];parent_columns:readonly string[];
}>;
const TABLE=/^smn_[a-z][a-z0-9_]*$/;
const COLUMN=/^[a-z_][a-z0-9_]*$/;
const quote=(s:string)=>'"'+s+'"';
const MAX_EDGES=250,MAX_PATHS=100,MAX_DEPTH=3,MAX_COLUMNS=8;
const category=(name:string):ImpactCategory=>
 /absence|calendar/.test(name)?"calendars":
 /history|audit|revision|version|event|snapshot/.test(name)?"history":"associations";
const unknown=(table:string):TableImpact=>({
 table,scope:"indirect",count:null,state:"unknown",category:category(table)
});
/**
 * Enumerate incoming foreign keys, including composite constraints. Never
 * walk outward from a member into shared team/account records.
 */
export async function inspectMemberForeignKeys(db:Client,memberId:string):Promise<TableImpact[]>{
 const response=await db.query<ForeignKey>(
  "SELECT child.relname AS child_table,parent.relname AS parent_table,"+
  " array_agg(ca.attname::text ORDER BY k.ordinality) AS child_columns,"+
  " array_agg(pa.attname::text ORDER BY k.ordinality) AS parent_columns"+
  " FROM pg_catalog.pg_constraint c"+
  " JOIN pg_catalog.pg_class child ON child.oid=c.conrelid"+
  " JOIN pg_catalog.pg_namespace nc ON nc.oid=child.relnamespace"+
  " JOIN pg_catalog.pg_class parent ON parent.oid=c.confrelid"+
  " JOIN pg_catalog.pg_namespace np ON np.oid=parent.relnamespace"+
  " JOIN LATERAL unnest(c.conkey,c.confkey) WITH ORDINALITY"+
  " AS k(child_attnum,parent_attnum,ordinality) ON true"+
  " JOIN pg_catalog.pg_attribute ca ON ca.attrelid=c.conrelid"+
  " AND ca.attnum=k.child_attnum"+
  " JOIN pg_catalog.pg_attribute pa ON pa.attrelid=c.confrelid"+
  " AND pa.attnum=k.parent_attnum"+
  " WHERE c.contype='f' AND nc.nspname='public' AND np.nspname='public'"+
  " AND child.relname LIKE 'smn_%' AND parent.relname LIKE 'smn_%'"+
  " GROUP BY c.oid,child.relname,parent.relname"+
  " ORDER BY child.relname,parent.relname,c.oid LIMIT $1",
  [MAX_EDGES+1]);
 if(response.rows.length>MAX_EDGES)return [unknown("foreign-key-catalog-limit")];
 const valid=(edge:ForeignKey)=>
  TABLE.test(edge.child_table)&&TABLE.test(edge.parent_table)&&
  Array.isArray(edge.child_columns)&&
  edge.child_columns.length>0&&edge.child_columns.length<=MAX_COLUMNS&&
  edge.child_columns.length===edge.parent_columns?.length&&
  edge.child_columns.every(x=>COLUMN.test(x))&&
  edge.parent_columns.every(x=>COLUMN.test(x));
 const discovered=response.rows.filter(valid);
 const unresolved=response.rows.filter(edge=>!valid(edge)).map(edge=>unknown(
  TABLE.test(edge.child_table)?edge.child_table:"foreign-key-shape-invalid"));
 type Path=Readonly<{table:string;edges:readonly ForeignKey[];visited:readonly string[]}>;
 const pending:Path[]=[{table:"smn_member",edges:[],visited:["smn_member"]}];
 const result:TableImpact[]=[];
 let expanded=0;
 while(pending.length){
  const parent=pending.shift()!;
  const children=discovered.filter(edge=>edge.parent_table===parent.table);
  if(parent.edges.length>=MAX_DEPTH){
   if(children.some(e=>!parent.visited.includes(e.child_table)))
    unresolved.push(unknown("foreign-key-depth-limit"));
   continue;
  }
  for(const edge of children){
   if(parent.visited.includes(edge.child_table))continue;
   expanded++;
   if(expanded>MAX_PATHS)return [...result,...unresolved,unknown("foreign-key-path-limit")];
   const chain=[...parent.edges,edge];
   let sql='SELECT count(*)::text AS n FROM public."smn_member" t0 ';
   chain.forEach((link,i)=>{
    const pairs=link.child_columns.map((child,j)=>
     "t"+(i+1)+"."+quote(child)+"::text=t"+i+"."+quote(link.parent_columns[j])+"::text");
    sql+="JOIN public."+quote(link.child_table)+" t"+(i+1)+" ON "+pairs.join(" AND ")+" ";
   });
   sql+="WHERE t0.id::text=$1 AND t0.installation_id='singleton'";
   try{
    const count=await db.query<{n:string}>(sql,[memberId]);
    const n=Number(count.rows[0]?.n);
    if(!Number.isSafeInteger(n)||n<0)throw Error("invalid-fk-count");
    result.push({table:edge.child_table,scope:chain.length===1?"direct":"indirect",
     category:category(edge.child_table),count:n,state:"inspected"});
   }catch{result.push(unknown(edge.child_table));}
   pending.push({table:edge.child_table,edges:chain,
    visited:[...parent.visited,edge.child_table]});
  }
 }
 return [...result,...unresolved];
}
