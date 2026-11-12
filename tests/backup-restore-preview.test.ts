import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {evaluatePreview,type CurrentBackupState} from "../src/server/backup/preview-policy";
import type {BackupInventoryEntry} from "../src/server/backup/verification";
const current:CurrentBackupState={
 installationSource:"singleton:2026-10-20T08:00:00.000Z",schemaVersion:33,
 postgresVersion:"18.6",applicationVersion:"0.1.0",documentCount:2
};
const valid:BackupInventoryEntry={
 id:"734b7cb1-38ac-4261-87a8-f9393fdcc301",createdAt:"2026-11-09T08:00:00.000Z",
 status:"verified",reason:null,checkedAt:"2026-11-09T08:01:00.000Z",
 installationSource:current.installationSource,applicationVersion:"0.1.0",
 schemaVersion:33,postgresVersion:"18.6",components:[],documentCount:0,
 integrityVerified:true,restoreTested:false
};
const now=new Date("2026-11-09T09:00:00.000Z");
describe("SMN-33 — prévisualisation de restauration non destructive",()=>{
 it("signale les pertes récentes sans autoriser la restauration",()=>{
  const issues=evaluatePreview(valid,current,now);
  assert.ok(issues.includes("snapshot-older"));
  assert.ok(issues.includes("privacy-not-cleared"));
  assert.ok(!issues.includes("different-installation"));
 });
 it("bloque une archive altérée et une installation étrangère",()=>{
  const archive={...valid,status:"invalid" as const,integrityVerified:false,
   installationSource:"singleton:2026-09-01T08:00:00.000Z"};
  const issues=evaluatePreview(archive,current,now);
  assert.ok(issues.includes("archive-not-verified"));
  assert.ok(issues.includes("different-installation"));
 });
 it("signale les divergences de versions et les archives legacy",()=>{
  const archive={...valid,schemaVersion:34,postgresVersion:"17.2",
   applicationVersion:null,installationSource:"singleton (legacy)"};
  const issues=evaluatePreview(archive,current,now);
  assert.ok(issues.includes("schema-newer"));
  assert.ok(issues.includes("postgres-incompatible"));
  assert.ok(issues.includes("application-incompatible"));
  assert.ok(issues.includes("source-unconfirmed"));
  assert.ok(evaluatePreview({...archive,schemaVersion:32},current,now).includes("schema-older"));
 });
 it("ne masque pas les documents privés dont l'inventaire est inaccessible",()=>{
  assert.ok(evaluatePreview(valid,{...current,documentCount:null},now)
   .includes("current-documents-unavailable"));
 });
 it("distingue précisément une archive récente de la limite des 60 secondes",()=>{
  const exactlyNow={...valid,createdAt:now.toISOString(),documentCount:0};
  assert.deepEqual(evaluatePreview(exactlyNow,{...current,documentCount:0},now),
   ["privacy-not-cleared"],"Une archive récente ne doit jamais déclencher une fausse alerte de perte");
  const threshold=new Date(now.getTime()-60_000).toISOString();
  assert.deepEqual(evaluatePreview({...exactlyNow,createdAt:threshold},
   {...current,documentCount:0},now),["privacy-not-cleared"]);
  const stale=new Date(now.getTime()-60_001).toISOString();
  assert.deepEqual(evaluatePreview({...exactlyNow,createdAt:stale},
   {...current,documentCount:0},now),["snapshot-older","privacy-not-cleared"]);
 });
 it("ne confond pas compatibilité des versions mineures et majeures PostgreSQL",()=>{
  const recent={...valid,createdAt:now.toISOString(),documentCount:0};
  assert.deepEqual(evaluatePreview({...recent,postgresVersion:"18.9"},
    {...current,documentCount:0},now),["privacy-not-cleared"]);
  assert.deepEqual(evaluatePreview({...recent,postgresVersion:"17.9"},
    {...current,documentCount:0},now),["postgres-incompatible","privacy-not-cleared"]);
 });
 it("signale une source absente et refuse toute archive non vérifiée sans permettre la restauration",()=>{
  const recent={...valid,createdAt:now.toISOString()};
  assert.deepEqual(evaluatePreview({...recent,status:"invalid",integrityVerified:false,
   installationSource:null,applicationVersion:null,postgresVersion:null},
   {...current,documentCount:0},now),[
    "archive-not-verified","source-unconfirmed","postgres-incompatible",
    "application-incompatible","privacy-not-cleared"
   ]);
 });

});
