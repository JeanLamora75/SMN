export function formatReportCenterDate(value:string,locale:string):string{
 const normalized=value.trim().replace(" ","T")
  .replace(/(\.\d{3})\d+/, "$1")
  .replace(/([+-]\d{2})$/, "$1:00");
 const parsed=new Date(normalized);
 if(!Number.isFinite(parsed.getTime()))return "—";
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",
  timeZone:"Europe/Paris"
 }).format(parsed);
}
