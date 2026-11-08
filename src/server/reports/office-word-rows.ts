import type {Client} from "pg";
import type {ReportIndicatorValue} from "./dynamic-indicators";
import {formatScalarNumber} from "../../../scripts/smn-399-office-scalars.mjs";

export type OfficeWordRows=Record<string,string|null>[];
type Locale="fr"|"en";
type MemberRow={
 name:string;role:string|null;start_on:string;end_on:string|null;
 city:string|null;country_iso2:string|null
};
export function officeCountryFlag(country:string|null):string|null{
 if(!country||! /^[A-Z]{2}$/.test(country))return null;
 return [...country].map(letter=>String.fromCodePoint(0x1f1e6+letter.charCodeAt(0)-65)).join("");
}
export function officeCountryName(country:string|null,locale:Locale):string|null{
 if(!country||! /^[A-Z]{2}$/.test(country))return null;
 const label=new Intl.DisplayNames([locale==="fr"?"fr-FR":"en-GB"],{type:"region",fallback:"none"}).of(country);
 return label??null;
}
function dateLabel(value:string|null,locale:Locale):string|null{
 if(!value)return null;
 const date=new Date(value.slice(0,10)+"T12:00:00Z");
 if(!Number.isFinite(date.getTime()))return null;
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  timeZone:"UTC",dateStyle:"medium"
 }).format(date);
}
/** Date intervals of member assignments are inclusive, unlike sprint end_at. */
export function splitOfficeMembersByAssignment<T extends {start_on:string;end_on:string|null}>(
 members:readonly T[],sprintLastDay:string
):{active:T[];inactive:T[]}{
 return {
  active:members.filter(m=>m.start_on<=sprintLastDay&&
   (m.end_on===null||m.end_on>=sprintLastDay)),
  inactive:members.filter(m=>m.start_on<=sprintLastDay&&
   m.end_on!==null&&m.end_on<sprintLastDay)
 };
}
export type OfficeMemberGroups={active:OfficeWordRows;inactive:OfficeWordRows};
/** Read the latest team assignment per member as of the selected sprint's last day.
 * Former team members are included in the inactive list, even if they left before its start.
 */
export async function readOfficeMemberGroups(db:Client,teamId:string,cycleId:string,
 locale:Locale):Promise<OfficeMemberGroups>{
 const members=await db.query<MemberRow>(`
  SELECT DISTINCT ON (m.id) m.display_name AS name,
   m.professional_function AS role,
   a.start_on::text AS start_on,a.end_on::text AS end_on,
   loc.city,loc.country_iso2
  FROM public.smn_member_assignment a
  JOIN public.smn_member m ON m.id=a.member_id
  JOIN public.smn_team t ON t.id=a.team_id AND t.installation_id=m.installation_id
  JOIN public.smn_sprint s ON s.id=$2 AND s.team_id=t.id AND s.deleted_at IS NULL
  LEFT JOIN LATERAL (
   SELECT ml.city,ml.country_iso2 FROM public.smn_member_location ml
   WHERE ml.member_id=m.id AND ml.effective_from <
      (s.end_at AT TIME ZONE s.time_zone)::date
   ORDER BY ml.effective_from DESC,ml.revision DESC LIMIT 1
  ) loc ON true
  WHERE a.team_id=$1 AND t.installation_id='singleton'
    AND a.start_on < (s.end_at AT TIME ZONE s.time_zone)::date
  ORDER BY m.id,a.start_on DESC,a.id DESC
  LIMIT 10001`,[teamId,cycleId]);
 if(members.rows.length>10000)throw Error("office-table-resource-limit");
 const until=await db.query<{last_day:string}>(`
  SELECT ((s.end_at AT TIME ZONE s.time_zone)::date-1)::text AS last_day
  FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  WHERE s.id=$2 AND s.team_id=$1 AND s.deleted_at IS NULL
    AND t.installation_id='singleton' LIMIT 1`,[teamId,cycleId]);
 const lastDay=until.rows[0]?.last_day;
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(lastDay??""))throw Error("office-members-invalid-cycle");
 const projected=(member:MemberRow)=>({
  MEMBER_NAME:member.name,
  MEMBER_ROLE:member.role,
  MEMBER_FUNCTION:member.role,
  MEMBER_START:dateLabel(member.start_on,locale),
  MEMBER_END:dateLabel(member.end_on,locale),
  MEMBER_CITY:member.city,
  MEMBER_COUNTRY:officeCountryName(member.country_iso2,locale),
  MEMBER_FLAG:officeCountryFlag(member.country_iso2)
 });
 const group=splitOfficeMembersByAssignment(members.rows,lastDay);
 const order=(a:MemberRow,b:MemberRow)=>a.name.localeCompare(b.name,locale);
 return {
  active:group.active.sort(order).map(projected),
  inactive:group.inactive.sort(order).map(projected)
 };
}
/** Legacy reader retained for existing integrations; templates should select a specific group. */
export async function readOfficeWordMembers(db:Client,teamId:string,cycleId:string,
 locale:Locale):Promise<OfficeWordRows>{
 const groups=await readOfficeMemberGroups(db,teamId,cycleId,locale);
 return [...groups.active,...groups.inactive];
}
export function officeWordIndicatorRows(indicators:readonly ReportIndicatorValue[],locale:Locale):OfficeWordRows{
 return indicators.map(indicator=>({
  INDICATOR_NAME:indicator.name,
  INDICATOR_TAG:indicator.tag,
  INDICATOR_VALUE:indicator.available?formatScalarNumber(indicator.value,locale):null,
  INDICATOR_UNIT:indicator.unit
 }));
}
