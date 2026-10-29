import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {parseRegistryFilters,readRegistryPage} from "../src/server/registries/list";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("le lecteur enrichit les vraies fiches sans exposer le responsable au rôle user",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("to_regclass"))return {rows:[{present:true}]};
  if(sql.includes("FROM public.smn_team t"))return {rows:[{id:"t1",name:"Team",mode:"scrum"}]};
  if(sql.includes("COUNT(*)"))return {rows:[{total:1}]};
  return {rows:[{
   id:"i1",type:"risk",title:"Risque enregistré",description:"Description réelle",
   status:"open",occurredOn:"2026-10-25",dueOn:null,recordedAt:"2026-10-25T09:00:00Z"
  }]};
 }} as unknown as Client;
 const page=await readRegistryPage(db,parseRegistryFilters(new URLSearchParams())!,false);
 assert.equal(page.state,"available");
 if(page.state!=="available")return;
 assert.equal(page.items.length,1);
 const query=statements.find(sql=>sql.includes("LIMIT 25"))!;
 assert.match(query,/r\.description/);
 assert.doesNotMatch(query,/r\.owner_name AS "owner"/);
 assert.match(query,/r\.team_id=\$1/);
 assert.equal((page.items[0] as {description:string}).description,"Description réelle");
});

test("les six icônes proviennent du composant Bootstrap Icons existant",()=>{
 const row=source("src/app/app/admin/registries/registry-list-row.tsx");
 assert.match(row,/import BootstrapIcon from/);
 for(const [kind,icon] of Object.entries({
  risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
  dependency:"stack",decision:"bullseye",action:"ticket-perforated-fill",highlight:"bell-fill"
 }))assert.ok(row.includes(kind+':"'+icon+'"'),kind);
 assert.match(row,/aria-hidden="true"/);
});

test("le titre est un vrai lien, la description est tronquée uniquement visuellement",()=>{
 const row=source("src/app/app/admin/registries/registry-list-row.tsx");
 const css=source("src/app/globals.css");
 assert.match(row,/className="smn-registry-row-title"/);
 assert.match(row,/href=\{href\}/);
 assert.match(row,/item\.description/);
 assert.match(css,/\.smn-registry-row-description/);
 assert.match(css,/-webkit-line-clamp:2/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.ok(!row.includes("slice(0,"),"le contenu ne doit pas être raccourci dans le DOM");
});

test("la ligne sépare type, statut, dates, responsable autorisé et actions clavier",()=>{
 const row=source("src/app/app/admin/registries/registry-list-row.tsx");
 assert.match(row,/smn-registry-row-type/);
 assert.match(row,/smn-registry-row-status/);
 assert.match(row,/canManage&&<td/);
 assert.match(row,/item\.dueOn&&/);
 assert.match(row,/<time dateTime=\{item\.dueOn\}/);
 assert.match(row,/<details className="smn-registry-row-actions">/);
 assert.match(row,/<summary/);
 assert.match(row,/aria-label=\{t\("registryList\.actionsFor"/);
});

test("attention calculée par SMN-104 uniquement, jamais depuis le statut ou le type",()=>{
 const list=source("src/app/app/admin/registries/registry-list.tsx");
 const row=source("src/app/app/admin/registries/registry-list-row.tsx");
 assert.match(list,/fetch\("\/api\/admin\/registries\/attention\?"\+new URLSearchParams\(\{teamId\}\)/);
 assert.match(list,/attentionError/);
 assert.match(list,/attention\?\.filter\(signal=>signal\.id===item\.id\)/);
 assert.ok(!row.includes('item.status==="open"')&&!row.includes('item.type==="risk"'));
 assert.match(row,/signals\.map\(/);
 assert.match(row,/registryAttention\./);
 assert.match(source("src/app/app/admin/registries/attention-cockpit.tsx"),/countUnavailable/);
});

test("liste FR/EN : nouvelles clés cohérentes et absence de données inventées",()=>{
 const fr=JSON.parse(source("src/i18n/fr.json"));
 const en=JSON.parse(source("src/i18n/en.json"));
 for(const key of ["due","actions","actionsFor","openRecord","editRecord","notProvided","attentionUnavailable"]){
  assert.ok(fr.registryList[key],key+" français");
  assert.ok(en.registryList[key],key+" anglais");
 }
 const row=source("src/app/app/admin/registries/registry-list-row.tsx");
 assert.ok(!row.includes("example"));
 assert.ok(!row.includes("sample"));
});

test("responsive : lignes refluées sans scroll horizontal imposé",()=>{
 const list=source("src/app/app/admin/registries/registry-list.tsx");
 const css=source("src/app/globals.css");
 assert.match(list,/smn-registry-list-table/);
 assert.match(css,/@media\(max-width:991px\)/);
 assert.match(css,/\.smn-registry-list-table tbody tr\{display:grid/);
 assert.ok(!list.includes('className="table-responsive"'));
});
