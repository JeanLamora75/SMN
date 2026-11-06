import {absenceOnDate} from "../members/absence";

export type DisplayAbsence=Readonly<{
 halfDays:1|2;
 category:string;
 isPlanned:boolean;
 reason:string;
}>;
type Slots={morning:boolean;afternoon:boolean};
export type DisplayAbsenceSource=Readonly<{
 start_on:string;end_on:string;start_slot:"morning"|"afternoon";end_slot:"morning"|"afternoon";
 is_planned:boolean;category_name:string|null;reason:string|null;
}>;

/** Only assigned working half-days reduced by absences count. Holidays, closures and
 * weekends have priority. Two overlapping records never count the same slot twice. */
export function eligibleAbsenceItems(date:string,working:Slots|null,
 nationalHoliday:boolean,companyClosure:boolean,
 absences:readonly DisplayAbsenceSource[]):DisplayAbsence[]{
 const weekday=new Date(date+"T00:00:00Z").getUTCDay();
 if(!working||weekday===0||weekday===6||nationalHoliday||companyClosure)return [];
 const taken:Slots={morning:false,afternoon:false};
 const items:DisplayAbsence[]=[];
 for(const a of absences){
  const slots=absenceOnDate({startOn:a.start_on,endOn:a.end_on,
   startSlot:a.start_slot,endSlot:a.end_slot},date);
  const morning=slots.morning&&working.morning&&!taken.morning;
  const afternoon=slots.afternoon&&working.afternoon&&!taken.afternoon;
  const halfDays=Number(morning)+Number(afternoon);
  if(!halfDays)continue;
  if(morning)taken.morning=true;
  if(afternoon)taken.afternoon=true;
  items.push({halfDays:halfDays as 1|2,category:a.category_name??"",
   isPlanned:a.is_planned,reason:a.reason??""});
 }
 return items;
}
