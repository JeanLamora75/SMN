export const REPORT_LOGO_MAX_BYTES=256*1024;
export type ReportLogo={mime:"image/png"|"image/jpeg";base64:string};
export function validReportLogo(input:unknown):input is ReportLogo{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const r=input as Record<string,unknown>;
 if((r.mime!=="image/png"&&r.mime!=="image/jpeg")||typeof r.base64!=="string"||!r.base64||r.base64.length>Math.ceil(REPORT_LOGO_MAX_BYTES/3)*4+4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(r.base64))return false;
 const bytes=Buffer.from(r.base64,"base64");
 if(bytes.length>REPORT_LOGO_MAX_BYTES||bytes.length<12||bytes.toString("base64")!==r.base64)return false;
 return r.mime==="image/png"?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
 bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
}
