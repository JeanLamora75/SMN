import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=(file:string)=>readFileSync(
 new URL("../src/app/app/admin/registries/"+file,import.meta.url),"utf8"
);

test("chargements des liens, relations et candidats : état déduit de la requête courante",()=>{
 for(const file of ["action-links.tsx","registry-relations.tsx","registry-target-search.tsx"]){
  const code=source(file);
  assert.match(code,/const requestKey=/,file);
  assert.match(code,/loaded\?\.key===requestKey\?loaded\.state:"loading"/,file);
  assert.match(code,/if\(!(?:ctrl|controller)\.signal\.aborted\)/,file);
  assert.doesNotMatch(code,/const (?:ctrl|controller)=new AbortController\(\);\s*setState\("loading"\)/,file);
 }
});

test("cycles : les anciennes données sont masquées jusqu'à la fin de la nouvelle requête",()=>{
 const code=source("registry-cycles.tsx");
 assert.match(code,/loadedKey===requestKey\?data:null/);
 assert.match(code,/loadedKey===requestKey\?error:false/);
 assert.match(code,/setLoadedKey\(requestKey\)/);
 assert.doesNotMatch(code,/const controller=new AbortController\(\);\s*setData\(null\)/);
 assert.match(code,/controller\.abort\(\)/);
});

test("historique : chargement initial, pagination et réessai sans mise à jour dans l'effet",()=>{
 const code=source("registry-history.tsx");
 assert.match(code,/useState<"loading"\|"ready"\|"unavailable">\("loading"\)/);
 assert.match(code,/onClick=\{\(\)=>\{setState\("loading"\);setRetry\(/);
 assert.match(code,/onClick=\{\(\)=>\{setState\("loading"\);setPage\(/);
 assert.doesNotMatch(code,/if\(page===1\)setState\("loading"\)/);
});

test("relations : tableau vide stable pour le regroupement mémorisé",()=>{
 const code=source("registry-relations.tsx");
 assert.match(code,/const emptyRelations:RegistryRelation\[\]=\[\]/);
 assert.match(code,/loaded\?\.key===requestKey\?loaded\.items:emptyRelations/);
});
