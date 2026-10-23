import {defaultSectionOptions,validSectionOptions} from "@/lib/report-section-options";
import {defaultReportContentOptions,validReportContentOptions} from "@/lib/report-content-options";
export const STANDARD_REPORT_TEMPLATE_ID="standard";
export type ReportTemplate={id:string;name:string;protected:boolean;sections:ReturnType<typeof defaultSectionOptions>;content:ReturnType<typeof defaultReportContentOptions>};
export function standardReportTemplate():ReportTemplate{return {
 id:STANDARD_REPORT_TEMPLATE_ID,name:"Standard",protected:true,
 sections:defaultSectionOptions(),content:defaultReportContentOptions()
};}
export function validReportTemplate(v:unknown):v is ReportTemplate{
 if(!v||typeof v!=="object"||Array.isArray(v))return false;
 const x=v as Record<string,unknown>;
 return typeof x.id==="string"&&x.id.length>0&&typeof x.name==="string"&&x.name.trim().length>0&&x.name.length<=120&&
 x.protected===false&&validSectionOptions(x.sections)&&validReportContentOptions(x.content);
}
export function mayDeleteReportTemplate(id:string){return id!==STANDARD_REPORT_TEMPLATE_ID;}
