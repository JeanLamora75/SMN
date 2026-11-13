import {isCompletedTicketStatus,validateTicketCsv,type TicketCsvRow} from "./ticket-csv-contract";
import {summarizeTicketRows,type TicketSummaryScopes} from "./ticket-csv-summary";

export type TicketBrowseSort="jiraId"|"issueType"|"title"|"priority"|"status"|"storyPoints";
export type TicketBrowseDirection="asc"|"desc";
export type TicketBrowseFilters=Readonly<{
 search?:string;issueType?:string;status?:string;priority?:string;
 prefix?:string;sort?:TicketBrowseSort;direction?:TicketBrowseDirection;
 page?:number;pageSize?:number;
}>;
export type TicketBrowseRow=Pick<TicketCsvRow,"line"|"jiraId"|"issueType"|"title"|"priority"|"status"|"storyPoints"> & {
 prefix:string;completed:boolean;
};
export type TicketBrowseResult={
 rows:TicketBrowseRow[];total:number;page:number;pageSize:number;pageCount:number;
 sourceCount:number;
 summary:TicketSummaryScopes;
 facets:{issueTypes:string[];statuses:string[];priorities:string[];prefixes:string[]};
};

export function jiraPrefix(id:string):string {
 const index=id.indexOf("-");
 return index>0?id.slice(0,index):"";
}
function storyPointsValue(value:string):number|null {
 const normalized=value.trim().replace(",",".");
 if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized))return null;
 const amount=Number(normalized);
 return Number.isFinite(amount)?amount:null;
}
function normalize(value:string):string {
 return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().trim();
}
function unique(items:string[]):string[] {
 return [...new Set(items)].sort((a,b)=>a.localeCompare(b,"fr",{sensitivity:"base",numeric:true}));
}
export function browseTicketCsv(csv:string,filters:TicketBrowseFilters={}):TicketBrowseResult {
 const result=validateTicketCsv(csv);
 if(!result.valid)throw new Error("tickets-invalid-csv");
 const all:TicketBrowseRow[]=result.rows.map(row=>({
  line:row.line,jiraId:row.jiraId,issueType:row.issueType,title:row.title,
  priority:row.priority,status:row.status,storyPoints:row.storyPoints,
  prefix:jiraPrefix(row.jiraId),completed:isCompletedTicketStatus(row.status),
 }));
 const search=normalize(filters.search??"").slice(0,120);
 const filtered=all.filter(row=>{
  if(filters.issueType&&row.issueType!==filters.issueType)return false;
  if(filters.status&&row.status!==filters.status)return false;
  if(filters.priority&&row.priority!==filters.priority)return false;
  if(filters.prefix&&row.prefix!==filters.prefix)return false;
  if(!search)return true;
  return [row.jiraId,row.issueType,row.title,row.priority,row.status,row.storyPoints]
   .some(value=>normalize(value).includes(search));
 });
 // Both scopes are calculated before pagination: never summarize only the visible page.
 const summary:TicketSummaryScopes={all:summarizeTicketRows(all),filtered:summarizeTicketRows(filtered)};
 const sort=filters.sort??"jiraId",direction=filters.direction==="desc"?-1:1;
 filtered.sort((a,b)=>{
  if(sort==="storyPoints"){
   const av=storyPointsValue(a.storyPoints),bv=storyPointsValue(b.storyPoints);
   if(av===null&&bv!==null)return 1;
   if(bv===null&&av!==null)return -1;
   if(av!==null&&bv!==null&&av!==bv)return (av-bv)*direction;
  }
  const cmp=a[sort].localeCompare(b[sort],"fr",{numeric:true,sensitivity:"base"});
  return cmp===0?a.jiraId.localeCompare(b.jiraId,"fr",{numeric:true}):cmp*direction;
 });
 const pageSize=filters.pageSize===25||filters.pageSize===100?filters.pageSize:50;
 const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
 const requested=Number.isSafeInteger(filters.page)?filters.page!:1;
 const page=Math.max(1,Math.min(pageCount,requested));
 return {
  rows:filtered.slice((page-1)*pageSize,page*pageSize),
  total:filtered.length,page,pageSize,pageCount,sourceCount:all.length,summary,
  facets:{
   issueTypes:unique(all.map(r=>r.issueType).filter(Boolean)),
   statuses:unique(all.map(r=>r.status).filter(Boolean)),
   priorities:unique(all.map(r=>r.priority).filter(Boolean)),
   prefixes:unique(all.map(r=>r.prefix).filter(Boolean)),
  },
 };
}
