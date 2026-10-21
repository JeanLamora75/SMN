import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {parseCategoryChange,listAbsenceCategories,saveAbsenceCategory}
 from "../src/server/members/absence-categories";
import {parseAbsenceChange,readMemberAbsences,saveMemberAbsence} from "../src/server/members/absence";
import {canAccess} from "../src/server/access-policy";

type Row={id:string;name:string;color:string;is_active:boolean;updated_at:string;usage_count:number};
const initial:Row[]=[
 {id:"leave",name:"Congés",color:"#4F83CC",is_active:true,updated_at:"2026-10-21 12:00:00+00",usage_count:2},
 {id:"training",name:"Formation",color:"#7959B3",is_active:true,updated_at:"2026-10-21 12:00:00+00",usage_count:0},
 {id:"sick",name:"Maladie",color:"#D17B38",is_active:true,updated_at:"2026-10-21 12:00:00+00",usage_count:1},
 {id:"other",name:"Autre",color:"#6B7280",is_active:true,updated_at:"2026-10-21 12:00:00+00",usage_count:0}
];
const update=(changes:Record<string,unknown>={})=>({
 action:"update",id:"leave",updatedAt:"2026-10-21 12:00:00+00",
 name:"Congés",color:"#4F83CC",isActive:true,...changes
});
const create=(changes:Record<string,unknown>={})=>({
 action:"create",name:"Congé exceptionnel",color:"#72b16e",...changes
});
function fakeDb(){
 const categories=initial.map(x=>({...x}));
 const queries:string[]=[];
 let clock=1;
 const db={query:async(sql:string,args:unknown[]=[])=>{
  queries.push(sql);
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK"||sql.includes("pg_advisory_xact_lock"))
   return {rowCount:0,rows:[]};
  if(sql.includes("COALESCE(count(a.id)"))return {rowCount:categories.length,rows:categories
   .map(x=>({id:x.id,name:x.name,color:x.color,is_active:x.is_active,
    updated_at:x.updated_at,usage_count:x.usage_count}))};
  if(sql.includes("FROM public.smn_member m")&&sql.includes("JOIN public.smn_installation i"))
   return {rowCount:1,rows:[{id:"11111111-1111-4111-8111-111111111111",archived_at:null}]};
  if(sql.includes("FROM public.smn_absence_category")&&sql.includes("WHERE id=$1 FOR SHARE")){
   const matched=categories.filter(c=>c.id===args[0]);
   return {rowCount:matched.length,rows:matched};
  }
  if(sql.includes("FROM public.smn_absence_category")&&sql.includes("WHERE id=$1 FOR UPDATE")){
   const found=categories.filter(x=>x.id===args[0]);
   return {rowCount:found.length,rows:found};
  }
  if(sql.includes("FROM public.smn_absence_category")&&sql.includes("lower(name)=lower($1)")){
   const found=categories.filter(x=>x.name.toLocaleLowerCase("fr")===String(args[0]).toLocaleLowerCase("fr")&&x.id!==args[1]);
   return {rowCount:found.length,rows:found.slice(0,1).map(x=>({id:x.id}))};
  }
  if(sql.includes("SELECT count(*)::integer AS total FROM public.smn_absence_category"))
   return {rows:[{total:categories.length}],rowCount:1};
  if(sql.includes("INSERT INTO public.smn_absence_category")){
   const id=String(args[0]);
   categories.push({id,name:String(args[1]),color:String(args[2]),is_active:true,
    updated_at:"2026-10-21 12:00:01+00",usage_count:0});
   return {rowCount:1,rows:[{id,updated_at:"2026-10-21 12:00:01+00"}]};
  }
  if(sql.includes("UPDATE public.smn_absence_category")){
   const found=categories.find(x=>x.id===args[0]&&x.updated_at===args[4]);
   if(!found)return {rowCount:0,rows:[]};
   Object.assign(found,{name:args[1],color:args[2],is_active:args[3],
    updated_at:"2026-10-21 12:00:"+String(++clock).padStart(2,"0")+"+00"});
   return {rowCount:1,rows:[{id:found.id,updated_at:found.updated_at}]};
  }
  throw Error("unexpected SQL: "+sql);
 }} as unknown as Client;
 return {db,categories,queries};
}

