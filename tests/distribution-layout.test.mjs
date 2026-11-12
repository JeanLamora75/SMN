import assert from "node:assert/strict";
import { test } from "node:test";
import { assertApplicationPayload, classifyDistributionPath } from "../scripts/windows/distribution-layout.mjs";

test("application files remain updateable",()=>{
  assert.equal(classifyDistributionPath("server.js"),"application");
  assert.equal(classifyDistributionPath("app/.next/server/app.js"),"application");
  assertApplicationPayload(["server.js","app/.next/static/main.js"]);
});

test("persistent data, PostgreSQL runtime and update staging cannot be overwritten",()=>{
  for(const file of ["data/postgres/data/PG_VERSION","data/office/reports/report.docx",
    "data/office/templates/template.pptx","data/documents/private.pdf",
    "config/settings.json","CONFIG/settings.json",
    "runtime/postgres/pgsql/bin/pg_ctl.exe",
    "updates/stage.zip","DATA/postgres/data","RUNTIME/node.exe"]){
    assert.equal(classifyDistributionPath(file),"persistent");
    assert.throws(()=>assertApplicationPayload([file]),/distribution-protected-path/);
  }
});

test("private files must never be shipped in updates",()=>{
  for(const file of [".env",".env.local",".settings-key","private/runtime.json",
    "app/postgres-connection.json"]){
    assert.equal(classifyDistributionPath(file),"private");
    assert.throws(()=>assertApplicationPayload([file]),/distribution-protected-path/);
  }
});

test("unsafe paths are rejected",()=>{
  for(const file of ["../data/secret","app/../runtime/pg.exe","C:/Windows/system.ini",
    "/tmp/file","app//file","./server.js","app\\server.js","app/config:alternate","CON","app/NUL.txt","app/trailing. ",""]){
    assert.throws(()=>classifyDistributionPath(file),/distribution-path-invalid/);
  }
});
