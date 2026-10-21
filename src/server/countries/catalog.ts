import type {Client} from "pg";
import {isValidCountry} from "../members/location";
export const COUNTRY_SEEDS=[
 {code:"FR",name:"France"},{code:"DE",name:"Allemagne"},
 {code:"GB",name:"Royaume-Uni"},{code:"ES",name:"Espagne"},
 {code:"PT",name:"Portugal"},{code:"IT",name:"Italie"},
 {code:"CA",name:"Canada"}
] as const;
type Row={code:string;name:string;origin:"initial"|"manual";created_at:string};
export type Country={code:string;name:string;origin:"initial"|"manual";createdAt:string;
 nationalCalendar:{status:"not-configured";holidays:null}};
const project=(r:Row):Country=>({code:r.code,name:r.name,origin:r.origin,
 createdAt:r.created_at,nationalCalendar:{status:"not-configured",holidays:null}});
export function parseCountryInput(input:unknown):{code:string;name:string}|null{
 if(!input||Array.isArray(input)||typeof input!=="object")return null;
 const obj=input as Record<string,unknown>;
 if(Object.keys(obj).length!==2||typeof obj.code!=="string"||typeof obj.name!=="string")return null;
 const code=obj.code.trim().toUpperCase(),name=obj.name.trim().replace(/\s+/gu," ");
 if(!isValidCountry(code)||name.length<1||name.length>120||
  /[\u0000-\u001f\u007f]/u.test(obj.name))return null;
 return {code,name};
}
export async function listCountries(db:Client):Promise<Country[]>{
 const r=await db.query<Row>(`SELECT code,name,origin,created_at::text AS created_at
 FROM public.smn_country ORDER BY code ASC LIMIT 251`);
 if(r.rows.length>250)throw new Error("country-catalog-limit");
 return r.rows.map(project);
}
export async function createCountry(db:Client,actorId:string,raw:unknown){
 const input=parseCountryInput(raw);
 if(!actorId||!input)return {ok:false,error:"invalid-input"} as const;
 await db.query("BEGIN");
 try{
  const r=await db.query<Row>(`INSERT INTO public.smn_country(code,name,origin,created_by)
 VALUES($1,$2,'manual',$3) ON CONFLICT (code) DO NOTHING
 RETURNING code,name,origin,created_at::text AS created_at`,[input.code,input.name,actorId]);
  if(r.rows.length!==1){await db.query("ROLLBACK");return {ok:false,error:"duplicate-code"} as const;}
  await db.query("COMMIT");
  return {ok:true,country:project(r.rows[0])} as const;
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
