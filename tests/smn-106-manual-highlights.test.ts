import test from "node:test";
import assert from "node:assert/strict";
import {parseRegistryInput} from "../src/server/registries/items";
import {parseRegistryFilters} from "../src/server/registries/list";
test("fait manuel : date métier choisie, titre requis, contexte facultatif",()=>{
 const item=parseRegistryInput({teamId:"team",type:"highlight",title:"  Incident important  ",occurredOn:"2026-10-02",status:"recorded",description:null,owner:null,dueOn:null,comment:null});
 assert.equal(item?.occurredOn,"2026-10-02");
 assert.equal(item?.title,"Incident important");
 assert.equal(item?.description,null);
 assert.equal(parseRegistryInput({teamId:"team",type:"highlight",title:" ",occurredOn:"2026-10-02",status:"recorded"}),null);
});
test("filtre faits marquants conservé",()=>{
 const filters=parseRegistryFilters(new URLSearchParams({type:"highlight",page:"2",search:"incident"}));
 assert.equal(filters?.type,"highlight");assert.equal(filters?.search,"incident");assert.equal(filters?.page,2);
});
