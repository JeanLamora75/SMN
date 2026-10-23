import "server-only";
import {Client} from "pg";
import {installedDatabaseUri} from "@/server/auth/database";

/** Une transaction pour les sources du dashboard : ni DDL ni états intermédiaires. */
export async function withDashboardRead<T>(fn:(db:Client)=>Promise<T>):Promise<T>{
 const db=new Client({connectionString:await installedDatabaseUri(),
  connectionTimeoutMillis:3500,statement_timeout:15000,query_timeout:15000,
  application_name:"smn-dashboard-readonly"});
 let begun=false;
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  begun=true;
  const result=await fn(db);
  await db.query("COMMIT");
  begun=false;
  return result;
 }catch(error){
  if(begun)await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }finally{await db.end().catch(()=>undefined);}
}
