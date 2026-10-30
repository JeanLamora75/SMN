import type {Migration} from "../src/server/installation/diagnostic";

/** Vérification des faits du journal, sans comparer à des SQL non canoniques. */
export function checkRecordedMigrationJournal(rows:readonly Migration[],expected:number|undefined):string[]{
 const errors:string[]=[];
 if(expected===undefined||rows.length!==expected)
  errors.push("Journal et version différents");
 const names=new Set<string>();
 for(const row of rows){
  if(names.has(row.migration_name))errors.push("Migration en double : "+row.migration_name);
  names.add(row.migration_name);
  if(!row.finished_at||row.rolled_back_at)errors.push("Migration non terminée : "+row.migration_name);
  if(!row.checksum||!/^[a-f0-9]{64}$/i.test(row.checksum))
   errors.push("Empreinte absente ou malformée : "+row.migration_name);
 }
 return errors;
}
