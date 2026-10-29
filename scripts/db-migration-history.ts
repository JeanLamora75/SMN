import {createHash} from "node:crypto";
export function verifyHistory(rows:readonly {migration_name:string;checksum?:string;finished_at:Date|null;rolled_back_at:Date|null}[],
 sources:ReadonlyMap<string,string>):string[]{
 const errors:string[]=[];
 const names=new Set<string>();
 for(const row of rows){
  if(names.has(row.migration_name))errors.push("Migration en double : "+row.migration_name);
  names.add(row.migration_name);
  if(!row.finished_at||row.rolled_back_at)errors.push("Migration non terminée : "+row.migration_name);
  const sql=sources.get(row.migration_name);
  if(sql===undefined)errors.push("SQL source introuvable : "+row.migration_name);
  else if(createHash("sha256").update(sql).digest("hex")!==row.checksum)
   errors.push("Checksum divergent : "+row.migration_name);
 }
 for(const name of sources.keys())if(!names.has(name))errors.push("Migration non appliquée : "+name);
 return errors;
}
