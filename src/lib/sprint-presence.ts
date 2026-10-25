/** D5 — Presence is scheduled availability, NOT development capacity.
 * One available calendar half-day = 0.5 J/H; never multiply by developer,
 * contribution or allocation percentages. No claim of physical attendance. */
export type AgileRole="scrumMaster"|"productOwner"|"developer";
export type PresenceMissingSource="no-assignments"|"ambiguous-assignment"|
 "assignment-version"|"work-calendar"|
 "exceptional-meeting-participants"|"exceptional-meeting-work-slots";
export type PresenceMember=Readonly<{
 memberId:string;displayName:string;presenceJh:number|null;
 /** Diagnostic for live estimates only; no individual details in collective views. */
 missingSources?:readonly PresenceMissingSource[];
 developmentJh:number|null;daysCount:number;unknownDays:number;
 /** Optional for closure snapshots created before the UX enhancement. */
 professionalFunction?:string|null;
 agileRoles?:readonly AgileRole[]|null;
 contributionPercents?:readonly number[]|null;
}>;
export type PresenceData=Readonly<{
 state:"available";source:"calendar-estimate"|"closure-snapshot";
 snapshotVersion:number|null;hoursPerJh:number;
 members:readonly PresenceMember[];totalPresenceJh:number|null;
}>;
export type PresenceUnavailable=Readonly<{
 state:"unavailable";reason:"history-missing"|"schema-missing"|"read-failed";
}>;
export type SprintPresence=PresenceData|PresenceUnavailable;
type CapacityDay=Readonly<{
 status:"calculated"|"not-calculable";availableHalfDays:number|null;
 missing?:readonly PresenceMissingSource[];
}>;
type CapacityMember=Readonly<{
 memberId:string;displayName:string;totalJh:number|null;
 days:readonly CapacityDay[];
}>;
export type CapacityPresenceInput=Readonly<{
 hoursPerJh:number;members:readonly CapacityMember[];
}>;
const round=(n:number)=>Math.round((n+Number.EPSILON)*10000)/10000;
export function presenceFromCapacity(report:CapacityPresenceInput):PresenceData{
 if(!Number.isFinite(report.hoursPerJh)||report.hoursPerJh<=0)
  throw Error("invalid-hours-per-jh");
 const ids=new Set<string>();
 const members:PresenceMember[]=report.members.map(member=>{
  if(!member.memberId||ids.has(member.memberId)||
   typeof member.displayName!=="string")throw Error("invalid-member");
  ids.add(member.memberId);
  let presence=0,unknownDays=0;
  const missingSources=new Set<PresenceMissingSource>();
  for(const day of member.days){
   if(day.status==="not-calculable")for(const missing of day.missing??[])missingSources.add(missing);
   if(day.status!=="calculated"||!Number.isInteger(day.availableHalfDays)||
    day.availableHalfDays===null||day.availableHalfDays<0||day.availableHalfDays>2){
    unknownDays++;continue;
   }
   presence+=day.availableHalfDays/2;
  }
  const knownDevelopment=member.totalJh!==null&&Number.isFinite(member.totalJh)&&member.totalJh>=0;
  return {memberId:member.memberId,displayName:member.displayName,
   presenceJh:unknownDays===0?round(presence):null,
   developmentJh:knownDevelopment?member.totalJh:null,
   daysCount:member.days.length,unknownDays,missingSources:[...missingSources].sort()};
 });
 const allKnown=members.every(m=>m.presenceJh!==null);
 const totalPresenceJh=allKnown?round(members.reduce((sum,m)=>sum+(m.presenceJh??0),0)):null;
 return {state:"available",source:"calendar-estimate",snapshotVersion:null,
  hoursPerJh:report.hoursPerJh,members,totalPresenceJh};
}
function object(value:unknown):Record<string,unknown>|null{
 return value!==null&&typeof value==="object"&&!Array.isArray(value)?
  value as Record<string,unknown>:null;
}
/** Validate snapshot data; absence of data is never silently changed to zero. */
export function presenceFromSnapshot(value:unknown,version:number):SprintPresence{
 const v=object(value);
 if(!v||v.state!=="available"||!Array.isArray(v.members)||
  !Number.isFinite(v.hoursPerJh)||Number(v.hoursPerJh)<=0)
  return {state:"unavailable",reason:"history-missing"};
 const seen=new Set<string>(),members:PresenceMember[]=[];
 for(const raw of v.members){
  const m=object(raw);
  if(!m||typeof m.memberId!=="string"||!m.memberId||
   seen.has(m.memberId)||typeof m.displayName!=="string"||
   !Number.isInteger(m.daysCount)||Number(m.daysCount)<0||
   !Number.isInteger(m.unknownDays)||Number(m.unknownDays)<0||
   Number(m.unknownDays)>Number(m.daysCount))return {state:"unavailable",reason:"read-failed"};
  const validJh=(x:unknown)=>x===null||(typeof x==="number"&&Number.isFinite(x)&&x>=0);
  if(!validJh(m.presenceJh)||!validJh(m.developmentJh)||
   (Number(m.unknownDays)>0&&m.presenceJh!==null))
   return {state:"unavailable",reason:"read-failed"};
  const allowedRoles=["scrumMaster","productOwner","developer"];
  if(m.professionalFunction!==undefined&&m.professionalFunction!==null&&
   (typeof m.professionalFunction!=="string"||m.professionalFunction.length>120))
   return {state:"unavailable",reason:"read-failed"};
  if(m.agileRoles!==undefined&&m.agileRoles!==null&&
   (!Array.isArray(m.agileRoles)||m.agileRoles.some(role=>!allowedRoles.includes(role))||
    new Set(m.agileRoles).size!==m.agileRoles.length))
   return {state:"unavailable",reason:"read-failed"};
  if(m.contributionPercents!==undefined&&m.contributionPercents!==null&&
   (!Array.isArray(m.contributionPercents)||m.contributionPercents.some(p=>
    !Number.isInteger(p)||p<0||p>100)))
   return {state:"unavailable",reason:"read-failed"};
  seen.add(m.memberId);
  members.push({memberId:m.memberId,displayName:m.displayName,
   presenceJh:m.presenceJh as number|null,
   developmentJh:m.developmentJh as number|null,
   daysCount:m.daysCount as number,unknownDays:m.unknownDays as number,
   ...(m.professionalFunction===undefined?{}:{
    professionalFunction:m.professionalFunction as string|null}),
   ...(m.agileRoles===undefined?{}:{
    agileRoles:m.agileRoles as readonly AgileRole[]|null}),
   ...(m.contributionPercents===undefined?{}:{
    contributionPercents:m.contributionPercents as readonly number[]|null})
  });
 }
 const sum=members.every(x=>x.presenceJh!==null)?
  round(members.reduce((v,x)=>v+(x.presenceJh??0),0)):null;
 if(v.totalPresenceJh!==sum)return {state:"unavailable",reason:"read-failed"};
 return {state:"available",source:"closure-snapshot",snapshotVersion:version,
  hoursPerJh:v.hoursPerJh as number,members,totalPresenceJh:sum};
}
/** Sprint endAt is exclusive, and calendar dates must follow the Sprint zone. */
export function sprintPresenceDates(sprint:{
 startAt:string;endAt:string;timeZone:string
}):{start:string;end:string}{
 const first=new Date(sprint.startAt),last=new Date(Date.parse(sprint.endAt)-1);
 if(!Number.isFinite(first.getTime())||!Number.isFinite(last.getTime())||
  last.getTime()<first.getTime())throw Error("invalid-sprint-period");
 const f=new Intl.DateTimeFormat("en-GB",{
  timeZone:sprint.timeZone,year:"numeric",month:"2-digit",day:"2-digit"
 });
 const day=(d:Date)=>{
  const part=Object.fromEntries(f.formatToParts(d).map(x=>[x.type,x.value]));
  return part.year+"-"+part.month+"-"+part.day;
 };
 return {start:day(first),end:day(last)};
}
