import type {Client} from "pg";
export type Lunch={start:string;end:string;revision:number};
const valid=(s:unknown):s is string=>typeof s==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export async function ensureLunchSchema(db:Client){
 const tables=["smn_scrum_lunch"] as const;
 const state=await db.query<{present:string[]}>(`SELECT array_agg(c.relname)::text[] AS present FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname = ANY($1::text[]) AND c.relkind IN ('r','p')`,[tables]);
 if(tables.some(name=>!state.rows[0]?.present?.includes(name)))throw Error("ceremony-schema-not-ready: apply-ceremony-schema-v32");
}
export async function lunchForTeam(db:Client,teamId:string):Promise<Lunch>{
 await ensureLunchSchema(db);
 await db.query("INSERT INTO public.smn_scrum_lunch(team_id) VALUES($1) ON CONFLICT DO NOTHING",[teamId]);
 const r=await db.query<{start_time:string;end_time:string;revision:number}>("SELECT start_time::text,end_time::text,revision FROM public.smn_scrum_lunch WHERE team_id=$1",[teamId]);
 const v=r.rows[0];if(!v)throw Error("lunch-unavailable");
 return {start:v.start_time.slice(0,5),end:v.end_time.slice(0,5),revision:v.revision};
}
export async function updateLunch(db:Client,teamId:string,input:unknown){
 if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false as const,error:"invalid-input" as const};
 const o=input as Record<string,unknown>;
 if(Object.keys(o).length!==3||!valid(o.start)||!valid(o.end)||o.start>=o.end||!Number.isSafeInteger(o.revision)||Number(o.revision)<1)return {ok:false as const,error:"invalid-input" as const};
 await ensureLunchSchema(db);await db.query("BEGIN");
 try{
  await lunchForTeam(db,teamId);
  const r=await db.query<{revision:number}>(`UPDATE public.smn_scrum_lunch SET start_time=$2,end_time=$3,revision=revision+1,updated_at=now()
  WHERE team_id=$1 AND revision=$4 RETURNING revision`,[teamId,o.start,o.end,o.revision]);
  if(!r.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  await db.query("COMMIT");return {ok:true as const,lunch:{start:o.start,end:o.end,revision:r.rows[0].revision}};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
