import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidDate} from "./assignment";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

export type AbsenceSlot="morning"|"afternoon";
export type AbsenceCategory={id:string;name:string;color:string;isActive:boolean};
export type AbsenceInput={
 action:"create"|"update";id:string|null;revision:number;categoryId:string;
 startOn:string;endOn:string;startSlot:AbsenceSlot;endSlot:AbsenceSlot;
 isPlanned:boolean;reason:string;
};
export type AbsenceDeleteInput={action:"delete";id:string;revision:number};
export type AbsenceChange=AbsenceInput|AbsenceDeleteInput;
export type AbsenceItem={
 id:string;memberId:string;revision:number;categoryId:string;categoryName:string;categoryColor:string;
 startOn:string;endOn:string;startSlot:AbsenceSlot;endSlot:AbsenceSlot;
 isPlanned:boolean;reason:string;createdAt:string;updatedAt:string;deleted:boolean;
};
export type AbsenceState={memberId:string;archived:boolean;categories:AbsenceCategory[];
 absences:AbsenceItem[];selectedDate:string|null;onDate:AbsenceItem[]};
export type AbsenceError="invalid-input"|"reason-required"|"category-required"|
 "invalid-period"|"not-found"|"archived"|"conflict"|"category-inactive"|"overlap"|"team-unavailable";
export type AbsenceResult={ok:true;id:string;revision:number;created:boolean;deleted?:boolean}|
 {ok:false;error:AbsenceError};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const CATEGORY=/^[a-z][a-z0-9_-]{0,39}$/u;
const SLOT=["morning","afternoon"] as const;
const validDate=(v:unknown):v is string=>isValidDate(v)&&
 Number(v.slice(0,4))>=1900&&Number(v.slice(0,4))<=2200;
const validText=(v:string)=>!/[\u0000-\u001f\u007f]/u.test(v);
export function parseAbsenceChange(raw:unknown):{ok:true;value:AbsenceChange}|{ok:false;error:AbsenceError}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(v.action==="delete"){
  if(Object.keys(v).length!==3||!Object.hasOwn(v,"id")||!Object.hasOwn(v,"revision")||
   typeof v.id!=="string"||!UUID.test(v.id)||
   typeof v.revision!=="number"||!Number.isSafeInteger(v.revision)||v.revision<1)
   return {ok:false,error:"invalid-input"};
  return {ok:true,value:{action:"delete",id:v.id,revision:v.revision}};
 }
 if(v.action==="create"||v.action==="update"){
  if(v.categoryId===undefined||v.categoryId===null||v.categoryId==="")
   return {ok:false,error:"category-required"};
  if(v.reason===undefined||v.reason===null||v.reason==="")
   return {ok:false,error:"reason-required"};
 }
 const allowed=v.action==="create"?["action","revision","categoryId","startOn","endOn",
  "startSlot","endSlot","isPlanned","reason"]:
  ["action","id","revision","categoryId","startOn","endOn","startSlot","endSlot","isPlanned","reason"];
 if((v.action!=="create"&&v.action!=="update")||
  Object.keys(v).length!==allowed.length||
  Object.keys(v).some(k=>!allowed.includes(k))||
  !Number.isSafeInteger(v.revision)||typeof v.revision!=="number"||
  (v.action==="create"?v.revision!==0:v.revision<1||typeof v.id!=="string"||!UUID.test(v.id))||
  typeof v.isPlanned!=="boolean")return {ok:false,error:"invalid-input"};
 if(typeof v.categoryId!=="string"||!CATEGORY.test(v.categoryId))
  return {ok:false,error:"category-required"};
 if(typeof v.reason!=="string"||!v.reason.trim())
  return {ok:false,error:"reason-required"};
 const reason=v.reason.trim().replace(/\s+/gu," ");
 if(reason.length>200||!validText(v.reason))return {ok:false,error:"invalid-input"};
 if(!validDate(v.startOn)||!validDate(v.endOn)||
  !SLOT.includes(v.startSlot as AbsenceSlot)||!SLOT.includes(v.endSlot as AbsenceSlot)||
  v.startOn>v.endOn||
  (v.startOn===v.endOn&&v.startSlot==="afternoon"&&v.endSlot==="morning"))
  return {ok:false,error:"invalid-period"};
 return {ok:true,value:{action:v.action,id:v.action==="update"?v.id as string:null,
  revision:v.revision as number,categoryId:v.categoryId,startOn:v.startOn,endOn:v.endOn,
  startSlot:v.startSlot as AbsenceSlot,endSlot:v.endSlot as AbsenceSlot,
  isPlanned:v.isPlanned,reason}};
}
type CategoryRow={id:string;name:string;color:string;is_active:boolean};
type AbsenceRow={id:string;member_id:string;category_id:string;category_name:string;category_color:string;
 revision:number;start_on:string;end_on:string;start_slot:AbsenceSlot;end_slot:AbsenceSlot;
 is_planned:boolean;reason:string;created_at:string;updated_at:string;deleted?:boolean};
