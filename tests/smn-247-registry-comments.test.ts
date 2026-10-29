import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {parseNewComment,parseCommentRevision,
 createRegistryComment,reviseRegistryComment,readRegistryComments,readCommentRevisions
} from "../src/server/registries/comments";
import {readFileSync} from "node:fs";

const ID="11111111-1111-4111-8111-111111111111";
const COMMENT="22222222-2222-4222-8222-222222222222";
const file=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
type Calls={sql:string;params?:unknown[]};
const makeDB=(opts:{item?:boolean;comment?:boolean;currentRevision?:number;withdrawn?:boolean;
 table?:boolean;failAudit?:boolean;legacy?:string|null}={})=>{
 const calls:Calls[]=[];
 const db={query:async(sql:string,params?:unknown[])=>{
   if(sql.startsWith("SELECT to_regclass(")&&sql.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  calls.push({sql,params});
  if(opts.failAudit&&sql.includes("INSERT INTO public.smn_registry_comment_revision"))throw Error("audit-failed");
  if(sql.includes("SELECT r.id,r.comment")&&sql.includes("FROM public.smn_registry_item"))
   return {rows:opts.item===false?[]:[{id:ID,comment:opts.legacy??null}]};
  if(sql.includes("SELECT r.id FROM public.smn_registry_item"))
   return {rows:opts.item===false?[]:[{id:ID}]};
  if(sql.includes("SELECT username FROM public.smn_account"))
   return {rows:[{username:"admin.real"}]};
  if(sql.includes("SELECT c.id,c.revision")&&sql.includes("FOR UPDATE"))
   return {rows:opts.comment===false?[]:[{id:COMMENT,revision:opts.currentRevision??1,
    body:"Premier texte",withdrawnAt:opts.withdrawn?"2026-10-25 10:00+00":null}]};
  if(sql.includes("AS installed"))
   return {rows:[{installed:opts.table!==false}]};
  if(sql.includes("SELECT id FROM public.smn_registry_comment"))
   return {rows:opts.comment===false?[]:[{id:COMMENT}]};
  if(sql.includes("FROM public.smn_registry_comment c")&&sql.includes("ORDER BY"))
   return {rows:[]};
  if(sql.includes("FROM public.smn_registry_comment_revision v"))
   return {rows:[]};
  return {rows:[]};
 }} as unknown as Client;
 return {db,calls};
};

test("validation : texte obligatoire, 1..4000 caractères, clés exactes",()=>{
 assert.equal(parseNewComment({text:"  "}),null);
 assert.equal(parseNewComment({text:"x".repeat(4001)}),null);
 assert.deepEqual(parseNewComment({text:"  Suivi réel  "}),{text:"Suivi réel"});
 assert.equal(parseNewComment({text:"Valide",author:"fake"}),null);
 assert.equal(parseCommentRevision({text:"Corrigé",revision:1})?.revision,1);
 assert.equal(parseCommentRevision({text:"Corrigé",revision:0}),null);
 assert.equal(parseCommentRevision({text:"Corrigé",revision:1.5}),null);
});
test("création : acteur authentifié, fiche autorisée, commentaire et audit dans une transaction",async()=>{
 const {db,calls}=makeDB();
 const result=await createRegistryComment(db,"actor-1",ID,{text:"Suivi réel"});
 if(!result.ok)assert.fail("La création doit être confirmée");
 assert.equal(result.revision,1);
 assert.equal(calls[0].sql,"BEGIN");
 assert.equal(calls.at(-1)?.sql,"COMMIT");
 assert.ok(calls.some(c=>c.sql.includes("INSERT INTO public.smn_registry_comment(")));
 assert.ok(calls.some(c=>c.sql.includes("INSERT INTO public.smn_registry_comment_revision")));
 assert.ok(calls.some(c=>c.sql.includes("SELECT username FROM public.smn_account")));
 assert.ok(calls.some(c=>c.params?.includes("actor-1")));
});
test("création : fiche inexistante ou hors équipe, pas d'INSERT",async()=>{
 const {db,calls}=makeDB({item:false});
 const result=await createRegistryComment(db,"actor-1",ID,{text:"Suivi"});
 assert.deepEqual(result,{ok:false,error:"not-found"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert.ok(!calls.some(c=>c.sql.includes("INSERT INTO public.smn_registry_comment(")));
});
test("création : audit en échec annule la transaction et ne déclare pas de succès",async()=>{
 const {db,calls}=makeDB({failAudit:true});
 await assert.rejects(()=>createRegistryComment(db,"actor-1",ID,{text:"Suivi"}));
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert.ok(!calls.some(c=>c.sql==="COMMIT"));
});
test("correction : conservation avant/après, révision suivante et date initiale intacte",async()=>{
 const {db,calls}=makeDB();
 const result=await reviseRegistryComment(db,"actor-2",ID,COMMENT,"edit",{text:"Correction",revision:1});
 assert.deepEqual(result,{ok:true,id:COMMENT,revision:2});
 const audit=calls.find(c=>c.sql.includes("INSERT INTO public.smn_registry_comment_revision"));
 assert.ok(audit);
 assert.ok(audit.params?.includes("Premier texte"));
 assert.ok(audit.params?.includes("Correction"));
 assert.ok(calls.some(c=>c.sql.includes("UPDATE public.smn_registry_comment SET body=")));
 assert.ok(!calls.some(c=>c.sql.includes("created_at=now()")));
 assert.equal(calls.at(-1)?.sql,"COMMIT");
});
test("concurrence : révision obsolète renvoie 409 métier et n'écrit rien",async()=>{
 const {db,calls}=makeDB({currentRevision:2});
 const result=await reviseRegistryComment(db,"actor-2",ID,COMMENT,"edit",{text:"Correction",revision:1});
 assert.deepEqual(result,{ok:false,error:"conflict"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert.ok(!calls.some(c=>/UPDATE public.smn_registry_comment|INSERT INTO public.smn_registry_comment_revision/.test(c.sql)));
});
test("retrait : retrait logique avec trace, aucune suppression physique",async()=>{
 const {db,calls}=makeDB();
 const result=await reviseRegistryComment(db,"actor-2",ID,COMMENT,"withdraw",{revision:1});
 assert.deepEqual(result,{ok:true,id:COMMENT,revision:2});
 assert.ok(calls.some(c=>c.sql.includes("SET withdrawn_at=now()")));
 assert.ok(calls.some(c=>c.params?.includes("withdrawn")));
 assert.ok(!calls.some(c=>/DELETE FROM public.smn_registry_comment/.test(c.sql)));
 assert.equal(calls.at(-1)?.sql,"COMMIT");
});
test("correction/retrait d'un commentaire retiré interdits",async()=>{
 const {db,calls}=makeDB({withdrawn:true});
 const result=await reviseRegistryComment(db,"actor-2",ID,COMMENT,"edit",{text:"Non",revision:1});
 assert.deepEqual(result,{ok:false,error:"withdrawn"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
});
test("édition : audit en échec annule toute correction",async()=>{
 const {db,calls}=makeDB({failAudit:true});
 await assert.rejects(()=>reviseRegistryComment(db,"actor-2",ID,COMMENT,"edit",{text:"Correction",revision:1}));
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
});
test("lecteur historique compatible : commentaire legacy distinct, sans auteur ni date inventés",async()=>{
 const {db,calls}=makeDB({table:false,legacy:"  ancien texte  "});
 const admin=await readRegistryComments(db,ID,true);
 assert.deepEqual(admin,{comments:[],legacy:{text:"  ancien texte  ",author:null,recordedAt:null,origin:"legacy"}});
 assert.equal(calls.some(c=>c.sql.includes("CREATE TABLE")),false);
 const viewer=await readRegistryComments(db,ID,false);
 assert.deepEqual(viewer,{comments:[],legacy:null});
});
test("lecteur : absence de table ≠ enregistrements migrés fictifs",async()=>{
 const {db}=makeDB({table:false});
 const result=await readRegistryComments(db,ID,true);
 assert.deepEqual(result,{comments:[],legacy:null});
});
test("historique des révisions : accès lecture seule, aucun DDL ni mutation",async()=>{
 const {db,calls}=makeDB();
 const result=await readCommentRevisions(db,ID,COMMENT);
 assert.deepEqual(result,{versions:[]});
 assert.ok(calls.some(c=>c.sql.includes("ORDER BY v.revision DESC")));
 assert.ok(!calls.some(c=>/CREATE TABLE|INSERT INTO|UPDATE public|DELETE FROM/.test(c.sql)));
});
test("API : contrôle collectif lecture, admin écriture, audit admin, états 409/503",()=>{
 const collection=file("src/app/api/admin/registries/[id]/comments/route.ts");
 const item=file("src/app/api/admin/registries/[id]/comments/[commentId]/route.ts");
 const versions=file("src/app/api/admin/registries/[id]/comments/[commentId]/revisions/route.ts");
 assert.match(collection,/authorizeApi\(req,"read",\{type:"collective"/);
 assert.match(collection,/authorizeApi\(req,"write",\{type:"settings"/);
 assert.match(item,/authorizeApi\(req,"write",\{type:"settings"/);
 assert.match(versions,/authorizeApi\(req,"read",\{type:"audit"/);
 assert.ok(collection.includes("withLegacyRegistryReadDb"));
 assert.ok(collection.includes("withAuthDb"));
 assert.ok(item.includes('result.error==="conflict"?409'));
 assert.ok(item.includes('result.error==="withdrawn"?409'));
 assert.ok(collection.includes("503"));
});
test("FR/EN : libellés équivalents pour auteurs, versions et retrait",()=>{
 const fr=JSON.parse(file("src/i18n/fr.json")).registryComments;
 const en=JSON.parse(file("src/i18n/en.json")).registryComments;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const k of ["edited","withdrawn","legacy","unknownAuthor","add","edit","withdraw","versions","conflict","unavailable"]){
  assert.ok(fr[k]&&en[k],k);
 }
});

test("lecture collective : texte retiré masqué, trace visible, identité auteur admin uniquement",async()=>{
 const row={id:COMMENT,body:"Texte conservé en base",revision:2,
  authorName:"admin.real",createdAt:"2026-10-25 12:00:00+00",
  editedAt:null,editorName:null,withdrawnAt:"2026-10-25 13:00:00+00",
  withdrawnByName:"admin.real"};
 const db={query:async(sql:string)=>{
   if(sql.startsWith("SELECT to_regclass(")&&sql.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(sql.includes("SELECT r.id,r.comment"))return {rows:[{id:ID,comment:null}]};
  if(sql.includes("AS installed"))return {rows:[{installed:true}]};
  if(sql.includes("FROM public.smn_registry_comment c")&&sql.includes("ORDER BY"))
   return {rows:[row]};
  return {rows:[]};
 }} as unknown as Client;
 const admin=await readRegistryComments(db,ID,true);
 assert.equal(admin?.comments[0].text,null);
 assert.equal(admin?.comments[0].withdrawn,true);
 assert.equal(admin?.comments[0].authorName,"admin.real");
 const user=await readRegistryComments(db,ID,false);
 assert.equal(user?.comments[0].text,null);
 assert.equal(user?.comments[0].authorName,null);
 assert.equal(user?.comments[0].withdrawnAt,row.withdrawnAt);
});
test("correction affichable sans effacer la date de création",async()=>{
 const row={id:COMMENT,body:"Après",revision:2,
  authorName:"admin.real",createdAt:"2026-10-25 12:00:00+00",
  editedAt:"2026-10-25 13:00:00+00",editorName:"admin.editor",
  withdrawnAt:null,withdrawnByName:null};
 const db={query:async(sql:string)=>{
   if(sql.startsWith("SELECT to_regclass(")&&sql.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(sql.includes("SELECT r.id,r.comment"))return {rows:[{id:ID,comment:null}]};
  if(sql.includes("AS installed"))return {rows:[{installed:true}]};
  if(sql.includes("FROM public.smn_registry_comment c")&&sql.includes("ORDER BY"))
   return {rows:[row]};
  return {rows:[]};
 }} as unknown as Client;
 const read=await readRegistryComments(db,ID,true);
 assert.equal(read?.comments[0].text,"Après");
 assert.equal(read?.comments[0].edited,true);
 assert.equal(read?.comments[0].createdAt,row.createdAt);
 assert.equal(read?.comments[0].editorName,"admin.editor");
});
test("versions : ancienne/nouvelle valeur, auteur réel et chronologie de révision",async()=>{
 const versions=[{revision:2,action:"edited",beforeText:"Avant",afterText:"Après",
  actorName:"admin.editor",changedAt:"2026-10-25 13:00:00+00"}];
 const db={query:async(sql:string)=>{
   if(sql.startsWith("SELECT to_regclass(")&&sql.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(sql.includes("SELECT r.id,r.comment"))return {rows:[{id:ID,comment:null}]};
  if(sql.includes("AS installed"))return {rows:[{installed:true}]};
  if(sql.includes("SELECT id FROM public.smn_registry_comment"))
   return {rows:[{id:COMMENT}]};
  if(sql.includes("FROM public.smn_registry_comment_revision v"))
   return {rows:versions};
  return {rows:[]};
 }} as unknown as Client;
 assert.deepEqual(await readCommentRevisions(db,ID,COMMENT),{versions});
});
test("lecture d'un commentaire avec fiche manquante ne crée aucune table",async()=>{
 const {db,calls}=makeDB({item:false});
 assert.equal(await readRegistryComments(db,ID,false),null);
 assert.equal(calls.some(c=>/CREATE TABLE|INSERT INTO/.test(c.sql)),false);
});
