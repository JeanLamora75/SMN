export type MonthPosition={year:number;month:number};

/** Months are zero-based; dates are civil ISO dates, unaffected by browser timezone. */
export function isoCivilDate(year:number,month:number,day:number):string{
 return String(year).padStart(4,"0")+"-"+String(month+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
}
export function daysInMonth(year:number,month:number):number{
 return new Date(Date.UTC(year,month+1,0)).getUTCDate();
}
export function mondayFirstMonthCells(year:number,month:number):(number|null)[]{
 if(!Number.isInteger(year)||year<1900||year>2200||!Number.isInteger(month)||month<0||month>11)
  throw new Error("invalid-calendar-month");
 const offset=(new Date(Date.UTC(year,month,1)).getUTCDay()+6)%7;
 const length=daysInMonth(year,month);
 const cells:(number|null)[]=Array(offset).fill(null);
 for(let day=1;day<=length;day++)cells.push(day);
 while(cells.length%7!==0)cells.push(null);
 return cells;
}
export function moveCalendarMonth(position:MonthPosition,step:-1|1):MonthPosition{
 let year=position.year,month=position.month+step;
 if(month<0){year--;month=11;}
 if(month>11){year++;month=0;}
 if(year<1900||year>2200)return position;
 return {year,month};
}


export type CalendarHoliday={date:string;name:string};
/** Reject stale or cross-year API content before rendering a different year. */
export function scopedYearHolidays(value:unknown,country:string,year:number):CalendarHoliday[]|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const payload=value as Record<string,unknown>;
 if(payload.country!==country||payload.year!==year||!Array.isArray(payload.holidays))return null;
 const result=payload.holidays as unknown[];
 const prefix=String(year)+"-";
 if(!result.every(item=>item!==null&&typeof item==="object"&&!Array.isArray(item)&&
  typeof (item as Record<string,unknown>).date==="string"&&
  /^\d{4}-\d{2}-\d{2}$/.test((item as Record<string,string>).date)&&
  (item as Record<string,string>).date.startsWith(prefix)&&
  typeof (item as Record<string,unknown>).name==="string"))return null;
 return result as CalendarHoliday[];
}
