import "server-only";
import {cache} from "react";
import {headers} from "next/headers";
import {Client} from "pg";
import {negotiateLanguage,type Language} from "@/lib/language";
import {installedDatabaseUri} from "@/server/auth/database";

/** Shared per-request locale; SELECT only, no schema setup or account mutation. */
export const requestLocale=cache(async ():Promise<Language>=>{
  const browser=negotiateLanguage((await headers()).get("accept-language"));
  let uri:string;
  try {uri=await installedDatabaseUri();}catch{return browser;}
  const db=new Client({connectionString:uri,connectionTimeoutMillis:1200,
    query_timeout:1200,statement_timeout:1200,application_name:"smn-i18n-read"});
  try {
    await db.connect();
    const exists=await db.query<{exists:string|null}>(
      "SELECT to_regclass('public.smn_general_settings')::text AS exists");
    if(!exists.rows[0]?.exists)return browser;
    const result=await db.query<{locale:string}>(`SELECT s.locale FROM public.smn_general_settings s
      JOIN public.smn_installation i ON i.id=s.installation_id
      WHERE s.installation_id='singleton' AND i.state='initialized' LIMIT 1`);
    const locale=result.rows[0]?.locale;
    return locale==="fr"||locale==="en"?locale:browser;
  }catch{return "fr";}finally{await db.end().catch(()=>undefined);}
});
