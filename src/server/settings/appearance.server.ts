import "server-only";
import {cache} from "react";
import {Client} from "pg";
import {installedDatabaseUri} from "@/server/auth/database";
import {DEFAULT_APPEARANCE,safeAppearance,type Appearance} from "@/lib/appearance";

/** Les préférences sont globales et publiques à l'affichage, mais seule l'API admin peut les modifier. */
export const requestAppearance=cache(async():Promise<Appearance>=>{
  let uri:string;
  try{uri=await installedDatabaseUri();}catch{return DEFAULT_APPEARANCE;}
  const db=new Client({connectionString:uri,connectionTimeoutMillis:1200,
    query_timeout:1200,statement_timeout:1200,application_name:"smn-appearance-read"});
  try{
    await db.connect();
    const table=await db.query<{present:string|null}>("SELECT to_regclass('public.smn_general_settings')::text AS present");
    if(!table.rows[0]?.present)return DEFAULT_APPEARANCE;
    const column=await db.query<{present:boolean}>(`SELECT EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='smn_general_settings' AND column_name='palette'
    ) AS present`);
    // Une ancienne base v5 peut déjà porter son thème : conserver ce choix pendant la migration.
    const response=await db.query<{theme:string;palette?:string}>(column.rows[0]?.present?
      `SELECT s.theme,s.palette FROM public.smn_general_settings s
       JOIN public.smn_installation i ON i.id=s.installation_id
       WHERE s.installation_id='singleton' AND i.state='initialized' LIMIT 1`:
      `SELECT s.theme FROM public.smn_general_settings s
       JOIN public.smn_installation i ON i.id=s.installation_id
       WHERE s.installation_id='singleton' AND i.state='initialized' LIMIT 1`);
    const row=response.rows[0];
    return row?safeAppearance(row.theme,row.palette):DEFAULT_APPEARANCE;
  }catch{return DEFAULT_APPEARANCE;}
  finally{await db.end().catch(()=>undefined);}
});
