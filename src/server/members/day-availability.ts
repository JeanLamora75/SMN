import type {Client} from "pg";
import {isValidDate} from "./assignment";
import {absenceOnDate,type AbsenceItem} from "./absence";
import {resolveCalendarDay,type WeekRow,type ExceptionRow} from "./calendar";

type Slots={morning:boolean;afternoon:boolean};
export type DayAvailability={
 onDate:string;
 countryIso2:string|null;
 assignmentApplicable:boolean;
 nationalHoliday:boolean|null;
 nationalHolidayName:string|null;
 companyClosureName:string|null;
 nationalCalendarStatus:"configured"|"partial"|"not-configured"|"invalid"|"unknown";
 workingSlots:Slots|null;
 absenceSlots:Slots;
 unavailableSlots:Slots;
 availableSlots:Slots|null;
 deductedHalfDays:number|null;
 nationalOverlap:boolean;
 status:"known"|"unknown";
};
/** Unavailability is a union of half-days, never the sum of source records. */
export function resolveDayAvailability(
 onDate:string,workingSlots:Slots|null,nationalHoliday:boolean|null,
 absences:readonly Pick<AbsenceItem,"startOn"|"endOn"|"startSlot"|"endSlot">[],
 companyClosure=false
):Pick<DayAvailability,"absenceSlots"|"unavailableSlots"|"availableSlots"|
 "deductedHalfDays"|"nationalOverlap"|"status">{
 if(!isValidDate(onDate))throw Error("member-availability-invalid-date");
 const absenceSlots=absences.reduce<Slots>((result,absence)=>{
  const slots=absenceOnDate(absence,onDate);
  return {morning:result.morning||slots.morning,
   afternoon:result.afternoon||slots.afternoon};
 },{morning:false,afternoon:false});
 const unavailableSlots={
  morning:nationalHoliday===true||companyClosure||absenceSlots.morning,
  afternoon:nationalHoliday===true||companyClosure||absenceSlots.afternoon
 };
 const nationalOverlap=nationalHoliday===true&&(companyClosure||absenceSlots.morning||absenceSlots.afternoon);
 // A missing work schedule is unknown. An absent national holiday record is
 // not a blocker; only a recorded holiday (true) deducts time.
 if(workingSlots===null)return {
  absenceSlots,unavailableSlots,availableSlots:null,deductedHalfDays:null,
  nationalOverlap,status:"unknown"
 };
 const availableSlots={
  morning:workingSlots.morning&&!unavailableSlots.morning,
  afternoon:workingSlots.afternoon&&!unavailableSlots.afternoon
 };
 return {absenceSlots,unavailableSlots,availableSlots,
  deductedHalfDays:Number(workingSlots.morning&&unavailableSlots.morning)+
   Number(workingSlots.afternoon&&unavailableSlots.afternoon),
  nationalOverlap,status:"known"};
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/** Member-centric read model, reusable by later team calendars and capacity computations. */
export async function readMemberDayAvailability(db:Client,memberId:string,onDate:string,
 absences:readonly AbsenceItem[]):Promise<DayAvailability>{
 if(!UUID.test(memberId)||!isValidDate(onDate))throw Error("member-availability-invalid-input");
 const version=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
 const companyScoped=version.rows[0]?.schema_version===31;
 const [weeks,exceptions,locations,assignments,closures]=await Promise.all([
  db.query<WeekRow>([
   "SELECT revision,effective_from::text AS effective_from,days,created_at::text AS created_at",
   "FROM public.smn_member_calendar_week WHERE member_id=$1 AND effective_from<=$2::date",
   "ORDER BY effective_from DESC,revision DESC LIMIT 1"
  ].join(" "),[memberId,onDate]),
  db.query<ExceptionRow>([
   "SELECT revision,on_date::text AS on_date,morning,afternoon,note,",
   "created_at::text AS created_at FROM public.smn_member_calendar_exception",
   "WHERE member_id=$1 AND on_date=$2::date ORDER BY revision DESC LIMIT 1"
  ].join(" "),[memberId,onDate]),
  db.query<{country_iso2:string|null}>([
   "SELECT country_iso2 FROM public.smn_member_location WHERE member_id=$1",
   "AND effective_from<=$2::date ORDER BY effective_from DESC,revision DESC LIMIT 1"
  ].join(" "),[memberId,onDate]),
  db.query<{team_count:number}>([
   "SELECT count(DISTINCT a.team_id)::integer AS team_count",
   "FROM public.smn_member_assignment a",
   "JOIN public.smn_team t ON t.id=a.team_id",
   "JOIN public.smn_installation i ON i.id=t.installation_id",
   "WHERE a.member_id=$1 AND t.installation_id='singleton'",
   "AND i.state='initialized' AND i.mode IN ('scrum','kanban')",
   "AND a.start_on<=$2::date AND (a.end_on IS NULL OR a.end_on>=$2::date)"
  ].join(" "),[memberId,onDate]),
  db.query<{name:string}>((companyScoped?[
   "SELECT c.name FROM public.smn_company_closure c",
   "JOIN public.smn_member m ON m.company_id=c.company_id",
   "JOIN public.smn_company company ON company.id=c.company_id",
   "AND company.installation_id=m.installation_id",
   "WHERE m.id=$1 AND m.installation_id='singleton'",
   "AND c.is_active=true AND c.start_on<=$2::date AND c.end_on>=$2::date",
   "ORDER BY c.id LIMIT 2"
  ]:[
   "SELECT c.name FROM public.smn_company_closure c",
   "JOIN public.smn_member_assignment a ON a.team_id=c.team_id",
   "JOIN public.smn_team t ON t.id=c.team_id AND t.installation_id='singleton'",
   "WHERE a.member_id=$1 AND a.start_on<=$2::date",
   "AND (a.end_on IS NULL OR a.end_on>=$2::date)",
   "AND c.is_active=true AND c.start_on<=$2::date AND c.end_on>=$2::date",
   "ORDER BY c.id LIMIT 2"
  ]).join(" "),[memberId,onDate])
 ]);
 if(Number(assignments.rows[0]?.team_count)>1)
  throw Error("member-availability-multiple-teams");
 const assignmentApplicable=Number(assignments.rows[0]?.team_count)===1;
 const day=resolveCalendarDay(weeks.rows,exceptions.rows,onDate);
 const countryIso2=locations.rows[0]?.country_iso2??null;
 let nationalHoliday:boolean|null=null;
 let nationalHolidayName:string|null=null;
 let nationalCalendarStatus:DayAvailability["nationalCalendarStatus"]="unknown";
 if(countryIso2!==null){
  const national=await db.query<{name:string|null;status:string|null}>([
   "SELECT h.name,c.status FROM (SELECT 1) marker",
   "LEFT JOIN public.smn_national_holiday h ON h.country_code=$1 AND h.holiday_date=$2::date",
   "LEFT JOIN public.smn_national_calendar_coverage c ON c.country_code=$1",
   "AND c.calendar_year=EXTRACT(YEAR FROM $2::date)::integer"
  ].join(" "),[countryIso2,onDate]);
  const found=national.rows[0];
  nationalHolidayName=found?.name??null;
  if(["configured","partial","not-configured","invalid"].includes(found?.status??""))
   nationalCalendarStatus=found!.status as DayAvailability["nationalCalendarStatus"];
  if(nationalHolidayName!==null)nationalHoliday=true;
  else if(nationalCalendarStatus==="configured")nationalHoliday=false;
 }
 const companyClosureName=closures.rows[0]?.name??null;
 const resolved=resolveDayAvailability(onDate,day.slots,nationalHoliday,absences,
  companyClosureName!==null);
 return {onDate,countryIso2,assignmentApplicable,nationalHoliday,nationalHolidayName,companyClosureName,
  nationalCalendarStatus,workingSlots:day.slots,...resolved};
}
