import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import type {RegistryType} from "@/lib/registry-types";
import {validLevel,type Level} from "@/lib/risk-criticality";
import {parseRoam,type Roam} from "./roam";
import {parseParty,type Party} from "./dependency-parties";
import {ensureRiskAssessment} from "./assessment";
import {ensureRoamSchema} from "./roam";
import {ensureParties} from "./dependency-parties";
import {ensureDependencyFlag} from "./dependency-vigilance";
import {ensureDecisionDetail} from "./decision-detail";
import {riskCriticalEvent,recordConfirmedHighlight} from "./confirmed-highlights";

export type InitialDetails={
 probability?:Level|null;impact?:Level|null;roam?:Roam|null;
 requester?:Party;contributor?:Party;atRisk?:boolean;
 rationale?:string|null;replacesId?:string|null;
};
type Parsed={ok:true;value:InitialDetails}|{ok:false};
const allowed:Record<RegistryType,readonly string[]>={
 risk:["probability","impact","roam"],
 obstacle:[],dependency:["requester","contributor","atRisk"],
 decision:["rationale","replacesId"],action:[],highlight:[]
};

/** An omitted optional business field is not silently transformed into required data. */
export function parseInitialDetails(type:RegistryType,raw:unknown,teamId:string):Parsed{
 if(raw===undefined)return {ok:true,value:{}};
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false};
 const record=raw as Record<string,unknown>;
 if(Object.keys(record).some(k=>!allowed[type].includes(k)))return {ok:false};
 if(type==="risk"){
  const probability=record.probability,impact=record.impact,roam=record.roam;
  if(probability!==undefined&&probability!==null&&!validLevel(probability)||
   impact!==undefined&&impact!==null&&!validLevel(impact)||
   roam!==undefined&&roam!==null&&!parseRoam(roam))return {ok:false};
  return {ok:true,value:{
   ...(probability!==undefined?{probability:probability as Level|null}:{}),
   ...(impact!==undefined?{impact:impact as Level|null}:{}),
   ...(roam!==undefined?{roam:roam as Roam|null}:{})
  }};
 }
 if(type==="dependency"){
  const requester=record.requester,contributor=record.contributor;
  if((requester===undefined)!==(contributor===undefined)||
   (requester!==undefined&&(!parseParty(requester,teamId)||!parseParty(contributor,teamId)))||
   (record.atRisk!==undefined&&typeof record.atRisk!=="boolean"))return {ok:false};
  return {ok:true,value:{
   ...(requester!==undefined?{
    requester:parseParty(requester,teamId)!,contributor:parseParty(contributor,teamId)!
   }:{}),
   ...(record.atRisk!==undefined?{atRisk:record.atRisk as boolean}:{})
  }};
 }
 if(type==="decision"){
  if(record.rationale!==undefined&&record.rationale!==null&&
   (typeof record.rationale!=="string"||record.rationale.length>4000)||
   record.replacesId!==undefined&&record.replacesId!==null&&
   (typeof record.replacesId!=="string"||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.replacesId)))
   return {ok:false};
  return {ok:true,value:{
   ...(record.rationale!==undefined?{rationale:record.rationale as string|null}:{}),
   ...(record.replacesId!==undefined?{replacesId:record.replacesId as string|null}:{})
  }};
 }
 return {ok:true,value:{}};
}

/** Called INSIDE the surrounding create transaction; never starts its own. */
export async function writeInitialDetails(db:Client,actorId:string,id:string,
 type:RegistryType,value:InitialDetails,title:string):Promise<void>{
 if(type==="risk"){
  if(value.probability!==undefined||value.impact!==undefined){
   await ensureRiskAssessment(db);
   const data={probability:value.probability??null,impact:value.impact??null};
   await db.query(`INSERT INTO public.smn_risk_assessment(item_id,probability,impact,revision,updated_by)
    VALUES($1,$2,$3,1,$4)`,[id,data.probability,data.impact,actorId]);
   await db.query(`INSERT INTO public.smn_risk_assessment_audit
    (id,item_id,revision,old_values,new_values,actor_id)
    VALUES($1,$2,1,NULL,$3::jsonb,$4)`,[randomUUID(),id,JSON.stringify(data),actorId]);
  }
  if(value.roam!==undefined&&value.roam!==null){
   await ensureRoamSchema(db);
   await db.query(`INSERT INTO public.smn_risk_roam(item_id,classification,revision,updated_by)
    VALUES($1,$2,1,$3)`,[id,value.roam,actorId]);
   await db.query(`INSERT INTO public.smn_risk_roam_audit
    (id,item_id,revision,previous_classification,next_classification,actor_id)
    VALUES($1,$2,1,NULL,$3,$4)`,[randomUUID(),id,value.roam,actorId]);
  }
  if(value.probability!==undefined||value.impact!==undefined)
   await riskCriticalEvent(db,id,actorId,1);
 }else if(type==="dependency"){
  if(value.requester&&value.contributor){
   await ensureParties(db);
   const parties={requester:value.requester,contributor:value.contributor};
   await db.query(`INSERT INTO public.smn_dependency_parties
    (item_id,requester,contributor,revision,updated_by)
    VALUES($1,$2::jsonb,$3::jsonb,1,$4)`,
    [id,JSON.stringify(value.requester),JSON.stringify(value.contributor),actorId]);
   await db.query(`INSERT INTO public.smn_dependency_parties_audit
    (id,item_id,revision,before_values,after_values,actor_id)
    VALUES($1,$2,1,NULL,$3::jsonb,$4)`,
    [randomUUID(),id,JSON.stringify(parties),actorId]);
  }
  if(value.atRisk!==undefined){
   await ensureDependencyFlag(db);
   await db.query(`INSERT INTO public.smn_dependency_vigilance
    (item_id,at_risk,revision,updated_by) VALUES($1,$2,1,$3)`,
    [id,value.atRisk,actorId]);
   await db.query(`INSERT INTO public.smn_dependency_vigilance_audit
    (id,item_id,revision,before_values,after_values,actor_id)
    VALUES($1,$2,1,NULL,$3::jsonb,$4)`,
    [randomUUID(),id,JSON.stringify({atRisk:value.atRisk}),actorId]);
   if(value.atRisk)await recordConfirmedHighlight(db,{
    category:"atRiskDependency",sourceKind:"registry",sourceId:id,sourceRevision:1,
    title,actorId
   });
  }
 }else if(type==="decision"&&(value.rationale!==undefined||value.replacesId!==undefined)){
  await ensureDecisionDetail(db);
  await db.query(`INSERT INTO public.smn_decision_detail
   (item_id,rationale,replaces_id,revision,updated_by) VALUES($1,$2,$3,1,$4)`,
   [id,value.rationale??null,value.replacesId??null,actorId]);
  await db.query(`INSERT INTO public.smn_decision_detail_audit
   (id,item_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,1,NULL,$3::jsonb,$4)`,
   [randomUUID(),id,JSON.stringify({rationale:value.rationale??null,replacesId:value.replacesId??null}),actorId]);
 }
}
