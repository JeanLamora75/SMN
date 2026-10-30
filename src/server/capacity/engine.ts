import type {Client} from "pg";
import {isValidDate} from "../members/assignment";
import {resolveCalendarDay,DEFAULT_WEEK,type WeekRow,type ExceptionRow} from "../members/calendar";
import {resolveDayAvailability} from "../members/day-availability";
import {readWorkSlots,workingIntervals,occupiedMinutes} from "./work-slots";
import {capacityImpactJh,type Interval} from "./meeting-intervals";

export type CapacityMissing="no-assignments"|"ambiguous-assignment"|
 "assignment-version"|"work-calendar"|
 "exceptional-meeting-participants"|"exceptional-meeting-work-slots";
export type DayCapacity={
 date:string;status:"calculated"|"not-calculable";
 developmentJh:number|null;developmentHours:number|null;
 availableHalfDays:number|null;allocationPercent:number|null;
 contractPercent:number|null;developerPercent:number|null;
 contributionPercent:number|null;missing:CapacityMissing[];
};
export type MemberCapacity={memberId:string;displayName:string;
 status:"calculated"|"not-calculable";totalJh:number|null;days:DayCapacity[]};
export type CapacityReport={
 start:string;end:string;hoursPerJh:number;
 team:{id:string;name:string;mode:"scrum"|"kanban"};
 status:"calculated"|"not-calculable";totalJh:number|null;
 missing:{date:string|null;memberId:string|null;source:CapacityMissing}[];
 members:MemberCapacity[];
};
type Assignment={id:string;member_id:string;display_name:string;
 start_on:string;end_on:string|null};
type Version={assignment_id:string;revision:number;effective_from:string;
 contract_percent:number;allocation_percent:number;contribution_percent:number;
 developer_percent:number};
type Week=WeekRow&{member_id:string};
type Exception=ExceptionRow&{member_id:string};
type Location={member_id:string;revision:number;effective_from:string;country_iso2:string};
type Absence={member_id:string;start_on:string;end_on:string;
 start_slot:"morning"|"afternoon";end_slot:"morning"|"afternoon"};
type Holiday={country_code:string;holiday_date:string;name:string};
type Closure={member_id:string;start_on:string;end_on:string};
/** Une fermeture v31 ne concerne que les membres explicitement projetés par la requête entreprise. */
export function closureForMember(rows:readonly Closure[],memberId:string,date:string,_companyMode:boolean):boolean{
 return rows.some(row=>row.member_id===memberId&&row.start_on<=date&&row.end_on>=date);
}
const round=(v:number)=>Math.round((v+Number.EPSILON)*10000)/10000;
const validRate=(p:unknown)=>typeof p==="number"&&Number.isInteger(p)&&p>=0&&p<=100;
export const validHoursPerJh=(v:unknown):v is number=>
 typeof v==="number"&&Number.isFinite(v)&&v>=1&&v<=24&&
 Math.abs(Math.round(v*100)-v*100)<1e-8;

