import {isReportBlock} from "@/lib/report-studio-blocks";
type Issue={code:"unavailable-data"|"provisional"|"analysis-origin"|"wide-table"|"invalid-block"|"unsupported-pdf-block";severity:"warning"|"error";target:string};
type ReportContent={sections?:Array<{key:string;visible:boolean}>;blocks?:unknown[];metrics?:Record<string,{value:number|null;unit:string}>;analyses?:Array<{origin:string}>;dataSource?:{source:string}};
export function inspectDocumentQuality(raw:unknown):Issue[]{
 const v=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as ReportContent:{};
 const visible=new Set((v.sections??[]).filter(s=>s.visible).map(s=>s.key));
 const issues:Issue[]=[];
 if(v.dataSource?.source==="current")issues.push({code:"provisional",severity:"warning",target:"indicators"});
 if(visible.has("indicators")&&Object.values(v.metrics??{}).some(m=>m.value===null||m.value===undefined))
  issues.push({code:"unavailable-data",severity:"warning",target:"indicators"});
 for(const block of v.blocks??[]){
  if(!isReportBlock(block)){issues.push({code:"invalid-block",severity:"error",target:"blocks"});continue;}
  if(!visible.has(block.sectionKey)||!block.visible)continue;
  if(block.kind==="table"&&block.width==="half")issues.push({code:"wide-table",severity:"warning",target:block.sectionKey});
 }
 if((v.analyses??[]).some(a=>a.origin==="ai"))issues.push({code:"analysis-origin",severity:"warning",target:"analyses"});
 return issues;
}
