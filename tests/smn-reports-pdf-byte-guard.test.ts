import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("le téléchargement PDF vérifie la présence des octets avant de construire la réponse",()=>{
 const route=readFileSync(new URL("../src/app/api/admin/reports/sprints/[id]/documents/[documentId]/pdf/route.ts",import.meta.url),"utf8");
 const branch=route.indexOf('if("bytes" in result){');
 const guard=route.indexOf('if(result.bytes===undefined)',branch);
 const response=route.indexOf("new Response(new Uint8Array(result.bytes)",branch);
 assert.ok(branch>=0&&guard>branch&&response>guard);
 assert.match(route,/if\(result\.bytes===undefined\)return jsonResult\(\{error:"pdf-render-unavailable"\},503\);/);
 assert.match(route,/"Content-Type":"application\/pdf"/);
 assert.match(route,/"Cache-Control":"private, no-store"/);
});
