import {canAccess} from "../src/server/access-policy";
import assert from "node:assert/strict";
import test from "node:test";
import {parseCompanyInput,changeCompany,setCompanyArchived,getCompany,createCompany,listCompanies} from "../src/server/companies/catalog";
import type {Client} from "pg";

test("company input normalizes name and optional comment",()=>{
 assert.deepEqual(parseCompanyInput({name:"  ACME  France ",color:"blue"}),{name:"ACME France",comment:null,color:"blue"});
});
test("company rejects invalid color and name",()=>{
 assert.equal(parseCompanyInput({name:"",color:"blue"}),null);
 assert.equal(parseCompanyInput({name:"ACME",color:"unsafe"}),null);
});
test("company rejects unexpected data and invalid comments",()=>{
 assert.equal(parseCompanyInput({name:"ACME",color:"blue",installation_id:"other"}),null);
 assert.equal(parseCompanyInput({name:"ACME",color:"blue",comment:3}),null);
});

test("catalogue visible en lecture aux comptes autorisés, gestion admin seulement",()=>{
 const resource={type:"companies",exists:true,inScope:true};
 const user={role:"user",is_active:true,must_change_password:false};
 const admin={role:"admin",is_active:true,must_change_password:false};
 assert.equal(canAccess(user,"read",resource),true);
 assert.equal(canAccess(user,"write",resource),false);
 assert.equal(canAccess(admin,"write",resource),true);
 assert.equal(canAccess({...user,is_active:false},"read",resource),false);
 assert.equal(canAccess(user,"read",{...resource,inScope:false}),false);
});
test("payload d'édition interdit les champs supplémentaires",()=>{
 assert.equal(parseCompanyInput({name:"Acme",color:"blue",companyId:"other"}),null);
 assert.equal(parseCompanyInput({name:"Acme",color:"blue",comment:"a".repeat(2001)}),null);
});

test("révision obsolète retourne conflict et n'écrase pas la fiche",async()=>{
 const sql:string[]=[];
 const db={query:async(query:string)=>{
  sql.push(query);
  if(query.startsWith("UPDATE"))return {rows:[]};
  return {rows:[{id:"10ae30ef-2562-4459-a276-010102030405",name:"Acme",comment:null,color:"blue",archived_at:null,revision:4}]};
 }} as unknown as Client;
 const result=await changeCompany(db,"10ae30ef-2562-4459-a276-010102030405","admin",{name:"Acme",color:"green",revision:3});
 assert.deepEqual(result,{ok:false,error:"conflict"});
 assert.equal(sql.filter(x=>x.startsWith("UPDATE")).length,1);
});
test("archivage respecte la révision côté SQL",async()=>{
 let update="";
 const db={query:async(sql:string)=>{
  if(sql.startsWith("UPDATE")){update=sql;return {rows:[]};}
  return {rows:[{id:"10ae30ef-2562-4459-a276-010102030405",name:"Acme",comment:null,color:"blue",archived_at:"2026-10-28",revision:2}]};
 }} as unknown as Client;
 const result=await setCompanyArchived(db,"10ae30ef-2562-4459-a276-010102030405","admin",2,true);
 assert.deepEqual(result,{ok:false,error:"already-archived"});
 assert.match(update,/revision=\$2/);
 assert.match(update,/archived_at IS NULL/);
});
test("identifiant malformé ne consulte pas la base",async()=>{
 const db={query:async()=>{throw Error("unexpected database call");}} as unknown as Client;
 assert.equal(await getCompany(db,"invalid"),null);
 assert.deepEqual(await setCompanyArchived(db,"invalid","admin",1,true),{ok:false,error:"invalid-input"});
});

test("création réussie transmet seulement les valeurs métier paramétrées",async()=>{
 let sql="",params:unknown[]=[];
 const db={query:async(q:string,p:unknown[])=>{
  sql=q;params=p;
  return {rows:[{id:"10ae30ef-2562-4459-a276-010102030405",name:"Acme",comment:null,color:"green",archived_at:null,revision:1}]};
 }} as unknown as Client;
 const result=await createCompany(db,"admin",{name:" Acme ",color:"green"});
 assert.equal(result.ok,true);
 assert.match(sql,/installation_id,name,comment,color/);
 assert.equal(params[1],"Acme");
 assert.equal(params[3],"green");
});
test("doublon de nom ciblé renvoie duplicate-name",async()=>{
 const db={query:async()=>{throw Object.assign(Error("duplicate"),{code:"23505",constraint:"smn_company_installation_name_uq"});}} as unknown as Client;
 const result=await createCompany(db,"admin",{name:"Acme",color:"blue"});
 assert.deepEqual(result,{ok:false,error:"duplicate-name"});
});
test("autre violation SQL non masquée en doublon",async()=>{
 const db={query:async()=>{throw Object.assign(Error("constraint"),{code:"23505",constraint:"some_other_constraint"});}} as unknown as Client;
 await assert.rejects(()=>createCompany(db,"admin",{name:"Acme",color:"blue"}),/constraint/);
});
test("réactivation réussie respecte la révision attendue",async()=>{
 let sql="";
 const db={query:async(q:string)=>{
  sql=q;
  return {rows:[{id:"10ae30ef-2562-4459-a276-010102030405",name:"Acme",comment:null,color:"blue",archived_at:null,revision:5}]};
 }} as unknown as Client;
 const result=await setCompanyArchived(db,"10ae30ef-2562-4459-a276-010102030405","admin",4,false);
 assert.equal(result.ok,true);
 assert.match(sql,/archived_at=NULL/);
 assert.match(sql,/archived_at IS NOT NULL/);
});
test("lecture catalogue limitée à l'installation courante",async()=>{
 let sql="";
 const db={query:async(q:string)=>{sql=q;return {rows:[]};}} as unknown as Client;
 assert.deepEqual(await listCompanies(db),[]);
 assert.match(sql,/installation_id='singleton'/);
});
