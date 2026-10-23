/** Explicit collective-only projection of report preview records. No recursive object-spreading of database rows. */
export type CollectiveReportContext={id:string;name:string;team:string;product:string|null;startAt:string;endAt:string;status:string;timeZone:string};
export type CollectiveReportItem={label:string;detail:string;href:string|null};
export const safeCollectiveContext=(raw:CollectiveReportContext):CollectiveReportContext=>({
 id:raw.id,name:raw.name,team:raw.team,product:raw.product,startAt:raw.startAt,endAt:raw.endAt,status:raw.status,timeZone:raw.timeZone
});
export const safeCollectiveItems=(items:readonly CollectiveReportItem[]):CollectiveReportItem[]=>
 items.map(x=>({label:x.label,detail:x.detail,href:x.href}));
/** Never surface employee records through the reporting API even when a caller supplies them. */
export function projectCollectiveFacts<T extends {id:string;title:string;status:string;ownerName?:string|null;hidden?:boolean;invalidated?:boolean}>(
 source:readonly T[],allowOwners:boolean
){
 return source.filter(x=>!x.hidden&&!x.invalidated).map(x=>({
 id:x.id,title:x.title,status:x.status,...(allowOwners&&x.ownerName?{ownerName:x.ownerName}:{})
 }));
}
export const reportExportAllowed=(kind:string):boolean=>kind==="html"||kind==="pdf";
