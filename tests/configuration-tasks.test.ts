import assert from "node:assert/strict";
import { describe,it } from "node:test";
import type { Client } from "pg";
import { configurationTaskKeys,parseConfigurationChange,readConfigurationChecklist,
  updateConfigurationTask,completeConfigurationTask } from "../src/server/configuration/tasks";
import { CONFIGURATION_MIGRATION_SQL } from "../src/server/configuration/migration";
import { readFile } from "node:fs/promises";

function fakeClient() {
  const queries:{sql:string;values:unknown[]}[]=[];
  const rows=configurationTaskKeys.map(task_key=>({task_key,status:"todo"}));
  const client={query:async(sql:string,values:unknown[]=[])=>{
    queries.push({sql,values});
    if (sql.includes("SELECT locale FROM public.smn_general_settings"))
      return {rowCount:1,rows:[{locale:"fr"}]};
    if (sql.includes("SELECT task_key,status"))return {rowCount:3,rows:rows.map(r=>({...r}))};
    if (sql.includes("UPDATE public.smn_configuration_task")) {
      const row=rows.find(r=>r.task_key===values[0]);
      if (!row)return {rowCount:0,rows:[]};
      const next=sql.includes("status='done'")?"done":values[1] as string;
      if (row.status===next || (sql.includes("status='todo'")&&row.status!=="todo"))
        return {rowCount:0,rows:[]};
      row.status=next;return {rowCount:1,rows:[]};
    }
    throw new Error("unexpected SQL: "+sql);
  }} as unknown as Client;
  return {client,queries,rows};
}
describe("SMN-20 — checklist de configuration",()=>{
  it("valide strictement les demandes",()=>{
    assert.deepEqual(parseConfigurationChange({key:"reference-country",status:"ignored"}),
      {key:"reference-country",status:"ignored"});
    for(const value of [null,[],{}, {key:"x",status:"todo"},
      {key:"recovery-phrase",status:"completed"},
      {key:"recovery-phrase",status:"done",mode:"kanban"}])
      assert.equal(parseConfigurationChange(value),null);
  });
  it("lit uniquement des états de configuration, sans données métier ni personnelles",async()=>{
    const db=fakeClient();
    const result=await readConfigurationChecklist(db.client);
    assert.equal(result.locale,"fr");
    assert.deepEqual(result.tasks.map(t=>t.key),[...configurationTaskKeys]);
    assert.deepEqual(result.tasks.map(t=>t.status),["todo","todo","todo"]);
    assert.doesNotMatch(JSON.stringify(result),/email|password|sprint|risk/i);
  });
  it("Ignorée ne devient jamais automatiquement Terminée",async()=>{
    const db=fakeClient();
    await updateConfigurationTask(db.client,"admin",{key:"recovery-phrase",status:"ignored"});
    await completeConfigurationTask(db.client,"recovery-phrase");
    assert.equal(db.rows[1].status,"ignored");
    assert.equal((await readConfigurationChecklist(db.client)).tasks[1].status,"ignored");
  });
  it("termine un réglage vérifié et autorise une décision manuelle",async()=>{
    const db=fakeClient();
    await completeConfigurationTask(db.client,"reference-country");
    assert.equal(db.rows[0].status,"done");
    await updateConfigurationTask(db.client,"admin",{key:"display-preferences",status:"done"});
    assert.equal(db.rows[2].status,"done");
    await updateConfigurationTask(db.client,"admin",{key:"display-preferences",status:"todo"});
    assert.equal(db.rows[2].status,"todo");
    assert.ok(db.queries.every(x=>!/smn_(sprint|risk|event)/i.test(x.sql)));
  });
  it("ne touche pas à la base sur une demande invalide",async()=>{
    const db=fakeClient();
    assert.deepEqual(await updateConfigurationTask(db.client,"admin",{key:"other",status:"done"}),
      {ok:false,error:"invalid-input"});
    assert.equal(db.queries.length,0);
  });
  it("migration SQL exacte et additive sans réactivation automatique",async()=>{
    const sql=await readFile("prisma/migrations/20261020_smn20_configuration_tasks/migration.sql","utf8");
    assert.equal(sql.replace(/\r\n/g,"\n"),CONFIGURATION_MIGRATION_SQL.replace(/\r\n/g,"\n"));
    assert.match(CONFIGURATION_MIGRATION_SQL,/schema_version=5/);
    assert.match(CONFIGURATION_MIGRATION_SQL,/reference_country IS NOT NULL/);
    assert.match(CONFIGURATION_MIGRATION_SQL,/smn_recovery_phrase/);
    assert.match(CONFIGURATION_MIGRATION_SQL,/display-preferences','todo/);
    assert.doesNotMatch(CONFIGURATION_MIGRATION_SQL,/DELETE FROM|DROP TABLE|public.smn_sprint/i);
  });
});
