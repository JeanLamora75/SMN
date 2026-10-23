import type {Client} from "pg";
import {automaticHighlightCategories,defaultHighlightCategories,validHighlightConfiguration} from "@/lib/automatic-highlights";
export async function readAutomaticHighlightSettings(db:Client){
 const t=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_automatic_highlight_settings') IS NOT NULL AS present`);
 if(!t.rows[0]?.present)return {categories:defaultHighlightCategories,revision:0};
 const r=await db.query<{category:string;enabled:boolean;revision:number}>(`SELECT category,enabled,revision FROM public.smn_automatic_highlight_settings WHERE installation_id='singleton'`);
 return {categories:{...defaultHighlightCategories,...Object.fromEntries(r.rows.filter(x=>automaticHighlightCategories.some(k=>k===x.category)).map(x=>[x.category,x.enabled]))},revision:Math.max(0,...r.rows.map(x=>x.revision))};
}
export async function saveAutomaticHighlightSettings(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="categories,revision"||!validHighlightConfiguration(v.categories)||
 !Number.isSafeInteger(v.revision)||Number(v.revision)<0||!actorId)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const i=await db.query(`SELECT id FROM public.smn_installation WHERE id='singleton' AND state='initialized' FOR UPDATE`);
  if(i.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await db.query(`CREATE TABLE IF NOT EXISTS public.smn_automatic_highlight_settings(
   installation_id text NOT NULL REFERENCES public.smn_installation(id),
   category text NOT NULL CHECK(category IN ('criticalRisk','atRiskDependency','resolvedObstacle','achievedGoal','recordedDecision','satisfiedDependency')),
   enabled boolean NOT NULL,revision integer NOT NULL CHECK(revision>0),
   updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
   updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(installation_id,category))`);
  const existing=await db.query<{revision:number}>(`SELECT revision FROM public.smn_automatic_highlight_settings
   WHERE installation_id='singleton' FOR UPDATE`);
  const revision=existing.rows[0]?.revision??0;
  if(existing.rows.some(x=>x.revision!==revision)||revision!==v.revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  for(const category of automaticHighlightCategories){
   await db.query(`INSERT INTO public.smn_automatic_highlight_settings(installation_id,category,enabled,revision,updated_by)
    VALUES('singleton',$1,$2,$3,$4)
    ON CONFLICT(installation_id,category) DO UPDATE SET enabled=EXCLUDED.enabled,revision=EXCLUDED.revision,
    updated_by=EXCLUDED.updated_by,updated_at=now()`,[category,v.categories[category],revision+1,actorId]);
  }
  await db.query("COMMIT");return {ok:true as const,revision:revision+1,categories:v.categories};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
