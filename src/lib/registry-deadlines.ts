export type DeadlineState="upcoming"|"overdue"|null;
export function deadlineState(type:string,status:string,dueOn:string|null,today:string,days=3):DeadlineState{
 if(!dueOn||!/^\d{4}-\d{2}-\d{2}$/.test(dueOn)||!Number.isInteger(days)||days<0)return null;
 if(!((type==="action"&&(status==="todo"||status==="in_progress"))||
 (type==="dependency"&&(status==="open"||status==="in_progress"))))return null;
 const start=Date.parse(today+"T00:00:00Z"),end=Date.parse(dueOn+"T00:00:00Z");
 if(!Number.isFinite(start)||!Number.isFinite(end))return null;
 const diff=Math.round((end-start)/86400000);
 return diff<0?"overdue":diff<=days?"upcoming":null;
}