describe("catalogue de catégories d'absence",()=>{
 it("exige nom et couleur valides ; refuse champs et actions non prévus",()=>{
  assert.deepEqual(parseCategoryChange(create({name:"   "})),{ok:false,error:"name-required"});
  assert.deepEqual(parseCategoryChange(create({color:""})),{ok:false,error:"color-required"});
  assert.deepEqual(parseCategoryChange(create({color:"red"})),{ok:false,error:"invalid-color"});
  assert.deepEqual(parseCategoryChange(create({color:"#12345"})),{ok:false,error:"invalid-color"});
  assert.deepEqual(parseCategoryChange(create({name:"A".repeat(101)})),{ok:false,error:"invalid-name"});
  assert.deepEqual(parseCategoryChange(create({diagnosis:"donnée médicale"})),{ok:false,error:"invalid-input"});
  assert.deepEqual(parseCategoryChange({action:"delete",id:"leave"}),{ok:false,error:"invalid-input"});
  assert.deepEqual(parseCategoryChange(create({name:"  Congé    spécial  ",color:"#ab12de"})),
   {ok:true,value:{action:"create",name:"Congé spécial",color:"#AB12DE"}});
 });
 it("retourne les catégories initiales, couleur, statut et usage sans masquer les inactives",async()=>{
  const f=fakeDb();
  const result=await listAbsenceCategories(f.db);
  assert.equal(result.categories.length,4);
  assert.deepEqual(result.categories.map(c=>c.name).sort(),
   ["Autre","Congés","Formation","Maladie"]);
  assert.equal(result.categories.find(c=>c.id==="leave")?.usageCount,2);
  assert.ok(result.categories.every(c=>/^#[0-9A-F]{6}$/i.test(c.color)));
 });
 it("crée une catégorie active avec identifiant technique stable",async()=>{
  const f=fakeDb();
  const r=await saveAbsenceCategory(f.db,create());
  assert.equal(r.ok,true);
  if(!r.ok)return;
  assert.equal(r.created,true);
  assert.match(r.category.id,/^cat_[a-f0-9]{32}$/);
  assert.equal(r.category.name,"Congé exceptionnel");
  assert.equal(r.category.color,"#72B16E");
  assert.equal(r.category.isActive,true);
  assert.equal(f.categories.length,5);
  assert.equal(f.queries.at(-1),"COMMIT");
 });
 it("bloque la création d'une absence nouvelle sur une catégorie désactivée",async()=>{
  const f=fakeDb();
  const result=await saveAbsenceCategory(f.db,update({isActive:false}));
  assert.equal(result.ok,true);
  const blocked=await saveMemberAbsence(f.db,
   "11111111-1111-4111-8111-111111111111",
   "22222222-2222-4222-8222-222222222222",{
    action:"create",revision:0,categoryId:"leave",startOn:"2026-10-01",
    endOn:"2026-10-01",startSlot:"morning",endSlot:"afternoon",
    isPlanned:true,reason:"Indisponibilité"
   });
  assert.deepEqual(blocked,{ok:false,error:"category-inactive"});
  assert.equal(f.queries.at(-1),"ROLLBACK");
 });
 it("renomme et recolore en place une catégorie utilisée : même id, motif non touché",async()=>{
  const f=fakeDb();
  const r=await saveAbsenceCategory(f.db,update({name:"Vacances",color:"#153CAC"}));
  assert.equal(r.ok,true);
  if(!r.ok)return;
  assert.equal(r.category.id,"leave");
  assert.equal(f.categories.find(c=>c.id==="leave")?.name,"Vacances");
  assert.equal(f.categories.find(c=>c.id==="leave")?.usage_count,2);
  assert.equal(f.queries.some(q=>q.includes("UPDATE public.smn_member_absence")),false);
  assert.equal(f.queries.some(q=>/pdf|capacity|daily/i.test(q)),false);
 });
 it("désactive puis réactive, sans effacer les références utilisées",async()=>{
  const f=fakeDb();
  const r=await saveAbsenceCategory(f.db,update({isActive:false}));
  assert.equal(r.ok,true);
  if(!r.ok)return;
  assert.equal(r.category.isActive,false);
  assert.equal(f.categories.find(c=>c.id==="leave")?.usage_count,2);
  const reactivated=await saveAbsenceCategory(f.db,
   update({updatedAt:r.category.updatedAt,isActive:true}));
  assert.equal(reactivated.ok,true);
  if(reactivated.ok)assert.equal(reactivated.category.isActive,true);
  assert.equal(f.queries.some(q=>/\bDELETE\b/i.test(q)),false);
 });
 it("refuse les noms doublons et les modifications simultanées obsolètes",async()=>{
  const f=fakeDb();
  const duplicate=await saveAbsenceCategory(f.db,create({name:"  congés  "}));
  assert.deepEqual(duplicate,{ok:false,error:"duplicate-name"});
  assert.equal(f.queries.at(-1),"ROLLBACK");
  const changed=await saveAbsenceCategory(f.db,update({color:"#999999"}));
  assert.equal(changed.ok,true);
  const conflict=await saveAbsenceCategory(f.db,update({color:"#123456"}));
  assert.deepEqual(conflict,{ok:false,error:"conflict"});
 });
 it("répercute un renommage sur une absence ancienne sans réécrire son motif",async()=>{
  const f=fakeDb();
  const memberId="11111111-1111-4111-8111-111111111111";
  const category=f.categories.find(x=>x.id==="leave")!;
  const reader={query:async(sql:string)=>{
   if(sql.includes("FROM public.smn_member m"))return {
    rowCount:1,rows:[{id:memberId,archived_at:null}]};
   if(sql.includes("FROM public.smn_absence_category ORDER BY"))
    return {rowCount:f.categories.length,rows:f.categories};
   if(sql.includes("FROM public.smn_member_absence a")&&sql.includes("ORDER BY a.start_on DESC"))
    return {rowCount:1,rows:[{
     id:"33333333-3333-4333-8333-333333333333",member_id:memberId,
     category_id:"leave",category_name:category.name,category_color:category.color,
     revision:1,start_on:"2020-05-01",end_on:"2020-05-01",
     start_slot:"morning",end_slot:"afternoon",is_planned:true,
     reason:"Motif conservé",created_at:"2020-04-01",updated_at:"2020-04-01"
    }]};
   throw Error("unexpected query: "+sql);
  }} as unknown as Client;
  const before=await readMemberAbsences(reader,memberId,"2020-05-01");
  assert.equal(before.absences[0].categoryName,"Congés");
  const changed=await saveAbsenceCategory(f.db,update({
   name:"Vacances annuelles",color:"#123DEF",isActive:false}));
  assert.equal(changed.ok,true);
  const after=await readMemberAbsences(reader,memberId,"2020-05-01");
  assert.equal(after.absences[0].categoryName,"Vacances annuelles");
  assert.equal(after.absences[0].categoryColor,"#123DEF");
  assert.equal(after.absences[0].reason,"Motif conservé");
  assert.equal(after.categories.find(c=>c.id==="leave")?.isActive,false);
 });
 it("respecte la politique réservant l'administration aux administrateurs",()=>{
  const target={type:"members",exists:true,inScope:true};
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},
   "read",target),true);
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},
   "write",target),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "read",target),false);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "write",target),false);
 });
 it("exclut les détails médicaux du contrat et préserve la sélection active de SMN-53",()=>{
  assert.deepEqual(parseCategoryChange(update({medicalDetails:"diagnostic"})),
   {ok:false,error:"invalid-input"});
  const existingAbsence={
   action:"create",revision:0,categoryId:"sick",startOn:"2026-04-01",endOn:"2026-04-01",
   startSlot:"morning",endSlot:"afternoon",isPlanned:false,reason:"Indisponibilité"
  };
  assert.equal(parseAbsenceChange(existingAbsence).ok,true);
  assert.equal("diagnosis" in existingAbsence,false);
 });
});
