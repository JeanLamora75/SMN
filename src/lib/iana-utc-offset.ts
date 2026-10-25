/** Format an IANA time zone's UTC offset at the supplied instant (including DST). */
export function utcOffsetLabel(zone:string,at:Date=new Date()):string{
 try{
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:zone,timeZoneName:"longOffset"}).formatToParts(at);
  const raw=parts.find(part=>part.type==="timeZoneName")?.value??"";
  if(raw==="GMT"||raw==="UTC")return "UTC+00:00";
  const match=/^(?:GMT|UTC)([+-])(\d{1,2})(?::(\d{2}))?$/.exec(raw);
  if(!match)return "UTC";
  return "UTC"+match[1]+match[2].padStart(2,"0")+":"+(match[3]??"00");
 }catch{return "UTC";}
}
