import type {Client} from "pg";

export type SprintIndexSort="priority"|"newest"|"oldest";
export type SprintIndexQuery={page:number;pageSize:number;search:string;status:string;sort:SprintIndexSort};
export type SprintIndexItem={
 id:string;name:string;status:string;suspended:boolean;
 startAt:string;endAt:string;timeZone:string;stateMayBeStale:boolean;
};
const validStatus=/^[a-z][a-z0-9_-]{0,39}$/;

/** Validation stricte : ni tri SQL arbitraire ni recherche non bornée. */
export function parseSprintIndexQuery(params:URLSearchParams):SprintIndexQuery|null {
 const allowed=new Set(["page","pageSize","search","status","sort"]);
 if([...params.keys()].some(k=>!allowed.has(k)))return null;
 const pageValue=params.get("page")??"1";
 const sizeValue=params.get("pageSize")??"25";
 if(!/^[1-9]\d*$/.test(pageValue)||!/^(?:[1-9]|[1-4]\d|50)$/.test(sizeValue))return null;
 const page=Number(pageValue),pageSize=Number(sizeValue);
 if(!Number.isSafeInteger(page)||page>100000)return null;
 const search=params.get("search")??"";
 if(search.length>100||/[\x00-\x1f\x7f]/.test(search))return null;
 const status=params.get("status")??"all";
 if(status!=="all"&&!validStatus.test(status))return null;
 const sort=params.get("sort")??"priority";
 if(sort!=="priority"&&sort!=="newest"&&sort!=="oldest")return null;
 return {page,pageSize,search:search.trim(),status,sort};
}

type SprintRow={
 id:string;name:string;status:string;auto_suspended:boolean;
 start_at:Date;end_at:Date;time_zone:string;
};
const order:Record<SprintIndexSort,string>={
 priority:"CASE WHEN s.status='active' AND NOT s.auto_suspended AND s.start_at<=now() AND s.end_at>now() THEN 0 ELSE 1 END, s.start_at DESC, s.id DESC",
 newest:"s.start_at DESC, s.id DESC",
 oldest:"s.start_at ASC, s.id ASC"
};

/** Consultation sans DDL, sans reconcileSprintStates, sans trigger d'ouverture.
 * La réconciliation reste l'opération métier existante sur l'ancienne API. */
export async function readSprintIndex(db:Client,query:SprintIndexQuery){
 const team=await db.query<{id:string;name:string}>(`
 SELECT t.id,t.name FROM public.smn_team t
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(team.rows.length!==1)throw Error("scrum-team-unavailable");
 const {id:teamId,name:teamName}=team.rows[0];
 const filter=`s.team_id=$1 AND s.deleted_at IS NULL
  AND ($2::text='' OR strpos(lower(s.name),lower($2::text))>0)
  AND ($3::text='all' OR CASE WHEN s.auto_suspended THEN 'suspended' ELSE s.status END=$3::text)`;
 const params=[teamId,query.search,query.status];
 const count=await db.query<{total:number}>(`SELECT count(*)::integer AS total
  FROM public.smn_sprint s WHERE ${filter}`,params);
 const total=count.rows[0]?.total??0;
 const totalPages=Math.max(1,Math.ceil(total/query.pageSize));
 const page=Math.min(query.page,totalPages);
 const statuses=await db.query<{status:string}>(`SELECT DISTINCT
  CASE WHEN s.auto_suspended THEN 'suspended' ELSE s.status END AS status
  FROM public.smn_sprint s WHERE s.team_id=$1 AND s.deleted_at IS NULL`,[teamId]);
 const rows=await db.query<SprintRow>(`SELECT s.id,s.name,s.status,s.auto_suspended,s.start_at,s.end_at,s.time_zone
  FROM public.smn_sprint s WHERE ${filter}
  ORDER BY ${order[query.sort]} LIMIT $4 OFFSET $5`,
  [...params,query.pageSize,(page-1)*query.pageSize]);
 const now=Date.now();
 const items:SprintIndexItem[]=rows.rows.map(s=>{
  const from=new Date(s.start_at).getTime(),until=new Date(s.end_at).getTime();
  return {
   id:s.id,name:s.name,status:s.status,suspended:s.auto_suspended,
   startAt:new Date(s.start_at).toISOString(),endAt:new Date(s.end_at).toISOString(),
   timeZone:s.time_zone,
   stateMayBeStale:!s.auto_suspended&&(
    s.status==="planned"&&from<=now || s.status==="active"&&(from>now||until<=now))
  };
 });
 const activeCount=items.filter(s=>s.status==="active"&&!s.suspended).length;
 return {teamName,items,total,page,pageSize,totalPages,
  statuses:statuses.rows.map(s=>s.status).sort(),activeCount};
}