const categoriesSql=`SELECT id,name,color,is_active FROM public.smn_absence_category ORDER BY name,id`;
const absencesSql=`SELECT a.id,a.member_id,a.category_id,c.name AS category_name,
 c.color AS category_color,a.revision,a.start_on::text AS start_on,a.end_on::text AS end_on,
 a.start_slot,a.end_slot,a.is_planned,a.reason,a.created_at::text AS created_at,
 a.updated_at::text AS updated_at,
 EXISTS(SELECT 1 FROM public.smn_member_absence_history h WHERE h.absence_id=a.id
  AND h.revision=a.revision AND h.after_values->>'deleted'='true') AS deleted
 FROM public.smn_member_absence a
 JOIN public.smn_absence_category c ON c.id=a.category_id
 WHERE a.member_id=$1 ORDER BY a.start_on DESC,a.id LIMIT 501`;
const project=(row:AbsenceRow):AbsenceItem=>({
 id:row.id,memberId:row.member_id,revision:row.revision,
 categoryId:row.category_id,categoryName:row.category_name,categoryColor:row.category_color,
 startOn:row.start_on,endOn:row.end_on,startSlot:row.start_slot,endSlot:row.end_slot,
 isPlanned:row.is_planned,reason:row.reason,createdAt:row.created_at,updatedAt:row.updated_at,
 deleted:row.deleted===true
});
async function findMember(db:Client,id:string,lock:boolean){
 const r=await db.query<{id:string;archived_at:string|null}>(`SELECT m.id,
  m.archived_at::text AS archived_at FROM public.smn_member m
  JOIN public.smn_installation i ON i.id=m.installation_id
  WHERE m.id=$1 AND m.installation_id='singleton' AND i.state='initialized'
   AND i.mode IN ('scrum','kanban')`+(lock?" FOR UPDATE OF m":""),[id]);
 return r.rows.length===1?r.rows[0]:null;
}
/** Reusable for any assignment: slots belong to the person, not to a team. */
export function absenceOnDate(item:Pick<AbsenceItem,"startOn"|"endOn"|"startSlot"|"endSlot">,
 day:string):{morning:boolean;afternoon:boolean}{
 if(!validDate(day)||day<item.startOn||day>item.endOn)return {morning:false,afternoon:false};
 return {morning:day>item.startOn||item.startSlot==="morning",
  afternoon:day<item.endOn||item.endSlot==="afternoon"};
}
export function overlapsAbsence(
 a:Pick<AbsenceItem,"startOn"|"endOn"|"startSlot"|"endSlot">,
 b:Pick<AbsenceItem,"startOn"|"endOn"|"startSlot"|"endSlot">):boolean{
 const start=a.startOn>b.startOn?a.startOn:b.startOn;
 const end=a.endOn<b.endOn?a.endOn:b.endOn;
 if(start>end)return false;
 if(start<end)return true;
 const x=absenceOnDate(a,start),y=absenceOnDate(b,start);
 return x.morning&&y.morning||x.afternoon&&y.afternoon;
}
export async function readMemberAbsences(db:Client,memberId:string,onDate?:string):Promise<AbsenceState>{
 if(!UUID.test(memberId)||(onDate!==undefined&&!validDate(onDate)))
  throw new Error("member-absence-invalid-input");
 const member=await findMember(db,memberId,false);
 if(!member)throw new Error("member-not-found");
 const [cats,raw]=await Promise.all([
  db.query<CategoryRow>(categoriesSql),
  db.query<AbsenceRow>(absencesSql,[memberId])]);
 if(raw.rows.length>500)throw new Error("member-absence-history-limit");
 const absences=raw.rows.map(project);
 return {memberId,archived:member.archived_at!==null,
  categories:cats.rows.map(row=>({id:row.id,name:row.name,color:row.color,isActive:row.is_active})),
  absences,selectedDate:onDate??null,
  onDate:onDate?absences.filter(a=>{if(a.deleted)return false;
   const x=absenceOnDate(a,onDate);return x.morning||x.afternoon;}):[]};
}
type Snapshot=Pick<AbsenceInput,"categoryId"|"startOn"|"endOn"|"startSlot"|"endSlot"|"isPlanned"|"reason">;
const snapshot=(v:Snapshot)=>({
 categoryId:v.categoryId,startOn:v.startOn,endOn:v.endOn,startSlot:v.startSlot,
 endSlot:v.endSlot,isPlanned:v.isPlanned,reason:v.reason
});
/** En v28, la portée d'équipe est explicitement résolue puis vérifiée
 * à l'intérieur de la transaction, sous verrou membre et affectations.
 * Sans scope, cet ancien service reste réservé aux routes v27 gardées.
 */
