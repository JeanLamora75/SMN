import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {previewWizard,WizardPreviewFailure} from "@/server/sprints/wizard";

export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {teamId,...payload}=input;
 if(teamId!==undefined&&typeof teamId!=="string")return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>previewWizard(db,actor.id,payload,typeof teamId==="string"?teamId:null));
  return jsonResult(result,result.ok?200:400);
 }catch(error){
  const failure=error instanceof WizardPreviewFailure?error:null;
  const root=failure?.originalCause??error;
  const sqlState=failure?.sqlState??null;
  const stage=failure?.stage??"unknown";
  // Journal serveur seulement : pas de SQL, de jeton ni de paramètres de la requête.
  console.error("sprint-wizard-preview-failed",{
   stage,sqlState,message:root instanceof Error?root.message:"unexpected-error"
  });
  return jsonResult({
   error:sqlState==="42P01"||sqlState==="42703"?"schema-unavailable":
    sqlState==="57014"?"preview-timeout":"preview-unavailable",
   stage,diagnosticCode:sqlState??"SERVER"
  },503);
 }
}
