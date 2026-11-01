import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("session revalidation uses dedicated read-only connection without schema upgrade or calendar preload",()=>{
 const session=read("src/server/auth/session.ts");
 const db=read("src/server/auth/database.ts");
 const credentials=read("src/server/auth/credentials.ts");
 assert.match(session,/withSessionReadDb\(client => accountById\(client, session\.accountId\)\)/);
 assert.match(db,/export async function withSessionReadDb/);
 const method=db.slice(db.indexOf("export async function withSessionReadDb"));
 assert.match(method,/BEGIN TRANSACTION READ ONLY/);
 assert.doesNotMatch(method,/ensureAccountsSchema|ensureReferenceNationalCalendar/);
 assert.match(credentials,/i\.state='initialized' AND a\.is_active=true/);
 assert.match(session,/passwordFingerprint\(account\.password_hash\) !== session\.passwordFingerprint/);
 assert.match(session,/account\.role !== session\.role/);
});
