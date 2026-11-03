import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {readTeamAnnualAbsence} from "../src/server/members/team-annual-absence";

const memberId="123e4567-e89b-42d3-a456-426614174000";
type Day={day:string;morning:boolean;afternoon:boolean};
function fake(days:Day[]=[]){
 const calls:{sql:string;values:unknown[]}[]=[];
 const query=async(sql:string,values:unknown[]=[]):Promise<{rows:any[]}>=>{
  calls.push({sql,values});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:33}]};
  if(sql.includes("SELECT t.id AS team_id FROM public.smn_account_team_preference"))
   return {rows:[{team_id:"team_b"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:"team_b",team:"Koala",mode:"scrum"}]};
  if(sql.includes("SELECT a.id FROM public.smn_member_assignment a"))
   return {rows:[{id:"historical_assignment"}]};
  if(sql.includes("WITH member_days AS"))
   return {rows:days};
  throw Error("Unexpected SQL: "+sql);
 };
 return {db:{query} as unknown as Client,calls};
}

test("compteur annuel : filtre week-ends et fériés du pays ACTUEL avant le compte des créneaux",async()=>{
 const {db,calls}=fake([
  {day:"2026-01-05",morning:true,afternoon:true},
  {day:"2026-01-06",morning:false,afternoon:true},
  {day:"2026-02-03",morning:true,afternoon:false}
 ]);
 assert.deepEqual(await readTeamAnnualAbsence(db,{accountId:"admin",role:"admin"},
  memberId,"team_b",2026),{year:2026,halfDays:4,months:[{month:"2026-01",halfDays:3},{month:"2026-02",halfDays:1}]});
 const query=calls.find(c=>c.sql.includes("WITH member_days AS"))!;
 assert.deepEqual(query.values,[memberId,"team_b",2026]);
 assert.match(query.sql,/EXTRACT\(ISODOW FROM d\.day\) BETWEEN 1 AND 5/);
 assert.match(query.sql,/NOT EXISTS \(\s*SELECT 1 FROM public\.smn_national_holiday h/);
 assert.match(query.sql,/h\.holiday_date=d\.day AND h\.country_code=/);
 assert.match(query.sql,/SELECT l\.country_iso2 FROM public\.smn_member_location l/);
 assert.match(query.sql,/l\.member_id=\$1 ORDER BY l\.revision DESC LIMIT 1/);
 assert.doesNotMatch(query.sql,/l\.effective_from<=d\.day/);
 assert.match(query.sql,/FROM eligible_days d/);
 assert.match(query.sql,/SELECT DISTINCT g\.day::date AS day/);
 assert.match(query.sql,/x\.member_id=\$1 AND x\.team_id=\$2/);
 assert.match(query.sql,/GREATEST\(x\.start_on,make_date\(\$3,1,1\)\)/);
 assert.match(query.sql,/LEAST\(COALESCE\(x\.end_on,make_date\(\$3,12,31\)\)/);
});

test("compteur annuel : prévu/imprévu inclus, créneaux distincts, suppression ignorée",async()=>{
 const {db,calls}=fake();
 assert.deepEqual(await readTeamAnnualAbsence(db,{accountId:"admin",role:"admin"},
  memberId,"team_b",2026),{year:2026,halfDays:0,months:[]});
 const sql=calls.find(c=>c.sql.includes("WITH member_days AS"))!.sql;
 assert.doesNotMatch(sql,/a\.is_planned\s*=/);
 assert.match(sql,/EXISTS\(SELECT 1 FROM public\.smn_member_absence a/g);
 assert.match(sql,/a\.start_slot='morning'/);
 assert.match(sql,/a\.end_slot='afternoon'/);
 assert.match(sql,/h\.after_values->>'deleted'='true'/);
 assert.match(sql,/SELECT day::text AS day,morning,afternoon FROM slots ORDER BY day/);
});

test("décompte déterministe de demi-journées, sans addition de lignes vides",async()=>{
 const days=[
  {day:"2026-04-01",morning:true,afternoon:false},
  {day:"2026-04-02",morning:false,afternoon:true},
  {day:"2026-04-03",morning:true,afternoon:true},
  {day:"2026-04-07",morning:false,afternoon:false},
  {day:"2026-05-04",morning:true,afternoon:true}
 ];
 const {db}=fake(days);
 const counted=await readTeamAnnualAbsence(db,{accountId:"admin",role:"admin"},
  memberId,"team_b",2026);
 assert.deepEqual(counted,{year:2026,halfDays:6,months:[
  {month:"2026-04",halfDays:4},{month:"2026-05",halfDays:2}
 ]});
 assert.equal(counted.months.reduce((total,m)=>total+m.halfDays,0),counted.halfDays);
});
