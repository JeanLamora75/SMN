import assert from "node:assert/strict";
import test from "node:test";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";
import {moveDashboardRow,moveDashboardBlock,deleteDashboardRow,deleteDashboardBlock} from "../src/lib/dashboard-builder/reorder";
import {readFileSync} from "node:fs";
test("SMN-367 AC1/AC4: row reordering preserves all nested identities",()=>{
 const start=createDefaultDashboardLayout("scrum");
 const original=JSON.stringify(start);
 const moved=moveDashboardRow(start,start.rows[0].id,2);
 assert.equal(moved.rows[2].id,start.rows[0].id);
 assert.deepEqual(moved.rows[2].blocks,start.rows[0].blocks);
 assert.equal(JSON.stringify(start),original);
 validateDashboardLayout(moved);
 assert.deepEqual(moveDashboardRow(moved,moved.rows[2].id,0),start);
});
test("SMN-367 AC1: block crosses row boundaries preserving slots",()=>{
 const start=createDefaultDashboardLayout("kanban");
 const block=start.rows[0].blocks[0];
 const moved=moveDashboardBlock(start,block.id,start.rows[1].id,1);
 assert.equal(moved.rows[0].blocks.some(b=>b.id===block.id),false);
 assert.deepEqual(moved.rows[1].blocks[1],block);
 validateDashboardLayout(moved);
 const back=moveDashboardBlock(moved,block.id,start.rows[0].id,0);
 assert.deepEqual(back,start);
});
test("SMN-367 AC2/AC3: source and target boundaries checked",()=>{
 const start=createDefaultDashboardLayout("scrum");
 assert.throws(()=>moveDashboardRow(start,"invalid",0),/invalid/);
 assert.throws(()=>moveDashboardRow(start,start.rows[0].id,-1),/invalid/);
 assert.throws(()=>moveDashboardBlock(start,"missing",start.rows[0].id,0),/invalid/);
 assert.throws(()=>moveDashboardBlock(start,start.rows[0].blocks[0].id,"foreign",0),/invalid/);
 assert.equal(deleteDashboardRow(start,start.rows[0].id).rows.length,start.rows.length-1);
 assert.equal(deleteDashboardBlock(start,start.rows[0].blocks[0].id).rows[0].blocks.length,start.rows[0].blocks.length-1);
});
test("SMN-367 AC2/AC3: always visible keyboard/touch alternatives and pointer handles",()=>{
 const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
 for(const pattern of [/Actions ligne/,/Actions bloc/,/Monter/,/Descendre/,/Ligne précédente/,/Ligne suivante/,/onDragStart/,/onDrop/,/disabled=\{saving\|\|index===0\}/])assert.match(editor,pattern);
});
