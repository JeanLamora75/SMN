import {scopedYearHolidays,type CalendarHoliday} from "./month-grid";

export type YearSnapshot={
 country:string;year:number;holidays:CalendarHoliday[];
 fingerprint:string;revision:number;
 status:"configured"|"partial"|"not-configured"|"invalid"|null;
 administrativeValidated:boolean;
};

export function isCivilDate(value:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [year,month,day]=value.split("-").map(Number);
 if(year<1900||year>2200||month<1||month>12||day<1||day>31)return false;
 const actual=new Date(Date.UTC(year,month-1,day));
 return actual.getUTCFullYear()===year&&actual.getUTCMonth()===month-1&&actual.getUTCDate()===day;
}

/** Trust only the server's own annual revision and fingerprint, not a client-generated hash. */
export function parseYearSnapshot(value:unknown,country:string,year:number):YearSnapshot|null{
 const holidays=scopedYearHolidays(value,country,year);
 if(!holidays||holidays.some(h=>!isCivilDate(h.date)||h.name.trim().length===0))return null;
 const item=value as Record<string,unknown>;
 if(typeof item.fingerprint!=="string"||!/^[a-f0-9]{64}$/.test(item.fingerprint)||
   !Number.isSafeInteger(item.revision)||Number(item.revision)<0 ||
   ![null,"configured","partial","not-configured","invalid"].includes(item.status as string|null)||
   typeof item.administrativeValidated!=="boolean")return null;
 return {country,year,holidays,fingerprint:item.fingerprint as string,
  revision:item.revision as number,status:item.status as YearSnapshot["status"],
  administrativeValidated:item.administrativeValidated as boolean};
}

export function affectedYears(originalDate:string|null,date:string|null):number[]{
 return [...new Set([originalDate,date].filter((s):s is string=>s!==null)
  .map(s=>Number(s.slice(0,4))))].sort((a,b)=>a-b);
}
