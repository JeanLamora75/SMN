/** Display day-only business dates without timezone shifts (ISO value remains unchanged). */
export function formatRegistryDate(value:string,locale:"fr"|"en"):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const [year,month,day]=value.split("-").map(Number);
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)
  return value;
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  day:"numeric",month:"short",year:"numeric",timeZone:"UTC"
 }).format(date);
}
