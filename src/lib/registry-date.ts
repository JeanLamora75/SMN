/** Date civile ISO sans conversion via le fuseau local du navigateur. */
export function formatRegistryDate(iso:string|null|undefined,locale:"fr"|"en"):string{
 if(!iso)return "";
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
 if(!match)return iso;
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 const timestamp=Date.UTC(year,month-1,day);
 const value=new Date(timestamp);
 if(value.getUTCFullYear()!==year||value.getUTCMonth()!==month-1||
  value.getUTCDate()!==day)return iso;
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  timeZone:"UTC",day:"numeric",month:"short",year:"numeric"
 }).format(value);
}
