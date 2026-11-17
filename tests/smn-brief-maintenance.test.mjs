import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");

test("SMN brief migration: in-app route requires admin and verifies a current encrypted backup",()=>{
 const route=read("src/app/api/admin/ai-briefs/migration/route.ts");
 assert.match(route,/authorizeApi\(request,action,scope\)/);
 assert.match(route,/actor\?\.role==="admin"/);
 assert.match(route,/allowMutation\(request\)/);
 assert.match(route,/backupInventory\(backupRootPath\(\)\)/);
 assert.match(route,/proof\.status!=="verified"/);
 assert.match(route,/!proof\.integrityVerified/);
 assert.match(route,/!proof\.scopeComplete/);
 assert.match(route,/proof\.installationSource!==before\.source/);
 assert.match(route,/applySmn472\(db,true\)/);
 assert.doesNotMatch(route,/applyBriefCleanup|DROP COLUMN|SMN_AI_BRIEF_BACKUP_VERIFIED/);
});

test("SMN brief migration: maintenance UI exposes the guarded action and explains blocked cleanup",()=>{
 const page=read("src/app/app/admin/settings/maintenance/page.tsx");
 const view=read("src/app/app/admin/settings/maintenance/brief-migration-admin.tsx");
 assert.match(page,/BriefMigrationAdmin/);
 assert.match(view,/api\/admin\/ai-briefs\/migration/);
 assert.match(view,/backupId:valid\.id,confirm:true/);
 assert.match(view,/!valid/);
 assert.match(view,/restauration isolée/);
});
