import test from "node:test";
import assert from "node:assert/strict";
import {readdirSync} from "node:fs";
import {join,relative,sep} from "node:path";

const ROOT=join(process.cwd(),"src","app");
const FILES=new Set(["route.ts","route.tsx","page.ts","page.tsx","layout.ts","layout.tsx","default.tsx"]);
const dynamic=/^\[(?:\[?\.\.\.)?([^\]]+)\]\]?$/;

function collect(root){
 const files=[];
 function visit(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   const path=join(dir,entry.name);
   if(entry.isDirectory())visit(path);
   else if(entry.isFile()&&FILES.has(entry.name))files.push(path);
  }
 }
 visit(root);return files;
}

function check(routes){
 const names=new Map(),conflicts=[];
 for(const route of routes){
  const folders=relative(ROOT,route).split(sep).slice(0,-1);
  for(let index=0;index<folders.length;index++){
   const match=dynamic.exec(folders[index]);
   if(!match)continue;
   const parent=folders.slice(0,index).map(v=>dynamic.test(v)?"[dynamic]":v).join("/");
   const key=parent+"/"+(folders[index].startsWith("[[...")?"optional-catch-all":folders[index].startsWith("[...")?"catch-all":"dynamic");
   const prev=names.get(key);
   if(prev&&prev.name!==match[1])conflicts.push({key,first:prev.route,second:route,name1:prev.name,name2:match[1]});
   else names.set(key,{name:match[1],route});
  }
 }
 return conflicts;
}

test("all Next.js route siblings share the same dynamic slug name",()=>{
 const conflicts=check(collect(ROOT));
 assert.deepEqual(conflicts,[],"Next.js rejects sibling routes that use different names such as [id] and [sprintId]");
});
test("ceremonies bulk uses the same sprint slug as PATCH and other sprint endpoints",()=>{
 const routes=collect(ROOT).map(x=>relative(ROOT,x).split(sep).join("/"));
 assert.ok(routes.includes("api/admin/sprints/[id]/route.ts"));
 assert.ok(routes.includes("api/admin/sprints/[id]/ceremonies-bulk/route.ts"));
 assert.ok(!routes.includes("api/admin/sprints/[sprintId]/ceremonies-bulk/route.ts"));
});
