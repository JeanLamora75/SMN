import "server-only";
import {Client} from "pg";
import {installedDatabaseUri} from "@/server/auth/database";

/** Le lecteur de registre n'effectue ni migration, ni réconciliation à la consultation. */
export async function withSprintIndexDb<T>(read:(client:Client)=>Promise<T>):Promise<T>{
 const client=new Client({
  connectionString:await installedDatabaseUri(),
  connectionTimeoutMillis:3500,
  statement_timeout:5000,
  query_timeout:5000,
  application_name:"smn-sprint-index"
 });
 try{
  await client.connect();
  await client.query("BEGIN READ ONLY");
  try{
   const result=await read(client);
   await client.query("COMMIT");
   return result;
  }catch(error){
   await client.query("ROLLBACK").catch(()=>undefined);
   throw error;
  }
 }finally{
  await client.end().catch(()=>undefined);
 }
}
