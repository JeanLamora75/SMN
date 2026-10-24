/**
 * Only process already authorized administrator calendar data.
 * The collective response never contains these member objects.
 */
export type CalendarAbsentMember={
 id:string;
 displayName:string;
 days:ReadonlyArray<{date:string;hasDeclaredAbsence:boolean}>;
};

/** Unique member per civil day, even with multiple records or assignments. */
export function absenceNamesByDate(
 members:ReadonlyArray<CalendarAbsentMember>|undefined
):Record<string,string[]>{
 if(!members)return {};
 const byDay=new Map<string,Map<string,string>>();
 for(const member of members){
  if(!member.id||!member.displayName.trim())continue;
  for(const day of member.days){
   if(!day.hasDeclaredAbsence)continue;
   let people=byDay.get(day.date);
   if(!people){people=new Map();byDay.set(day.date,people);}
   people.set(member.id,member.displayName);
  }
 }
 return Object.fromEntries([...byDay].map(([date,people])=>[
  date,[...people.values()].sort((a,b)=>a.localeCompare(b,"fr",{sensitivity:"base"}))
 ]));
}
