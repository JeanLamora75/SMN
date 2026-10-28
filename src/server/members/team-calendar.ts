import type {Client} from "pg";
import {isValidDate} from "./assignment";
import {resolveCalendarDay,type WeekRow,type ExceptionRow} from "./calendar";
import {resolveDayAvailability} from "./day-availability";
import {absenceOnDate,type AbsenceItem} from "./absence";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const TEAM_ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u;
const CATEGORY=/^[a-z][a-z0-9_-]{0,39}$/u;
export type TeamCalendarKind="all"|"planned"|"unplanned";
export type TeamCalendarQuery={
 start:string;days:7|14|28;teamId:string|null;
 memberId:string|null;categoryId:string|null;kind:TeamCalendarKind;
};
export type CollectiveDay={
 date:string;assigned:number;reportedUnavailable:number;
 declaredAbsentMemberCount:number;hasNationalHoliday:boolean;
 known:number;unknown:number;availableMembers:number;
};
export type MemberDay={
 date:string;assignmentApplicable:true;hasDeclaredAbsence:boolean;
 workingSlots:{morning:boolean;afternoon:boolean}|null;
 availableSlots:{morning:boolean;afternoon:boolean}|null;
 deductedHalfDays:number|null;status:"known"|"unknown";
 nationalHolidayName:string|null;
 companyClosureName:string|null;
 absences:ReadonlyArray<{
  id:string;revision:number;categoryId:string;categoryName:string;
  categoryColor:string;startOn:string;endOn:string;startSlot:"morning"|"afternoon";
  endSlot:"morning"|"afternoon";isPlanned:boolean;reason:string;
 }>;
};
export type TeamCalendarResponse={
 team:{id:string;name:string;mode:"scrum"|"kanban"};
 start:string;end:string;days:7|14|28;kind:TeamCalendarKind;
 collective:CollectiveDay[];
 closures:{id:string;name:string;startOn:string;endOn:string;companyId?:string;companyName?:string;companyColor?:string;members?:{id:string;name:string}[]}[];
 admin?:{categories:{id:string;name:string}[];
  members:{id:string;displayName:string;memberNumber:number;days:MemberDay[]}[]};
};
type TeamRow={id:string;name:string;mode:"scrum"|"kanban"};
type AssignmentRow={id:string;member_id:string;display_name:string;member_number:number;
 start_on:string;end_on:string|null};
type AbsenceRow={id:string;member_id:string;revision:number;category_id:string;
 category_name:string;category_color:string;start_on:string;end_on:string;
 start_slot:"morning"|"afternoon";end_slot:"morning"|"afternoon";
 is_planned:boolean;reason:string};
type Week=WeekRow&{member_id:string};
type Exception=ExceptionRow&{member_id:string};
type Location={member_id:string;effective_from:string;revision:number;country_iso2:string};
type Holiday={country_code:string;holiday_date:string;name:string};
type ClosureRow={id:string;name:string;start_on:string;end_on:string;company_id?:string;company_name?:string;company_color?:string;member_ids?:string[];member_details?:{id:string;name:string}[]};

export function parseTeamCalendarQuery(params:URLSearchParams,isAdmin:boolean):
 TeamCalendarQuery|null{
 const allowed=["start","days","teamId","memberId","categoryId","kind"];
 if([...params.keys()].some(k=>!allowed.includes(k))||
  [...params.keys()].some(k=>params.getAll(k).length!==1))return null;
 const start=params.get("start");
 if(!start||!isValidDate(start)||start<"1900-01-01"||start>"2200-12-01")return null;
 const rawDays=params.get("days")??"7";
 if(!["7","14","28"].includes(rawDays))return null;
 const teamId=params.get("teamId")||null;
 if(teamId&&!TEAM_ID.test(teamId))return null;
 const memberId=params.get("memberId")||null;
 const categoryId=params.get("categoryId")||null;
 const kind=params.get("kind")??"all";
 if(!["all","planned","unplanned"].includes(kind))return null;
 // Ordinary users cannot probe individuals, even by applying an absence-type filter.
 if(!isAdmin&&(memberId||categoryId||kind!=="all"))return null;
 if(memberId&&!UUID.test(memberId))return null;
 if(categoryId&&!CATEGORY.test(categoryId))return null;
 return {start,days:Number(rawDays) as 7|14|28,teamId,memberId,categoryId,
  kind:kind as TeamCalendarKind};
}
export function calendarDates(start:string,days:7|14|28):string[]{
 if(!isValidDate(start))throw Error("team-calendar-invalid-date");
 const ms=Date.parse(start+"T00:00:00.000Z");
 return Array.from({length:days},(_,i)=>
  new Date(ms+i*86400000).toISOString().slice(0,10));
}
const applies=(row:Pick<AssignmentRow,"start_on"|"end_on">,date:string)=>
 row.start_on<=date&&(row.end_on===null||row.end_on>=date);