/** Allocation is already bounded by contract percentage; never multiply contract twice. */
export function computeDevelopmentDay(
 availableHalfDays:number,hoursPerJh:number,allocationPercent:number,
 developerPercent:number,contributionPercent:number
):{hours:number;jh:number}|null{
 if(!Number.isInteger(availableHalfDays)||availableHalfDays<0||availableHalfDays>2||
  !validHoursPerJh(hoursPerJh)||![allocationPercent,developerPercent,contributionPercent]
   .every(validRate))return null;
 const hours=availableHalfDays*hoursPerJh/2*
  (allocationPercent/100)*(developerPercent/100)*(contributionPercent/100);
 return {hours,jh:hours/hoursPerJh};
}
export function parseCapacityPeriod(params:URLSearchParams):{start:string;end:string}|null{
 if([...params.keys()].some(k=>!["start","end"].includes(k))||
  params.getAll("start").length!==1||params.getAll("end").length!==1)return null;
 const start=params.get("start"),end=params.get("end");
 if(!isValidDate(start)||!isValidDate(end)||start<"1900-01-01"||
  end>"2200-12-31"||end<start)return null;
 const interval=(Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z"))/86400000;
 return Number.isInteger(interval)&&interval<=92?{start,end}:null;
}
const latest=<T extends {effective_from:string;revision:number}>(
 values:readonly T[],date:string):T|null=>values.filter(v=>v.effective_from<=date)
 .sort((a,b)=>a.effective_from.localeCompare(b.effective_from)||a.revision-b.revision).at(-1)??null;
const applicable=(r:Assignment,date:string)=>r.start_on<=date&&
 (r.end_on===null||r.end_on>=date);
const rowsFor=<T extends {member_id:string}>(rows:readonly T[],id:string)=>
 rows.filter(r=>r.member_id===id);
const failDay=(date:string,missing:CapacityMissing[]):DayCapacity=>({
 date,status:"not-calculable",developmentJh:null,developmentHours:null,
 availableHalfDays:null,allocationPercent:null,contractPercent:null,
 developerPercent:null,contributionPercent:null,missing
});
const teamSql=[
 "SELECT t.id,t.name,i.mode FROM public.smn_team t",
 "JOIN public.smn_installation i ON i.id=t.installation_id",
 "WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version<=27",
 "AND i.mode IN ('scrum','kanban')",
 "LIMIT 2"
].join(" ");
const listDates=(start:string,end:string)=>{
 const count=(Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z"))/86400000+1;
 return Array.from({length:count},(_,offset)=>
  new Date(Date.parse(start+"T00:00:00Z")+offset*86400000)
   .toISOString().slice(0,10));
};
/** Queries share one repeatable-read snapshot; no mutation of historical snapshots. */
export async function readDevelopmentCapacity(db:Client,start:string,end:string,
 options:{externalTransaction?:boolean;includeExceptionalImpact?:boolean;teamId?:string}={}):Promise<CapacityReport>{
 const parsed=parseCapacityPeriod(new URLSearchParams({start,end}));
 if(!parsed)throw Error("capacity-invalid-period");
 if(!options.externalTransaction)
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
 try{
  const teams=options.teamId?await db.query<{id:string;name:string;mode:"scrum"|"kanban"}>(
   "SELECT t.id,t.name,LOWER(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode')) AS mode FROM public.smn_team t "+
   "JOIN public.smn_installation i ON i.id=t.installation_id "+
   "WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version BETWEEN 28 AND 32 "+
   "AND LOWER(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode')) IN ('scrum','kanban') "+
   "AND (i.schema_version<32 OR COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false) "+
   "AND t.id=$1 LIMIT 2",[options.teamId]):
   await db.query<{id:string;name:string;mode:"scrum"|"kanban"}>(teamSql);
  if(teams.rows.length!==1)throw Error("capacity-team-unavailable");
  const team=teams.rows[0];
  const settings=await db.query<{hours_per_jh:number}>(
   "SELECT hours_per_jh::float8 AS hours_per_jh FROM public.smn_capacity_settings WHERE installation_id='singleton'");
  const hoursPerJh=settings.rows[0]?.hours_per_jh;
  if(!validHoursPerJh(hoursPerJh))throw Error("capacity-settings-unavailable");
  const assignments=await db.query<Assignment>([
   "SELECT a.id,a.member_id,m.display_name,a.start_on::text AS start_on,",
   "a.end_on::text AS end_on FROM public.smn_member_assignment a",
   "JOIN public.smn_member m ON m.id=a.member_id AND m.installation_id='singleton'",
   "WHERE a.team_id=$1 AND a.start_on<=$3::date",
   "AND (a.end_on IS NULL OR a.end_on>=$2::date)",
   "ORDER BY m.member_number,a.start_on,a.id LIMIT 501"
  ].join(" "),[team.id,start,end]);
  if(assignments.rows.length>500)throw Error("capacity-assignment-limit");
  const assignmentIds=assignments.rows.map(a=>a.id);
  const memberIds=[...new Set(assignments.rows.map(a=>a.member_id))];
  const schema=options.teamId?await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton'"):null;
  const usesCompanyClosures=(schema?.rows[0]?.schema_version??0)>=31;
  const [versions,weeks,exceptions,locations,absences,closures]=await Promise.all([
   db.query<Version>([
    "SELECT assignment_id,revision,effective_from::text AS effective_from,",
    "contract_percent,allocation_percent,contribution_percent,developer_percent",
    "FROM public.smn_member_assignment_version WHERE assignment_id=ANY($1::text[])",
    "AND effective_from<=$2::date ORDER BY assignment_id,effective_from,revision LIMIT 15001"
   ].join(" "),[assignmentIds,end]),
   db.query<Week>([
    "SELECT member_id,revision,effective_from::text AS effective_from,days,",
    "created_at::text AS created_at FROM public.smn_member_calendar_week",
    "WHERE member_id=ANY($1::text[]) AND effective_from<=$2::date",
    "ORDER BY member_id,effective_from,revision LIMIT 10001"
   ].join(" "),[memberIds,end]),
   db.query<Exception>([
    "SELECT member_id,revision,on_date::text AS on_date,morning,afternoon,note,",
    "created_at::text AS created_at FROM public.smn_member_calendar_exception",
    "WHERE member_id=ANY($1::text[]) AND on_date BETWEEN $2::date AND $3::date",
    "ORDER BY member_id,on_date,revision LIMIT 10001"
   ].join(" "),[memberIds,start,end]),
   db.query<Location>([
    "SELECT member_id,revision,effective_from::text AS effective_from,country_iso2",
    "FROM public.smn_member_location WHERE member_id=ANY($1::text[])",
    "AND effective_from<=$2::date ORDER BY member_id,effective_from,revision LIMIT 10001"
   ].join(" "),[memberIds,end]),
   db.query<Absence>([
    "SELECT member_id,start_on::text AS start_on,end_on::text AS end_on,",
    "start_slot,end_slot FROM public.smn_member_absence",
    "WHERE member_id=ANY($1::text[]) AND start_on<=$3::date AND end_on>=$2::date",
    "AND NOT EXISTS (SELECT 1 FROM public.smn_member_absence_history h",
    "WHERE h.absence_id=public.smn_member_absence.id",
    "AND h.revision=public.smn_member_absence.revision AND h.after_values->>'deleted'='true')",
    "ORDER BY member_id,start_on LIMIT 10001"
   ].join(" "),[memberIds,start,end]),
   usesCompanyClosures?db.query<Closure>([
    "SELECT m.id AS member_id,c.start_on::text AS start_on,c.end_on::text AS end_on",
    "FROM public.smn_member m",
    "JOIN public.smn_company_closure c ON c.company_id=m.company_id AND c.is_active=true",
    "JOIN public.smn_company company ON company.id=c.company_id",
    "AND company.installation_id=m.installation_id",
    "WHERE m.installation_id='singleton' AND m.id=ANY($1::text[])",
    "AND c.start_on<=$3::date AND c.end_on>=$2::date",
    "ORDER BY m.id,c.start_on LIMIT 10001"
   ].join(" "),[memberIds,start,end]):db.query<Closure>([
    "SELECT a.member_id,c.start_on::text AS start_on,c.end_on::text AS end_on",
    "FROM public.smn_company_closure c",
    "JOIN public.smn_member_assignment a ON a.team_id=c.team_id",
    "WHERE c.team_id=$1 AND c.is_active=true",
    "AND c.start_on<=$3::date AND c.end_on>=$2::date",
    "ORDER BY a.member_id,c.start_on LIMIT 10001"
   ].join(" "),[team.id,start,end])
  ]);
  if(versions.rows.length>15000||weeks.rows.length>10000||
   exceptions.rows.length>10000||locations.rows.length>10000||
   absences.rows.length>10000||closures.rows.length>10000)throw Error("capacity-data-limit");
  const countries=[...new Set(locations.rows.map(l=>l.country_iso2))];
  // National holidays are deductions, not a prerequisite for calculating capacity.
  // No member country or matching holiday record means no national deduction.
  const holiday=await db.query<Holiday>([
   "SELECT country_code,holiday_date::text AS holiday_date,name",
   "FROM public.smn_national_holiday",
   "WHERE country_code=ANY($1::text[]) AND holiday_date BETWEEN $2::date AND $3::date"
  ].join(" "),[countries,start,end]);
  const holidays=new Set(holiday.rows.map(h=>h.country_code+":"+h.holiday_date));
  const explicitSlots=options.includeExceptionalImpact&&team.mode==="scrum"?await readWorkSlots(db,team.id):null;
  const impactEvents=options.includeExceptionalImpact&&team.mode==="scrum"?
   (await db.query<{id:string;member_id:string|null;start_at:string;end_at:string;actual_minutes:number|null;planned_minutes:number}>(`SELECT m.id,p.member_id,m.starts_at::text AS start_at,m.ends_at::text AS end_at,
      m.actual_minutes,m.duration_minutes AS planned_minutes
     FROM public.smn_sprint_exceptional_meeting m JOIN public.smn_sprint s ON s.id=m.sprint_id
     LEFT JOIN public.smn_exceptional_meeting_participant p ON p.meeting_id=m.id
     WHERE s.team_id=$1 AND s.deleted_at IS NULL AND m.impacts_capacity=true
     AND m.status NOT IN ('cancelled','not_held') AND m.starts_at<$3::timestamptz AND m.ends_at>$2::timestamptz
     ORDER BY m.id,p.member_id LIMIT 2001`,[team.id,start+"T00:00:00Z",new Date(Date.parse(end+"T00:00:00Z")+2*86400000).toISOString()])).rows:[];
  if(impactEvents.length>2000)throw Error("capacity-meeting-limit");
  const unassignedImpact=impactEvents.some(x=>x.member_id===null||!memberIds.includes(x.member_id));
  const impactZones=impactEvents.length&&explicitSlots?
   (await db.query<{time_zone:string}>(`SELECT DISTINCT s.time_zone FROM public.smn_sprint_exceptional_meeting m
    JOIN public.smn_sprint s ON s.id=m.sprint_id WHERE m.id=ANY($1::text[])`,
    [[...new Set(impactEvents.map(x=>x.id))]])).rows:[];
  const divergentZones=impactZones.some(x=>x.time_zone!==explicitSlots?.zone);
  const dates=listDates(start,end);
  const members:MemberCapacity[]=[];
  const missing:CapacityReport["missing"]=[];
  for(const memberId of memberIds){
   const memberAssignments=assignments.rows.filter(a=>a.member_id===memberId);
   const memberWeeks=rowsFor(weeks.rows,memberId);
   const memberExceptions=rowsFor(exceptions.rows,memberId);
   const memberLocations=rowsFor(locations.rows,memberId);
   const memberAbsences=rowsFor(absences.rows,memberId);
   const days:DayCapacity[]=[];
   let memberExactJh=0;
   for(const date of dates){
    const active=memberAssignments.filter(a=>applicable(a,date));
    if(active.length===0)continue; // Not assigned on this date: no fictitious zero.
    const problems:CapacityMissing[]=[];
    if(active.length!==1)problems.push("ambiguous-assignment");
    const version=active.length===1?
     latest(versions.rows.filter(v=>v.assignment_id===active[0].id),date):null;
    if(active.length===1&&!version)problems.push("assignment-version");
    // The member calendar editor proposes DEFAULT_WEEK when no effective
    // individual version exists. Apply the same baseline to capacity so
    // assigned members are not incorrectly classified as unavailable.
    const effectiveWeeks=memberWeeks.some(w=>w.effective_from<=date)?
     memberWeeks:[{revision:0,effective_from:"1900-01-01",days:DEFAULT_WEEK,
      created_at:""}];
    const calendar=resolveCalendarDay(effectiveWeeks,memberExceptions,date);
    if(calendar.slots===null)problems.push("work-calendar");
    const location=latest(memberLocations,date);
    const country=location?.country_iso2??null;
    const closure=closureForMember(closures.rows,memberId,date,usesCompanyClosures);
    const national=country!==null&&holidays.has(country+":"+date);
    const availability=resolveDayAvailability(date,calendar.slots,national,
     memberAbsences.map(a=>({startOn:a.start_on,endOn:a.end_on,
      startSlot:a.start_slot,endSlot:a.end_slot})),closure);
    if(availability.status==="unknown"&&problems.length===0)
     problems.push("work-calendar");
    if(version&&(!validRate(version.allocation_percent)||!validRate(version.contract_percent)||
       !validRate(version.developer_percent)||!validRate(version.contribution_percent)||
       version.allocation_percent>version.contract_percent))
      throw Error("capacity-versions-corrupt");
    if(problems.length){
     days.push(failDay(date,problems));
     for(const source of problems)missing.push({date,memberId,source});
     continue;
    }
    const availableHalfDays=Number(availability.availableSlots!.morning)+
     Number(availability.availableSlots!.afternoon);
    const computed=computeDevelopmentDay(availableHalfDays,hoursPerJh,
     version!.allocation_percent,version!.developer_percent,version!.contribution_percent);
    if(!computed)throw Error("capacity-rate-corrupt");
    let netJh=computed.jh,netHours=computed.hours;
    if(options.includeExceptionalImpact&&team.mode==="scrum"){
     const impacted=impactEvents.filter(e=>e.member_id===memberId);
     if(impacted.length){
      const actualKnown=impacted.every(e=>e.actual_minutes===null||e.actual_minutes===e.planned_minutes);
      const work=explicitSlots?workingIntervals(date,explicitSlots.zone,explicitSlots.slots,availability.availableSlots!):null;
      const duration=(a:string,b:string)=>{const x=Date.parse("2000-01-01T"+a+":00Z"),y=Date.parse("2000-01-01T"+b+":00Z");return (y-x)/60000;};
      const consistent=explicitSlots&&
       Math.abs(duration(explicitSlots.slots.morningStart,explicitSlots.slots.morningEnd)-hoursPerJh*30)<0.01&&
       Math.abs(duration(explicitSlots.slots.afternoonStart,explicitSlots.slots.afternoonEnd)-hoursPerJh*30)<0.01;
      if(!work||!actualKnown||!consistent||unassignedImpact||divergentZones){
       const source:CapacityMissing=!work||!consistent?"exceptional-meeting-work-slots":"exceptional-meeting-participants";
       missing.push({date,memberId,source});days.push(failDay(date,[source]));continue;
      }
      const intervals:Interval[]=impacted.map(e=>({start:Date.parse(e.start_at),end:Date.parse(e.end_at)}));
      const minutes=occupiedMinutes(intervals,work);
      const deducted=capacityImpactJh(minutes,hoursPerJh,{allocationPercent:version!.allocation_percent,
       developerPercent:version!.developer_percent,contributionPercent:version!.contribution_percent});
      netJh=Math.max(0,computed.jh-deducted);netHours=netJh*hoursPerJh;
     }
    }
    memberExactJh+=netJh;
    days.push({
     date,status:"calculated",developmentJh:round(netJh),
     developmentHours:round(netHours),availableHalfDays,
     allocationPercent:version!.allocation_percent,
     contractPercent:version!.contract_percent,
     developerPercent:version!.developer_percent,
     contributionPercent:version!.contribution_percent,missing:[]
    });
   }
   members.push({memberId,displayName:memberAssignments[0].display_name,
    status:days.some(d=>d.status==="not-calculable")?"not-calculable":"calculated",
    totalJh:days.some(d=>d.status==="not-calculable")?null:round(memberExactJh),days});
  }
  if(members.length===0)missing.push({date:null,memberId:null,source:"no-assignments"});
  if(unassignedImpact)missing.push({date:null,memberId:null,source:"exceptional-meeting-participants"});
  const status=missing.length?"not-calculable":"calculated";
  const totalJh=status==="calculated"?
   round(members.reduce((sum,m)=>sum+(m.totalJh??0),0)):null;
  if(!options.externalTransaction)await db.query("COMMIT");
  return {start,end,team,hoursPerJh,status,totalJh,missing,members};
 }catch(error){
  if(!options.externalTransaction)await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
