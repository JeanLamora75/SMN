import test from "node:test";
import assert from "node:assert/strict";
import {actionIsLate,changeActionLink} from "../src/server/registries/action-links";
import type {Client} from "pg";
test("une échéance absente n'est jamais en retard",()=>{
 assert.equal(actionIsLate("todo",null,"2026-10-23"),false);
 assert.equal(actionIsLate("todo","2026-10-20","2026-10-23"),true);
 assert.equal(actionIsLate("completed","2026-10-20","2026-10-23"),false);
});
test("lien vers décision/obstacle, transaction et audit sans statut voisin modifié",async()=>{
 const calls:string[]=[];
 const db={query:async(q:string)=>{calls.push(q);if(q.startsWith("SELECT to_regclass(")&&q.endsWith(" AS present"))return {rows:[{present:"migrated"}]};return {rows:q.includes("SELECT a.id FROM public.smn_registry_item")?[{id:"a"}]:[]};}} as unknown as Client;
 const id="11111111-1111-4111-8111-111111111111";
 const related="22222222-2222-4222-8222-222222222222";
 assert.deepEqual(await changeActionLink(db,"admin",id,related,"linked"),{ok:true});
 assert.equal(calls.at(-1),"COMMIT");
 assert.ok(calls.some(q=>q.includes("smn_action_link_audit")));
 assert.ok(!calls.some(q=>q.includes("UPDATE public.smn_registry_item")));
});
