import "server-only";
import {cache} from "react";
import {Client} from "pg";
import {installedDatabaseUri} from "@/server/auth/database";
import {parseTheme,type Theme} from "@/lib/theme";

/** Préférence de thème de l'installation, sans migration ni écriture. */
export const requestTheme=cache(async():Promise<Theme>=>{
  let uri:string;
  try{uri=await installedDatabaseUri();}catch{return "light";}
  const client=new Client({connectionString:uri,connectionTimeoutMillis:1200,
    query_timeout:1200,statement_timeout:1200,application_name:"smn-theme-read"});
  try{
    await client.connect();
    const rows=await client.query<{theme:string}>(`SELECT s.theme FROM public.smn_general_settings s
      JOIN public.smn_installation i ON i.id=s.installation_id
      WHERE s.installation_id='singleton' AND i.state='initialized' LIMIT 1`);
    return parseTheme(rows.rows.length===1?rows.rows[0].theme:null);
  }catch{return "light";}
  finally{await client.end().catch(()=>undefined);}
});