export async function saveMemberAbsence(db:Client,memberId:string,actorId:string,
 raw:unknown,scope?:Readonly<{actor:TeamActor;teamId:string}>):Promise<AbsenceResult>{
 const parsed=parseAbsenceChange(raw);
 if(!UUID.test(memberId)||!actorId)return {ok:false,error:"invalid-input"};
 if(!parsed.ok)return parsed;
 const input=parsed.value;
 await db.query("BEGIN");
 try{
  const fail=async(error:AbsenceError):Promise<AbsenceResult>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  // L'autorisation Admin doit être validée dans la même transaction que l'audit.
  const authorized=scope?await resolveAdminTeam(db,scope.actor,scope.teamId):null;
  if(scope&&(!authorized||scope.actor.accountId!==actorId))
   return fail("team-unavailable");
  const m=await findMember(db,memberId,true);
  if(!m)return fail("not-found");
  if(m.archived_at!==null)return fail("archived");

  /** Les absences sont globales à la personne : la moindre journée affectée
   * simultanément ou exclusivement à une autre équipe interdit la mutation.
   * FOR SHARE interdit qu'une affectation existante change pendant l'opération.
   * Le verrou du membre sérialise aussi les futures créations d'affectation.
   */
  const ownsEntirePeriod=async(startOn:string,endOn:string):Promise<boolean>=>{
   if(!authorized)return true;
   const assignments=await db.query<{team_id:string;start_on:string;end_on:string|null}>(`
    SELECT a.team_id,a.start_on::text AS start_on,a.end_on::text AS end_on
    FROM public.smn_member_assignment a
    JOIN public.smn_team t ON t.id=a.team_id
    JOIN public.smn_member m ON m.id=a.member_id
    WHERE a.member_id=$1 AND m.installation_id=t.installation_id
      AND t.installation_id='singleton'
      AND a.start_on<=$3::date
      AND (a.end_on IS NULL OR a.end_on>=$2::date)
    FOR SHARE OF a`,[memberId,startOn,endOn]);
   const rows=assignments.rows;
   return rows.some(a=>a.team_id===authorized.team_id&&a.start_on<=startOn&&
      (a.end_on===null||a.end_on>=endOn))&&
      rows.every(a=>a.team_id===authorized.team_id);
  };
  if(input.action==="delete"){
   const previous=await db.query<AbsenceRow>(`
    SELECT a.id,a.member_id,a.category_id,c.name AS category_name,c.color AS category_color,
     a.revision,a.start_on::text AS start_on,a.end_on::text AS end_on,
     a.start_slot,a.end_slot,a.is_planned,a.reason,
     a.created_at::text AS created_at,a.updated_at::text AS updated_at,
     EXISTS(SELECT 1 FROM public.smn_member_absence_history h
       WHERE h.absence_id=a.id AND h.revision=a.revision
       AND h.after_values->>'deleted'='true') AS deleted
    FROM public.smn_member_absence a JOIN public.smn_absence_category c ON c.id=a.category_id
    WHERE a.id=$1 AND a.member_id=$2 FOR UPDATE OF a`,[input.id,memberId]);
   const old=previous.rows[0];
   if(!old)return fail("not-found");
   if(old.revision!==input.revision)return fail("conflict");
   if(old.deleted)return fail("not-found");
   if(!await ownsEntirePeriod(old.start_on,old.end_on))
    return fail("team-unavailable");
   const before=snapshot({categoryId:old.category_id,startOn:old.start_on,endOn:old.end_on,
    startSlot:old.start_slot,endSlot:old.end_slot,isPlanned:old.is_planned,reason:old.reason});
   // A tombstone in the existing append-only audit avoids destructive DELETE and
   // preserves FK history without introducing an unapproved schema migration.
   const changed=await db.query(`UPDATE public.smn_member_absence
    SET revision=revision+1,updated_by=$3,updated_at=now()
    WHERE id=$1 AND member_id=$2 AND revision=$4`,
    [input.id,memberId,actorId,input.revision]);
   if(changed.rowCount!==1)return fail("conflict");
   await db.query(`INSERT INTO public.smn_member_absence_history
    (id,absence_id,revision,operation,before_values,after_values,changed_by)
    VALUES($1,$2,$3,'update',$4::jsonb,$5::jsonb,$6)`,
    [randomUUID(),input.id,input.revision+1,JSON.stringify(before),
     JSON.stringify({...before,deleted:true}),actorId]);
   await db.query("COMMIT");
   return {ok:true,id:input.id,revision:input.revision+1,created:false,deleted:true};
  }
  const category=await db.query<CategoryRow>(
   "SELECT id,name,color,is_active FROM public.smn_absence_category WHERE id=$1 FOR SHARE",
   [input.categoryId]);
  if(category.rows.length!==1)return fail("category-required");
  const previous=input.action==="update"?await db.query<AbsenceRow>(`
    SELECT a.id,a.member_id,a.category_id,c.name AS category_name,c.color AS category_color,
    a.revision,a.start_on::text AS start_on,a.end_on::text AS end_on,
    a.start_slot,a.end_slot,a.is_planned,a.reason,
    a.created_at::text AS created_at,a.updated_at::text AS updated_at,
    EXISTS(SELECT 1 FROM public.smn_member_absence_history h
      WHERE h.absence_id=a.id AND h.revision=a.revision
      AND h.after_values->>'deleted'='true') AS deleted
    FROM public.smn_member_absence a JOIN public.smn_absence_category c ON c.id=a.category_id
    WHERE a.id=$1 AND a.member_id=$2 FOR UPDATE OF a`,[input.id,memberId]):null;
  if(previous&&previous.rows.length!==1)return fail("not-found");
  const old=previous?.rows[0]??null;
  if(old&&old.revision!==input.revision)return fail("conflict");
  if(old?.deleted)return fail("not-found");
  // Une édition qui déplace des dates est refusée si l'ancien OU le nouveau
  // périmètre touche une autre équipe (ou ne relève pas de l'équipe cible).
  if((old&&!await ownsEntirePeriod(old.start_on,old.end_on))||
     !await ownsEntirePeriod(input.startOn,input.endOn))
    return fail("team-unavailable");
  if(!category.rows[0].is_active&&(!old||old.category_id!==input.categoryId))
   return fail("category-inactive");
  const other=await db.query<{id:string;start_on:string;end_on:string;
   start_slot:AbsenceSlot;end_slot:AbsenceSlot}>(`
   SELECT id,start_on::text AS start_on,end_on::text AS end_on,start_slot,end_slot
   FROM public.smn_member_absence a WHERE a.member_id=$1 AND ($2::text IS NULL OR a.id<>$2)
   AND a.start_on<=$3::date AND a.end_on>=$4::date
   AND NOT EXISTS(SELECT 1 FROM public.smn_member_absence_history h
    WHERE h.absence_id=a.id AND h.revision=a.revision
    AND h.after_values->>'deleted'='true')`,
   [memberId,input.id,input.endOn,input.startOn]);
  if(other.rows.some(row=>overlapsAbsence({
   startOn:row.start_on,endOn:row.end_on,startSlot:row.start_slot,endSlot:row.end_slot},input)))
   return fail("overlap");
  const id=input.id??randomUUID(),revision=input.revision+1;
  if(input.action==="create"){
   await db.query(`INSERT INTO public.smn_member_absence
    (id,member_id,category_id,start_on,end_on,start_slot,end_slot,
    is_planned,reason,revision,created_by,updated_by)
    VALUES($1,$2,$3,$4::date,$5::date,$6,$7,$8,$9,1,$10,$10)`,
    [id,memberId,input.categoryId,input.startOn,input.endOn,input.startSlot,
     input.endSlot,input.isPlanned,input.reason,actorId]);
  }else{
   const changed=await db.query(`UPDATE public.smn_member_absence SET
    category_id=$3,start_on=$4::date,end_on=$5::date,start_slot=$6,end_slot=$7,
    is_planned=$8,reason=$9,revision=revision+1,updated_by=$10,updated_at=now()
    WHERE id=$1 AND member_id=$2 AND revision=$11`,
    [id,memberId,input.categoryId,input.startOn,input.endOn,input.startSlot,
     input.endSlot,input.isPlanned,input.reason,actorId,input.revision]);
   if(changed.rowCount!==1)return fail("conflict");
  }
  const before=old?snapshot({
   categoryId:old.category_id,startOn:old.start_on,endOn:old.end_on,
   startSlot:old.start_slot,endSlot:old.end_slot,isPlanned:old.is_planned,reason:old.reason}):null;
  await db.query(`INSERT INTO public.smn_member_absence_history
   (id,absence_id,revision,operation,before_values,after_values,changed_by)
   VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)`,
   [randomUUID(),id,revision,input.action,before?JSON.stringify(before):null,
    JSON.stringify(snapshot(input)),actorId]);
  await db.query("COMMIT");
  return {ok:true,id,revision,created:input.action==="create"};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
