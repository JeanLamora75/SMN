import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {parseRenameCountryInput,renameCountry} from "../src/server/countries/catalog";

function fixture(options:{revision?:number;name?:string;missing?:boolean;failAudit?:boolean;failUpdate?:boolean}={}){
 const sql:string[]=[],params:unknown[][]=[];
 const revision=options.revision??0,name=options.name??"Allemagne";
 const db={query:async(query:string,values:unknown[]=[])=>{
  sql.push(query);params.push(values);
  if(query.includes("FOR UPDATE"))return options.missing?
   {rowCount:0,rows:[]}:{rowCount:1,rows:[{name,revision}]};
  if(query.includes("UPDATE public.smn_country"))return options.failUpdate?
   {rowCount:0,rows:[]}:{rowCount:1,rows:[{name:values[1],revision:revision+1}]};
  if(query.includes("INSERT INTO public.smn_country_name_audit")){
   if(options.failAudit)throw new Error("audit-failure");
   return {rowCount:1,rows:[]};
  }
  return {rowCount:0,rows:[]};
 }} as unknown as Client;
 return {db,sql,params};
}

describe("Renommage des pays",()=>{
 it("n'accepte que nom et revision, sans modification du code",()=>{
  assert.deepEqual(parseRenameCountryInput({name:"  Pays   Bas ",revision:0}),
   {name:"Pays Bas",revision:0});
  for(const raw of [
   {name:"Pays-Bas",revision:-1},{name:"Pays-Bas",revision:1.5},
   {name:"Pays-Bas",revision:"0"},{name:"",revision:0},
   {name:"F\nR",revision:0},{name:"x".repeat(121),revision:0},
   {name:"France",revision:0,code:"DE"},null
  ])assert.equal(parseRenameCountryInput(raw),null);
 });
 it("conserve le code ISO, incrémente la révision et audite la modification atomiquement",async()=>{
  const f=fixture({revision:3});
  assert.deepEqual(await renameCountry(f.db,"DE","admin",{name:"Germanie",revision:3}),
   {ok:true,unchanged:false,code:"DE",name:"Germanie",revision:4});
  assert.equal(f.sql.at(-1),"COMMIT");
  assert.equal(f.sql.filter(x=>x.includes("UPDATE public.smn_country")).length,1);
  assert.equal(f.sql.filter(x=>x.includes("INSERT INTO public.smn_country_name_audit")).length,1);
  const idx=f.sql.findIndex(x=>x.includes("INSERT INTO public.smn_country_name_audit"));
  assert.deepEqual(f.params[idx].slice(1),["DE",4,"Allemagne","Germanie","admin"]);
  assert.ok(!f.sql.some(q=>q.includes("UPDATE public.smn_national_holiday")||
   q.includes("UPDATE public.smn_member_location")));
 });
 it("rejette un état périmé sans UPDATE ni audit",async()=>{
  const f=fixture({revision:4});
  assert.deepEqual(await renameCountry(f.db,"DE","admin",{name:"Germanie",revision:3}),
   {ok:false,error:"conflict"});
  assert.equal(f.sql.at(-1),"ROLLBACK");
  assert.ok(!f.sql.some(q=>q.includes("UPDATE public.smn_country")||
   q.includes("INSERT INTO public.smn_country_name_audit")));
 });
 it("un nom inchangé ne crée aucune ligne d'audit",async()=>{
  const f=fixture({name:"Allemagne",revision:1});
  assert.deepEqual(await renameCountry(f.db,"DE","admin",{name:" Allemagne ",revision:1}),
   {ok:true,unchanged:true,code:"DE",name:"Allemagne",revision:1});
  assert.equal(f.sql.at(-1),"COMMIT");
  assert.ok(!f.sql.some(q=>q.includes("UPDATE public.smn_country")||
   q.includes("INSERT INTO public.smn_country_name_audit")));
 });
 it("un pays absent renvoie not-found sans écriture",async()=>{
  const f=fixture({missing:true});
  assert.deepEqual(await renameCountry(f.db,"DE","admin",{name:"Germanie",revision:0}),
   {ok:false,error:"not-found"});
  assert.equal(f.sql.at(-1),"ROLLBACK");
 });
 it("une erreur d'audit annule aussi l'UPDATE",async()=>{
  const f=fixture({failAudit:true});
  await assert.rejects(()=>renameCountry(f.db,"DE","admin",{name:"Germanie",revision:0}),
   /audit-failure/);
  assert.equal(f.sql.at(-1),"ROLLBACK");
 });
 it("une requête invalide est rejetée sans aucun accès SQL",async()=>{
  const f=fixture();
  assert.deepEqual(await renameCountry(f.db,"UK","admin",{name:"Royaume",revision:0}),
   {ok:false,error:"invalid-input"});
  assert.deepEqual(await renameCountry(f.db,"DE","",{name:"Germanie",revision:0}),
   {ok:false,error:"invalid-input"});
  assert.equal(f.sql.length,0);
 });
});
