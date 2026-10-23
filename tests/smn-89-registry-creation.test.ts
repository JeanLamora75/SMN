import test from "node:test";
import assert from "node:assert/strict";
import {parseRegistryInput,registryTypes,registryStatuses,validDate} from "../src/server/registries/items";
const base={teamId:"team-1",title:"  Un sujet  ",occurredOn:"2026-10-23"};
test("six categories et statuts propres",()=>{
 assert.equal(registryTypes.length,6);
 for(const type of registryTypes){
  const parsed=parseRegistryInput({...base,type});
  assert.ok(parsed);
  assert.equal(parsed.title,"Un sujet");
  assert.equal(parsed.status,registryStatuses[type][0]);
  for(const status of registryStatuses[type])assert.equal(parseRegistryInput({...base,type,status})?.status,status);
 }
});
test("date civile stricte, titre et champs facultatifs",()=>{
 assert.equal(validDate("2026-02-29"),false);
 assert.equal(validDate("2024-02-29"),true);
 assert.equal(parseRegistryInput({...base,type:"risk",title:" "}),null);
 assert.equal(parseRegistryInput({...base,type:"risk",dueOn:"2026-02-30"}),null);
 assert.equal(parseRegistryInput({...base,type:"risk",status:"cancelled"}),null);
 const result=parseRegistryInput({...base,type:"dependency"});
 assert.equal(result?.dueOn,null);assert.equal(result?.owner,null);
 assert.equal(result?.description,null);assert.equal(result?.comment,null);
});
test("aucun lien à un cycle obligatoire",()=>{
 const result=parseRegistryInput({...base,type:"risk"});
 assert.ok(result);assert.equal(Object.hasOwn(result,"sprintId"),false);
});
