import assert from "node:assert/strict";
import { describe,it } from "node:test";
import type { Client } from "pg";
import { parseGeneralSettings, readGeneralSettings, updateGeneralSettings } from "../src/server/settings/manager";
import { SETTINGS_MIGRATION_SQL } from "../src/server/settings/migration";
const valid={locale:"en",theme:"dark",referenceCountry:"DE",revision:0} as const;
const original={locale:"fr",theme:"light",palette:"ocean",reference_country:null,revision:0,
  updated_at:new Date("2026-10-20T10:00:00Z"),mode:"scrum",product:"Produit original"};
function fakeClient(options:{revision?:number; failAudit?:boolean; zeroUpdate?:boolean}={}) {
  const calls:{sql:string;values:unknown[]}[]=[];
  const row={...original,revision:options.revision??0};
  const client={query:async(sql:string,values:unknown[]=[])=>{
    calls.push({sql,values});
    if(sql.includes("SELECT s.locale"))return {rowCount:1,rows:[row]};
    if(sql.includes("UPDATE public.smn_general_settings"))return options.zeroUpdate?{rowCount:0,rows:[]}:
      {rowCount:1,rows:[{locale:values[0],theme:values[1],palette:values[2],reference_country:values[3],revision:row.revision+1,updated_at:new Date()}]};
    if(sql.includes("INSERT INTO public.smn_general_settings_audit")&&options.failAudit)throw new Error("fixture database failure");
    return {rowCount:1,rows:[]};
  }} as unknown as Client;
  return {client,calls};
}
describe("SMN-18 — paramètres généraux",()=>{
  it("accepte uniquement les préférences autorisées et une révision valide",()=>{
    assert.deepEqual(parseGeneralSettings(valid),valid);
    for(const input of [
      null,{},[],{...valid,mode:"kanban"},{...valid,product:"autre"},
      {...valid,locale:"es"},{...valid,theme:"system"},{...valid,referenceCountry:"FRA"},
      {...valid,referenceCountry:"fr"},{...valid,revision:-1},{...valid,revision:1.5},
      {...valid,referenceCountry:33},
    ])assert.equal(parseGeneralSettings(input),null);
    assert.deepEqual(parseGeneralSettings({...valid,referenceCountry:null}),{...valid,referenceCountry:null});
    assert.deepEqual(parseGeneralSettings({...valid,palette:"forest"}),{...valid,palette:"forest"});
    for(const palette of ["red","#000","<script>",false,null,"FOREST",""])
      assert.equal(parseGeneralSettings({...valid,palette}),null);
  });
  it("lit le mode et le produit du serveur sans les exposer en mutation",async()=>{
    const db=fakeClient();
    const result=await readGeneralSettings(db.client);
    assert.equal(result.mode,"scrum");
    assert.equal(result.product,"Produit original");
    assert.equal(result.referenceCountry,null);
    assert.equal(result.palette,"ocean");
    assert.equal(result.revision,0);
  });
  it("n'entre pas en transaction si la validation a échoué",async()=>{
    const db=fakeClient();
    const result=await updateGeneralSettings(db.client,"admin",{...valid,mode:"kanban"});
    assert.deepEqual(result,{ok:false,error:"invalid-input"});
    assert.equal(db.calls.length,0);
  });
  it("refuse une révision périmée avec ROLLBACK sans mise à jour",async()=>{
    const db=fakeClient({revision:1});
    const result=await updateGeneralSettings(db.client,"admin",valid);
    assert.deepEqual(result,{ok:false,error:"conflict"});
    assert.equal(db.calls.some(x=>x.sql.includes("ROLLBACK")),true);
    assert.equal(db.calls.some(x=>x.sql.includes("UPDATE public.smn_general_settings")),false);
  });
  it("ne crée pas de trace ni de nouvelle révision en l'absence de changement",async()=>{
    const db=fakeClient();
    const result=await updateGeneralSettings(db.client,"admin",{
      locale:"fr",theme:"light",referenceCountry:null,revision:0,
    });
    assert.equal(result.ok,true);
    if(result.ok){assert.equal(result.changed,false);assert.equal(result.settings.revision,0);}
    assert.equal(db.calls.some(x=>x.sql.includes("INSERT INTO public.smn_general_settings_audit")),false);
  });
  it("met à jour les seuls réglages et historise avant COMMIT",async()=>{
    const db=fakeClient();
    const result=await updateGeneralSettings(db.client,"admin",valid);
    assert.equal(result.ok,true);
    if(result.ok){assert.equal(result.changed,true);assert.equal(result.settings.revision,1);
      assert.equal(result.settings.mode,"scrum");assert.equal(result.settings.product,"Produit original");}
    const executed=db.calls.map(x=>x.sql);
    assert.match(executed.join("\n"),/INSERT INTO public.smn_general_settings_audit/);
    assert.match(executed.join("\n"),/UPDATE public.smn_configuration_task/);
    const taskIndex=executed.findIndex(x=>x.includes("UPDATE public.smn_configuration_task"));
    assert.ok(taskIndex>executed.findIndex(x=>x.includes("INSERT INTO public.smn_general_settings_audit")));
    assert.ok(taskIndex<executed.indexOf("COMMIT"));
    const auditIndex=executed.findIndex(x=>x.includes("INSERT INTO public.smn_general_settings_audit"));
    assert.ok(auditIndex<executed.indexOf("COMMIT"));
    const update= db.calls.find(x=>x.sql.includes("UPDATE public.smn_general_settings"));
    assert.deepEqual(update?.values,["en","dark","ocean","DE","admin",0]);
    assert.ok(db.calls.every(x=>!x.sql.includes("smn_product SET")&&!x.sql.includes("smn_team SET")));
  });
  it("enregistre une palette prédéfinie dans la même transaction auditée",async()=>{
    const db=fakeClient();
    const result=await updateGeneralSettings(db.client,"admin",{...valid,palette:"violet"});
    assert.equal(result.ok,true);
    if(result.ok){
      assert.equal(result.changed,true);
      assert.equal(result.settings.palette,"violet");
      assert.equal(result.settings.theme,"dark");
    }
    const write=db.calls.find(x=>x.sql.includes("UPDATE public.smn_general_settings"));
    assert.deepEqual(write?.values,["en","dark","violet","DE","admin",0]);
    const audit=db.calls.find(x=>x.sql.includes("INSERT INTO public.smn_general_settings_audit"));
    assert.ok(audit);
    assert.ok(audit?.values.some(value=>{\n      if(typeof value!=="string")return false;\n      try{const parsed=JSON.parse(value) as unknown;\n        return typeof parsed==="object"&&parsed!==null&&\n          "palette" in parsed&&parsed.palette==="violet";\n      }catch{return false;}\n    }),"La palette violette doit figurer dans le JSON de l’audit");
    assert.ok(db.calls.findIndex(x=>x.sql.includes("INSERT INTO public.smn_general_settings_audit"))<
      db.calls.findIndex(x=>x.sql==="COMMIT"));
  });
  it("échec de l'audit : pas de succès, rollback de l'écriture",async()=>{
    const db=fakeClient({failAudit:true});
    await assert.rejects(()=>updateGeneralSettings(db.client,"admin",valid),/fixture database failure/);
    assert.equal(db.calls.some(x=>x.sql.includes("ROLLBACK")),true);
    assert.equal(db.calls.some(x=>x.sql==="COMMIT"),false);
  });
  it("migration additive : singleton et aucune écriture rétroactive",()=>{
    assert.match(SETTINGS_MIGRATION_SQL,/CREATE TABLE public.smn_general_settings/);
    assert.match(SETTINGS_MIGRATION_SQL,/CREATE TABLE public.smn_general_settings_audit/);
    assert.match(SETTINGS_MIGRATION_SQL,/VALUES\('singleton'\)/);
    assert.match(SETTINGS_MIGRATION_SQL,/schema_version=4/);
    assert.doesNotMatch(SETTINGS_MIGRATION_SQL,/DROP TABLE|UPDATE public.smn_team|UPDATE public.smn_product|DELETE FROM/i);
  });
});
