import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const teamIdPattern=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
type Params={params:Promise<{id:string}>};

/** Automatic highlights are independent facts. Their source registry item / goal is never changed. */
async function change(req:NextRequest,{params}:Params,operation:"edit"|"delete"){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const body=await readJsonObject(req);
 if(!uuid.test(id)||!body||typeof body.teamId!=="string"||
  !teamIdPattern.test(body.teamId)||typeof body.expectedTitle!=="string"||
  !body.expectedTitle.trim()||
  (operation==="edit"&&(typeof body.title!=="string"||!body.title.trim()||
    body.title.trim().length>240))||
  Object.keys(body).some(key=>!["teamId","expectedTitle",...(operation==="edit"?["title"]:[])].includes(key)))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   await db.query("BEGIN");
   try{
    const found=await db.query<{title:string}>(`
     SELECT h.title FROM public.smn_automatic_highlight h
     WHERE h.id=$1 AND (
       (h.source_kind='registry' AND EXISTS(
        SELECT 1 FROM public.smn_registry_item r
        JOIN public.smn_team t ON t.id=r.team_id
        JOIN public.smn_installation i ON i.id=t.installation_id
        WHERE r.id=h.source_id AND r.team_id=$2 AND i.id='singleton'
          AND i.state='initialized'
          AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false))
       OR (h.source_kind='goal' AND EXISTS(
        SELECT 1 FROM public.smn_sprint_goal g
        JOIN public.smn_sprint s ON s.id=g.sprint_id
        JOIN public.smn_team t ON t.id=s.team_id
        JOIN public.smn_installation i ON i.id=t.installation_id
        WHERE g.id=h.source_id AND s.team_id=$2 AND i.id='singleton'
          AND i.state='initialized' AND s.deleted_at IS NULL
          AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false))
     ) FOR UPDATE OF h`,[id,body.teamId]);
    if(found.rows.length!==1){await db.query("ROLLBACK");return {ok:false,error:"not-found"};}
    if(found.rows[0].title!==body.expectedTitle){
     await db.query("ROLLBACK");return {ok:false,error:"conflict"};
    }
    if(operation==="edit"){
     await db.query("UPDATE public.smn_automatic_highlight SET title=$2 WHERE id=$1",
      [id,(body.title as string).trim()]);
    }else{
     // The fact-selection tables are polymorphic and do not have foreign keys.
     // Purge only the deleted automatic fact, never its source record.
     await db.query("DELETE FROM public.smn_fact_selection_audit WHERE origin='automatic' AND fact_id=$1",[id]);
     await db.query("DELETE FROM public.smn_fact_selection WHERE origin='automatic' AND fact_id=$1",[id]);
     await db.query("DELETE FROM public.smn_automatic_highlight WHERE id=$1",[id]);
    }
    await db.query("COMMIT");return {ok:true};
   }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
  });
  return jsonResult(result,result.ok?200:result.error==="conflict"?409:404);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function PATCH(req:NextRequest,context:Params){return change(req,context,"edit");}
export async function DELETE(req:NextRequest,context:Params){return change(req,context,"delete");}
