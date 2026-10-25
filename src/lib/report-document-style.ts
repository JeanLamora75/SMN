export type ReportDocumentStyle={orientation:"portrait"|"landscape";cover:boolean;toc:boolean;coverTitle:string;subtitle:string;footerText:string};
export const defaultReportDocumentStyle=():ReportDocumentStyle=>({orientation:"portrait",cover:false,toc:false,coverTitle:"",subtitle:"",footerText:""});
export function reportDocumentStyle(raw:unknown):ReportDocumentStyle{
 const d=defaultReportDocumentStyle();
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return d;
 const v=raw as Record<string,unknown>;
 const text=(k:keyof ReportDocumentStyle,max:number)=>typeof v[k]==="string"?(v[k] as string).slice(0,max):"";
 return {orientation:v.orientation==="landscape"?"landscape":"portrait",cover:v.cover===true,toc:v.toc===true,coverTitle:text("coverTitle",120),subtitle:text("subtitle",200),footerText:text("footerText",200)};
}