const latestAt=<T extends {effective_from:string;revision:number}>(
 rows:readonly T[],date:string):T|null=>rows.filter(r=>r.effective_from<=date)
 .sort((a,b)=>a.effective_from.localeCompare(b.effective_from)||a.revision-b.revision).at(-1)??null;

/** Sanitized, member-free collective data are built without serializing private rows. */
export async function readTeamCalendar(db:Client,query:TeamCalendarQuery,isAdmin:boolean,
 authorizedTeam?:TeamRow,companyMode=false):Promise<TeamCalendarResponse>{
 if(!isValidDate(query.start)||query.start<"1900-01-01"||query.start>"2200-12-01"||
  ![7,14,28].includes(query.days)||(!isAdmin&&(query.memberId||query.categoryId||query.kind!=="all")))
  throw Error("team-calendar-invalid-input");
 const dates=calendarDates(query.start,query.days);
 const end=dates.at(-1)!;
 // Le service ne déduit jamais la première équipe sur une base v28.
 // authorizedTeam est fourni uniquement après resolveAdminTeam côté API.
 const teams=authorizedTeam?{rows:[authorizedTeam]}:await db.query<TeamRow>([
  "SELECT t.id,t.name,i.mode FROM public.smn_team t",
  "JOIN public.smn_installation i ON i.id=t.installation_id",
  "WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version<=27",
  "AND i.mode IN ('scrum','kanban') LIMIT 2"
 ].join(" "));
 if(teams.rows.length!==1)throw Error("team-calendar-unavailable");
 const team=teams.rows[0];
 if(query.teamId!==null&&query.teamId!==team.id)throw Error("team-calendar-not-found");
 const assignments=await db.query<AssignmentRow>([
  "SELECT a.id,a.member_id,m.display_name,m.member_number,",
  "a.start_on::text AS start_on,a.end_on::text AS end_on",
  "FROM public.smn_member_assignment a",
  "JOIN public.smn_member m ON m.id=a.member_id AND m.installation_id='singleton'",
  "WHERE a.team_id=$1 AND a.start_on<=$3::date",
  "AND (a.end_on IS NULL OR a.end_on>=$2::date)",
  "ORDER BY m.member_number,a.start_on,a.id LIMIT 501"
 ].join(" "),[team.id,query.start,end]);
 if(assignments.rows.length>500)throw Error("team-calendar-assignment-limit");
 const allIds=[...new Set(assignments.rows.map(a=>a.member_id))];
 // Restrict every private query to members assigned to this installed team in the period.
 const [absences,weeks,exceptions,locations]=await Promise.all([
  db.query<AbsenceRow>([
   "SELECT a.id,a.member_id,a.revision,a.category_id,c.name AS category_name,",
   "c.color AS category_color,a.start_on::text AS start_on,a.end_on::text AS end_on,",
   "a.start_slot,a.end_slot,a.is_planned,a.reason FROM public.smn_member_absence a",
   "JOIN public.smn_absence_category c ON c.id=a.category_id",
   "WHERE a.member_id=ANY($1::text[]) AND a.start_on<=$3::date AND a.end_on>=$2::date",
   "AND NOT EXISTS (SELECT 1 FROM public.smn_member_absence_history h",
   "WHERE h.absence_id=a.id AND h.revision=a.revision AND h.after_values->>'deleted'='true')",
   "ORDER BY a.member_id,a.start_on,a.id LIMIT 2001"
  ].join(" "),[allIds,query.start,end]),
  db.query<Week>([
   "SELECT member_id,revision,effective_from::text AS effective_from,days,",
   "created_at::text AS created_at FROM public.smn_member_calendar_week",
   "WHERE member_id=ANY($1::text[]) AND effective_from<=$2::date",
   "ORDER BY member_id,effective_from,revision LIMIT 10001"
  ].join(" "),[allIds,end]),
  db.query<Exception>([
   "SELECT member_id,revision,on_date::text AS on_date,morning,afternoon,note,",
   "created_at::text AS created_at FROM public.smn_member_calendar_exception",
   "WHERE member_id=ANY($1::text[]) AND on_date BETWEEN $2::date AND $3::date",
   "ORDER BY member_id,on_date,revision LIMIT 5001"
  ].join(" "),[allIds,query.start,end]),
  db.query<Location>([
   "SELECT member_id,revision,effective_from::text AS effective_from,country_iso2",
   "FROM public.smn_member_location WHERE member_id=ANY($1::text[])",
   "AND effective_from<=$2::date ORDER BY member_id,effective_from,revision LIMIT 10001"
  ].join(" "),[allIds,end])
 ]);
 if(absences.rows.length>2000||weeks.rows.length>10000||
  exceptions.rows.length>5000||locations.rows.length>10000)
  throw Error("team-calendar-data-limit");
 const countries=[...new Set(locations.rows.map(x=>x.country_iso2))];
 const [holidays,categories,closures]=await Promise.all([
  db.query<Holiday>([
   "SELECT country_code,holiday_date::text AS holiday_date,name",
   "FROM public.smn_national_holiday WHERE country_code=ANY($1::text[])",
   "AND holiday_date BETWEEN $2::date AND $3::date"
  ].join(" "),[countries,query.start,end]),
  isAdmin?db.query<{id:string;name:string}>(
   "SELECT id,name FROM public.smn_absence_category ORDER BY name,id LIMIT 101"):
   Promise.resolve({rows:[] as {id:string;name:string}[]}),
  db.query<ClosureRow>((companyMode?[
   "SELECT c.id,c.name,c.start_on::text AS start_on,c.end_on::text AS end_on,",
   "c.company_id,co.name AS company_name,co.color AS company_color,",
   "array_agg(DISTINCT m.id) AS member_ids,",
   "jsonb_agg(DISTINCT jsonb_build_object('id',m.id,'name',m.display_name)) AS member_details",
   "FROM public.smn_company_closure c",
   "JOIN public.smn_company co ON co.id=c.company_id AND co.installation_id='singleton'",
   "JOIN public.smn_member m ON m.company_id=co.id AND m.installation_id=co.installation_id",
   "JOIN public.smn_member_assignment a ON a.member_id=m.id AND a.team_id=$1",
   "AND a.start_on<=c.end_on AND (a.end_on IS NULL OR a.end_on>=c.start_on)",
   "WHERE c.is_active=true AND c.start_on<=$3::date AND c.end_on>=$2::date",
   "GROUP BY c.id,co.id ORDER BY c.start_on,c.id LIMIT 101"
  ]:[
   "SELECT id,name,start_on::text AS start_on,end_on::text AS end_on",
   "FROM public.smn_company_closure WHERE team_id=$1 AND is_active=true",
   "AND start_on<=$3::date AND end_on>=$2::date",
   "ORDER BY start_on,id LIMIT 101"
  ]).join(" "),[team.id,query.start,end])
 ]);
 if(closures.rows.length>100)throw Error("team-calendar-closures-limit");
 const countryHolidays=new Map(holidays.rows.map(h=>[h.country_code+":"+h.holiday_date,h.name]));
 const collective:CollectiveDay[]=dates.map(date=>({
  date,assigned:0,reportedUnavailable:0,declaredAbsentMemberCount:0,hasNationalHoliday:false,known:0,unknown:0,availableMembers:0
 }));
 const adminMembers:NonNullable<TeamCalendarResponse["admin"]>["members"]=[];
 const memberIds=query.memberId?[query.memberId]:allIds;
 for(const memberId of memberIds){
  const assignmentsFor=assignments.rows.filter(x=>x.member_id===memberId);
  if(!assignmentsFor.length)continue;
  const personalAbsences=absences.rows.filter(x=>x.member_id===memberId);
  const personalWeeks=weeks.rows.filter(x=>x.member_id===memberId);
  const personalExceptions=exceptions.rows.filter(x=>x.member_id===memberId);
  const personalLocations=locations.rows.filter(x=>x.member_id===memberId);
  const personalDays:MemberDay[]=[];
  for(let i=0;i<dates.length;i++){
   const date=dates[i];
   if(!assignmentsFor.some(a=>applies(a,date)))continue;
   const location=latestAt(personalLocations,date);
   const country=location?.country_iso2??null;
   const nationalName=country?countryHolidays.get(country+":"+date)??null:null;
   const isNational=nationalName!==null;
   const calendar=resolveCalendarDay(personalWeeks,personalExceptions,date);
   const active=personalAbsences.filter(a=>a.start_on<=date&&a.end_on>=date);
   const records=active.map(a=>({
    startOn:a.start_on,endOn:a.end_on,startSlot:a.start_slot,endSlot:a.end_slot
   }));
   const activeClosure=closures.rows.find(c=>(!companyMode||c.member_ids?.includes(memberId))&&c.start_on<=date&&c.end_on>=date);
   const resolution=resolveDayAvailability(date,calendar.slots,isNational,records,
    Boolean(activeClosure));
   const count=collective[i];
   count.assigned++;
   if(isNational===true)count.hasNationalHoliday=true;
   // Count recorded absences once per assigned member and date, independent of holidays or closures.
   const hasDeclaredAbsence=active.some(a=>{
    const slots=absenceOnDate({startOn:a.start_on,endOn:a.end_on,startSlot:a.start_slot,endSlot:a.end_slot},date);
    return slots.morning||slots.afternoon;
   });
   if(hasDeclaredAbsence)count.declaredAbsentMemberCount++;
   if(resolution.status==="known")count.known++;
   else count.unknown++;
   if(resolution.absenceSlots.morning||resolution.absenceSlots.afternoon||
      isNational===true||Boolean(activeClosure))count.reportedUnavailable++;
   if(resolution.availableSlots&&(resolution.availableSlots.morning||
      resolution.availableSlots.afternoon))count.availableMembers++;
   if(isAdmin){
    const selected=active.filter(a=>
     (query.kind==="all"||(query.kind==="planned"?a.is_planned:!a.is_planned))&&
     (query.categoryId===null||a.category_id===query.categoryId));
    personalDays.push({date,assignmentApplicable:true,hasDeclaredAbsence,
     workingSlots:calendar.slots,availableSlots:resolution.availableSlots,
     deductedHalfDays:resolution.deductedHalfDays,status:resolution.status,
     nationalHolidayName:nationalName,companyClosureName:activeClosure?.name??null,
     absences:selected.map(a=>({
      id:a.id,revision:a.revision,categoryId:a.category_id,
      categoryName:a.category_name,categoryColor:a.category_color,
      startOn:a.start_on,endOn:a.end_on,startSlot:a.start_slot,endSlot:a.end_slot,
      isPlanned:a.is_planned,reason:a.reason
     }))});
   }
  }
  if(isAdmin){
   adminMembers.push({id:memberId,displayName:assignmentsFor[0].display_name,
    memberNumber:assignmentsFor[0].member_number,days:personalDays});
  }
 }
 return {
  team,start:query.start,end,days:query.days,kind:query.kind,collective,
  closures:closures.rows.map(c=>({id:c.id,name:c.name,startOn:c.start_on,endOn:c.end_on,\n   ...(companyMode?{companyId:c.company_id,companyName:c.company_name,companyColor:c.company_color,\n   members:isAdmin?(c.member_details??[]):[]}: {})})),
  ...(isAdmin?{admin:{categories:categories.rows,members:adminMembers}}:{})
 };
}
