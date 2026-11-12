import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("SMN-442: backup page exposes ZIP upload and cryptographic review in UI",()=>{
 const page=read("src/app/app/admin/backups/page.tsx");
 const client=read("src/app/app/admin/backups/migration-import-admin.tsx");
 assert.match(page,/<MigrationImportAdmin\/>/);
 assert.match(client,/type="file"/);
 assert.match(client,/\.zip,application\/zip/);
 assert.match(client,/xhr\.upload\.onprogress/);
 assert.match(client,/type="password"/);
 assert.match(client,/migration\/upload\/verify/);
 assert.doesNotMatch(client,/powershell|cmd\.exe|pnpm|ssh/i);
});
test("SMN-442: upload and validation are isolated from active PostgreSQL",()=>{
 const upload=read("src/app/api/admin/backups/migration/upload/route.ts");
 const verify=read("src/app/api/admin/backups/migration/upload/verify/route.ts");
 assert.match(upload,/authorizeApi\(request,"write"/);
 assert.match(upload,/getReader\(\)/);
 assert.match(upload,/LIMIT=2\*1024\*1024\*1024/);
 assert.match(upload,/extractSmnEncryptedZip/);
 assert.match(verify,/verifyUploadedPortableBackup/);
 assert.match(verify,/restorationAuthorized:false/);
 for(const route of [upload,verify])
  assert.doesNotMatch(route,/ALTER DATABASE|DROP DATABASE|DELETE FROM|pg_restore/);
});
test("SMN-441/442: all new controls translated FR and EN",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).backups.transfer;
 const en=JSON.parse(read("src/i18n/en.json")).backups.transfer;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const name of ["title","file","upload","sending","uploaded","verify",
  "verifying","verificationFailed","verified","notActivated"]){
  assert.ok(fr[name]&&en[name],name);
 }
});

test("SMN-441: browser ZIP GET requires admin permission but no Origin header",()=>{
 const source=read("src/app/api/admin/backups/migration/export/route.ts");
 assert.match(source,/authorizeApi\(request,"read",target\)/);
 assert.match(source,/canAccess\(actor,"write",target\)/);
 assert.match(source,/wrapEncryptedBackupInZip\(compressed,id\)/);
});

test("SMN-442: existing destination is inspected and never overwritten by an unqualified ZIP",()=>{
 const source=read("src/app/api/admin/backups/migration/upload/readiness/route.ts");
 const ui=read("src/app/app/admin/backups/migration-import-admin.tsx");
 assert.match(source,/withSessionReadDb/);
 assert.match(source,/containsExistingTables/);
 assert.match(source,/source-receipt-not-in-zip/);
 assert.match(source,/independent-erasure-evidence-not-in-zip/);
 assert.match(source,/automatic-cutover-supervisor-not-qualified/);
 assert.match(source,/restorationAuthorized:false/);
 assert.match(ui,/migration\/upload\/readiness/);
 assert.match(ui,/destinationExisting/);
 assert.doesNotMatch(source,/DROP DATABASE|ALTER DATABASE|pg_restore|DELETE FROM/);
 const fr=JSON.parse(read("src/i18n/fr.json")).backups.transfer;
 const en=JSON.parse(read("src/i18n/en.json")).backups.transfer;
 assert.deepEqual(Object.keys(fr.blockers).sort(),Object.keys(en.blockers).sort());
});
