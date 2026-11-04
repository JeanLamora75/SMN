import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {addDatedTeamRoleChange} from "../src/server/members/team-assignment-dated-change";

const member="123e4567-e89b-42d3-a456-426614174000";
const assignment="123e4567-e89b-42d3-a456-426614174111";
const team="team_koala";
const actor={accountId:"admin",role:"admin" as const};
const input=(date:string,productOwner:number,revision:number)=>({
 memberId:member,teamId:team,effectiveFrom:date,
 contractPercent:100,allocationPercent:100,contributionPercent:100,
 shares:{scrumMaster:0,productOwner,developer:100-productOwner},revision
});
type Version={revision:number;effective_from:string;contract_percent:number;
 allocation_percent:number;contribution_percent:number;scrum_master_percent:number;
 product_owner_percent:number;developer_percent:number};
const version=(revision:number,effective_from:string,product_owner_percent:number):Version=>({
 revision,effective_from,contract_percent:100,allocation_percent:100,contribution_percent:100,
 scrum_master_percent:0,product_owner_percent,developer_percent:100-product_owner_percent
});
function fake(rows:Version[],opts:{frozen?:boolean;end?:string|null}={}){
 const queries:{sql:string;params:unknown[]}[]=[];
 const query=async(sql:string,params:unknown[]=[])=>{
  queries.push({sql,params});
  if(["BEGIN","COMMIT","ROLLBACK"].includes(sql))return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_account_team_preference"))
   return {rows:[{team_id:team}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:team,team:"Koala",mode:"scrum"}]};
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:33}]};
  if(sql.includes("SELECT archived_at::text AS archived_at"))
   return {rows:[{archived_at:null}]};
  if(sql.includes("FROM public.smn_member_assignment")&&!sql.includes("version"))
   return {rows:[{id:assignment,start_on:"2026-01-06",end_on:opts.end??null}]};
  if(sql.includes("FROM public.smn_member_assignment_version"))return {rows};
  if(sql.includes("FROM public.smn_sprint s"))
   return {rows:[{count:opts.frozen?"2":"0"}]};
  if(sql.includes("FROM public.smn_member_lifecycle_event"))
   return {rows:[{max_revision:null}]};
  if(sql.includes("INSERT INTO public.smn_member_assignment_version"))
   return {rows:[],rowCount:1};
  throw Error("unexpected SQL "+sql);
 };
 return {db:{query} as unknown as Client,queries};
}
test("06 janvier dev, 20 février PO, 04 mai dev : 3 périodes datées et numéro croissant",async()=>{
 const first=fake([version(1,"2026-01-06",0)]);
 const po=await addDatedTeamRoleChange(first.db,actor,member,input("2026-02-20",100,1));
 assert.equal(po.ok,true);
 assert.ok(first.queries.some(q=>q.sql.includes("INSERT INTO public.smn_member_assignment_version")&&q.params[6]==="2026-02-20"));
 const second=fake([version(1,"2026-01-06",0),version(2,"2026-02-20",100)]);
 const dev=await addDatedTeamRoleChange(second.db,actor,member,input("2026-05-04",0,2));
 assert.equal(dev.ok,true);
 assert.ok(second.queries.some(q=>q.sql.includes("INSERT INTO public.smn_member_assignment_version")&&q.params[6]==="2026-05-04"));
});
test("insertion rétroactive avant une autre version : période limitée au changement suivant",async()=>{
 const {db,queries}=fake([version(1,"2026-01-06",0),version(2,"2026-05-04",0)]);
 const result=await addDatedTeamRoleChange(db,actor,member,input("2026-02-20",100,2));
 assert.equal(result.ok,true);
 const impacted=queries.find(q=>q.sql.includes("FROM public.smn_sprint s"));
 assert.deepEqual(impacted?.params,[team,"2026-02-20","2026-05-03"]);
});
test("date déjà affectée refusée, sprint clôturé autorise une transition datée",async()=>{
 const rows=[version(1,"2026-01-06",0),version(2,"2026-02-20",100)];
 const duplicate=fake(rows);
 assert.deepEqual(await addDatedTeamRoleChange(duplicate.db,actor,member,input("2026-02-20",0,2)),
  {ok:false,error:"duplicate-date"});
 const frozen=fake([version(1,"2026-01-06",0)],{frozen:true});
 const result=await addDatedTeamRoleChange(frozen.db,actor,member,input("2026-02-20",100,1));
 assert.equal(result.ok,true);
 assert.equal(result.ok?result.affectedClosedSprints:0,2);
});
test("interface : changement daté distinct de la correction et date d'effet visible",()=>{
 const form=readFileSync(new URL("../src/app/app/admin/members/assignment-editor.tsx",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/app/app/admin/members/[id]/member-team-read-only.tsx",import.meta.url),"utf8");
 assert.match(form,/editMode==="change"/);
 assert.match(form,/team-assignment\/dated-change/);
 assert.match(form,/Nouveau changement de rôle daté/);
 assert.match(form,/min=\{teamScoped\?state\.startOn/);
 assert.match(page,/formatCivil\(v\.effectiveFrom,locale\)/);
});

test("moteur de capacité : sélection par date d'effet et rôle, non par numéro seul",()=>{
 const engine=readFileSync(new URL("../src/server/capacity/engine.ts",import.meta.url),"utf8");
 assert.match(engine,/v\.effective_from<=date/);
 assert.match(engine,/a\.effective_from\.localeCompare\(b\.effective_from\)\|\|a\.revision-b\.revision/);
 assert.match(engine,/role==="PRODUCT_OWNER"\?version\.product_owner_percent/);
 assert.match(engine,/version\.developer_percent/);
});
