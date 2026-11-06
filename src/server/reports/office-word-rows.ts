import type {Client} from "pg";
import type {ReportIndicatorValue} from "./dynamic-indicators";
import {formatScalarNumber} from "../../../scripts/smn-399-office-scalars.mjs";

export type OfficeWordRows=Record<string,string|null>[];
type Locale="fr"|"en";
type MemberRow={
 name:string;role:string|null;start_on:string;end_on:string|null
};
function dateLabel(value:string|null,locale:Locale):string|null{
 if(!value)return null;
 const date=new Date(value.slice(0,10)+"T12:00:00Z");
 if(!Number.isFinite(date.getTime()))return null;
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  timeZone:"UTC",dateStyle:"medium"
 }).format(date);
}
/** Only assignments overlapping the requested authorized sprint can appear. */
export async function readOfficeWordMembers(db:Client,teamId:string,cycleId:string,
 locale:Locale):Promise<OfficeWordRows>{
 const members=await db.query<MemberRow>(`
  SELECT DISTINCT ON (m.id) m.display_name AS name,
   m.professional_function AS role,
   a.start_on::text AS start_on,a.end_on::text AS end_on
  FROM public.smn_member_assignment a
  JOIN public.smn_member m ON m.id=a.member_id
  JOIN public.smn_team t ON t.id=a.team_id AND t.installation_id=m.installation_id
  JOIN public.smn_sprint s ON s.id=$2 AND s.team_id=t.id AND s.deleted_at IS NULL
  WHERE a.team_id=$1 AND t.installation_id='singleton'
    AND a.start_on <= (s.end_at AT TIME ZONE s.time_zone)::date
    AND (a.end_on IS NULL OR a.end_on >= (s.start_at AT TIME ZONE s.time_zone)::date)
  ORDER BY m.id,a.start_on DESC,a.id DESC
  LIMIT 10001`,[teamId,cycleId]);
 if(members.rows.length>10000)throw Error("office-table-resource-limit");
 return members.rows.sort((a,b)=>a.name.localeCompare(b.name,locale)).map(member=>({
  MEMBER_NAME:member.name,
  MEMBER_ROLE:member.role,
  MEMBER_START:dateLabel(member.start_on,locale),
  MEMBER_END:dateLabel(member.end_on,locale)
 }));
}
export function officeWordIndicatorRows(indicators:readonly ReportIndicatorValue[],locale:Locale):OfficeWordRows{
 return indicators.map(indicator=>({
  INDICATOR_NAME:indicator.name,
  INDICATOR_TAG:indicator.tag,
  INDICATOR_VALUE:indicator.available?formatScalarNumber(indicator.value,locale):null,
  INDICATOR_UNIT:indicator.unit
 }));
}
