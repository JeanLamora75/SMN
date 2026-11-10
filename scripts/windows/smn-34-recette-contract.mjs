/**
 * SMN-34 — Offline recette evidence checklist, NEVER an activation token.
 * Only reads local operator-owned JSON; never emits evidence details, names,
 * paths, comments or secrets. All 14 REC controls require independent review.
 */
export const SCENARIOS=Object.freeze(Array.from({length:14},(_,i)=>
 "REC-"+String(i+1).padStart(2,"0")));
export function emptyRecette(){
 return {schemaVersion:1,scenarios:SCENARIOS.map(id=>({
  id,status:"BLOCKED",evidenceSha256:null,observedAt:null
 }))};
}
const SHA=/^[a-f0-9]{64}$/;
function validUtc(v){return typeof v==="string"&&Number.isFinite(Date.parse(v))&&
 new Date(v).toISOString()===v;}
export function inspectRecetteEvidence(value){
 const blocked=(reason)=>({
  schemaVersion:1,state:"review-required",canActivate:false,
  reason,passed:0,failed:0,blocked:14,unverifiable:14,
  scenarios:SCENARIOS.map(id=>({id,status:"BLOCKED"}))
 });
 if(!value||typeof value!=="object"||Array.isArray(value)||
  value.schemaVersion!==1||!Array.isArray(value.scenarios)||
  value.scenarios.length!==14)return blocked("schema-incomplete");
 const seen=new Set(),items=[];
 for(const raw of value.scenarios){
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||
   typeof raw.id!=="string"||!SCENARIOS.includes(raw.id)||seen.has(raw.id)||
   !["PASS","FAIL","BLOCKED"].includes(raw.status)||
   (raw.status==="PASS"&&(!SHA.test(raw.evidenceSha256)||!validUtc(raw.observedAt)))||
   (raw.status!=="PASS"&&(
    raw.evidenceSha256!==null||raw.observedAt!==null)))
   return blocked("evidence-invalid");
  seen.add(raw.id);
  items.push({id:raw.id,status:raw.status});
 }
 items.sort((a,b)=>a.id.localeCompare(b.id));
 if(items.some((x,i)=>x.id!==SCENARIOS[i]))
  return blocked("scenario-missing");
 const passed=items.filter(x=>x.status==="PASS").length;
 const failed=items.filter(x=>x.status==="FAIL").length;
 const count=items.filter(x=>x.status==="BLOCKED").length;
 return {schemaVersion:1,state:"review-required",canActivate:false,
  reason:"independent-human-review-required",
  passed,failed,blocked:count,unverifiable:failed+count,
  scenarios:items};
}
