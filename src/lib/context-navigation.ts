/** Paramètres de retour entièrement locaux et allowlistés. Aucune URL externe n'est suivie. */
export type DashboardQuery=Readonly<Record<string,string | string[] | undefined>>;
const idPattern=/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const validators:Readonly<Record<string,(value:string)=>boolean>>={
  cycleId:(v)=>idPattern.test(v),
  filter:(v)=>/^[a-zA-Z0-9_-]{1,40}$/.test(v),
  version:(v)=>/^[1-9][0-9]{0,7}$/.test(v),
  asOf:(v)=>/^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v,
};
const order=["cycleId","filter","version","asOf"] as const;
function validId(id:string):boolean{return idPattern.test(id);}

/** Reconstitue une sélection sûre ; l'id d'équipe provient exclusivement de la DB. */
export function dashboardReturnPath(query:DashboardQuery,teamId:string):string{
  if (!validId(teamId))return "/app";
  const params=new URLSearchParams();
  params.set("teamId",teamId);
  for(const key of order){
    const raw=query[key];
    if(typeof raw==="string" && validators[key](raw))params.set(key,raw);
  }
  return "/app?"+params.toString();
}

/** Accepte uniquement la page collective /app ; rejette domaines, fragments, paramètres inattendus et doublons. */
export function safeDashboardReturn(raw:unknown,teamId:string):string{
  if(typeof raw!=="string" || raw.length>512 || !raw.startsWith("/app") ||
      !validId(teamId))return "/app";
  let url:URL;
  try{url=new URL(raw,"http://smn.local");}catch{return "/app";}
  if(url.origin!=="http://smn.local" || url.pathname!=="/app" || url.hash ||
    url.username || url.password)return "/app";
  const data:Record<string,string>={};
  for(const [key,value] of url.searchParams){
    if(key!=="teamId" && !Object.prototype.hasOwnProperty.call(validators,key))return "/app";
    if(Object.prototype.hasOwnProperty.call(data,key))return "/app";
    data[key]=value;
  }
  if(data.teamId!==teamId)return "/app";
  if(order.some(k=>data[k]!==undefined && !validators[k](data[k])))return "/app";
  return dashboardReturnPath(data,teamId);
}

export function teamDetailPath(teamId:string,returnTo:string):string{
  if(!validId(teamId))throw new Error("team-id-invalid");
  const safe=safeDashboardReturn(returnTo,teamId);
  return "/app/team/"+encodeURIComponent(teamId)+"?"+new URLSearchParams({returnTo:safe}).toString();
}

/** Indication de provenance uniquement, aucune validation de snapshot n'est prétendue. */
export function requestedHistoricalContext(returnTo:string):boolean{
  if(!returnTo.startsWith("/app?"))return false;
  const url=new URL(returnTo,"http://smn.local");
  return ["cycleId","version","asOf"].some(k=>url.searchParams.has(k));
}
