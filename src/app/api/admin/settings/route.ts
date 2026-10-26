import { NextRequest } from "next/server";
import { authorizeApi } from "@/server/auth/authorization";
import { jsonResult, readJsonObject } from "@/server/auth/request";
import { withAuthDb } from "@/server/auth/database";
import { readGeneralSettings, updateGeneralSettings } from "@/server/settings/manager";
import {ensureReferenceNationalCalendar} from "@/server/holidays/preload";
export const dynamic = "force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(request:NextRequest) {
  if(!await authorizeApi(request,"read",target)) return jsonResult({error:"forbidden"},403);
  try {
    return jsonResult({settings:await withAuthDb(readGeneralSettings)});
  }catch {
    console.error("smn-settings-read-unavailable");
    return jsonResult({error:"service-unavailable"},503);
  }
}
export async function PATCH(request:NextRequest) {
  const actor=await authorizeApi(request,"write",target);
  if(!actor) return jsonResult({error:"forbidden"},403);
  const body=await readJsonObject(request);
  if(!body) {console.warn("smn-settings-validation-rejected");return jsonResult({error:"invalid-input"},400);}
  try {
    const result=await withAuthDb(async client=>{
      const changed=await updateGeneralSettings(client,actor.id,body);
      if(changed.ok&&changed.changed){
        try{await ensureReferenceNationalCalendar(client);}
        catch{console.error("smn-national-calendar-preload-unavailable");}
      }
      return changed;
    });
    if(!result.ok) {
      if(result.error==="invalid-input") console.warn("smn-settings-validation-rejected");
      return jsonResult({error:result.error},result.error==="conflict"||result.error==="country-archived"?409:result.error==="invalid-input"?400:503);
    }
    return jsonResult({settings:result.settings,changed:result.changed});
  }catch {
    // No input, connection string, SQL error or personal data in server diagnostics.
    console.error("smn-settings-persistence-failed");
    return jsonResult({error:"service-unavailable"},503);
  }
}
