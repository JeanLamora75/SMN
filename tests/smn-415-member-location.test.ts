import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readOfficeMemberGroups,officeCountryFlag} from "../src/server/reports/office-word-rows";

function mockDb(){
 const queries:string[]=[];
 const db={
  async query(sql:string){
   queries.push(sql);
   if(sql.includes("last_day"))
    return {rows:[{last_day:"2026-10-30"}]};
   return {rows:[
    {name:"Vignesh Moorti",role:"Développeur",city:"Chennai",country_iso2:"IN",start_on:"2025-12-31",end_on:null},
    {name:"Chaitra Nayak",role:"Lead Tech",city:"Pune",country_iso2:"IN",start_on:"2026-08-01",end_on:null},
    {name:"Ghita Mdiouer",role:"Business Analyst",city:"Paris",country_iso2:"FR",start_on:"2026-04-16",end_on:null}
   ]};
  }
 } as unknown as Client;
 return {db,queries};
}
test("member function and city are copied from the member record without substituting N/D",async()=>{
 const {db,queries}=mockDb();
 const groups=await readOfficeMemberGroups(db,"team","sprint","fr","pptx");
 const vignesh=groups.active.find(r=>r.MEMBER_NAME==="Vignesh Moorti");
 assert.equal(vignesh?.MEMBER_CITY,"Chennai");
 assert.equal(vignesh?.MEMBER_FUNCTION,"Développeur");
 assert.equal(vignesh?.MEMBER_ROLE,"Développeur");
 assert.equal(vignesh?.MEMBER_FLAG,"SMN_FLAG_IN");
 const fr=groups.active.find(r=>r.MEMBER_NAME==="Ghita Mdiouer");
 assert.equal(fr?.MEMBER_FLAG,"SMN_FLAG_FR");
 assert.match(queries[0],/m\.professional_function AS role/);
 assert.match(queries[0],/loc\.city,loc\.country_iso2/);
 assert.match(queries[0],/CASE WHEN ml\.effective_from/);
});
test("Word still uses Unicode flags rather than leaking PowerPoint picture tokens",async()=>{
 const {db}=mockDb();
 const groups=await readOfficeMemberGroups(db,"team","sprint","fr","docx");
 const vignesh=groups.active.find(r=>r.MEMBER_NAME==="Vignesh Moorti");
 assert.equal(vignesh?.MEMBER_FLAG,officeCountryFlag("IN"));
 assert.equal(vignesh?.MEMBER_CITY,"Chennai");
});
