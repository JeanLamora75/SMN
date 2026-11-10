// SMN-428: pure, read-only selection policy for a verified recovery point.
// The caller must obtain fresh evidence by re-reading and checking archive bytes.
const WINDOW=24*60*60*1000;
export function selectUpdateRecoveryPoint(entries,now=Date.now()){
 if(!Array.isArray(entries)||!Number.isFinite(now))return null;
 return entries.find(entry=>{
  const stamp=entry?.createdAt&&Date.parse(entry.createdAt);
  const age=typeof stamp==="number"?now-stamp:NaN;
  return entry?.status==="verified"&&entry.integrityVerified===true&&
   entry.scopeComplete===true&&
   Array.isArray(entry.components)&&entry.components.some(c=>c?.kind==="database")&&
   typeof entry.id==="string"&&
   /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(entry.id)&&
   Number.isFinite(age)&&age>=0&&age<=WINDOW;
 })??null;
}
