import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseKanbanLinkChange} from "../src/server/kanban/qualitative";
const id="9ecce9f4-e830-40e6-bf42-00d87296144a";
describe("Epic 7 C2 — liens qualitatifs explicites",()=>{
 it("accepte seulement une association ou dissociation explicite",()=>{
  assert.deepEqual(parseKanbanLinkChange({itemId:id,action:"link"}),{itemId:id,action:"link"});
  assert.deepEqual(parseKanbanLinkChange({itemId:id,action:"unlink"}),{itemId:id,action:"unlink"});
 });
 it("rejette les champs supplémentaires, les IDs incorrects et les mutations indéfinies",()=>{
  assert.equal(parseKanbanLinkChange({itemId:id,action:"delete"}),null);
  assert.equal(parseKanbanLinkChange({itemId:"fake",action:"link"}),null);
  assert.equal(parseKanbanLinkChange({itemId:id,action:"link",teamId:"other"}),null);
  assert.equal(parseKanbanLinkChange(null),null);
 });
});
