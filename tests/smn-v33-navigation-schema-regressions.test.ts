import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
import {test} from "node:test";
const root=new URL("../",import.meta.url);
const read=(path:string)=>readFileSync(new URL(path,root),"utf8");

test("v33 : aucune page applicative ne refuse explicitement les versions supérieures à v32",()=>{
 const walk=(dir:string):string[]=>readdirSync(new URL(dir,root),{withFileTypes:true}).flatMap(entry=>{
  const path=join(dir,entry.name).replaceAll("\\","/");
  return entry.isDirectory()?walk(path+"/"):entry.isFile()&&entry.name==="page.tsx"?[path]:[];
 });
 const pages=walk("src/app/");
 for(const path of pages){
  const source=read(path);
  assert.doesNotMatch(source,/schema\s*>\s*32\b/,path);
  assert.doesNotMatch(source,/schema_version\s+BETWEEN\s+28\s+AND\s+32\b/i,path);
 }
});

test("v33 : accès contextualisé à la fiche membre et aux opérations de renommage",()=>{
 assert.match(read("src/app/app/admin/members/[id]/page.tsx"),/evaluateSchemaCapability\(schema,"multi-team"\)\.ok/);
 assert.match(read("src/server/sprints/rename.ts"),/i\.schema_version>=28/);
 assert.match(read("src/server/kanban/rename.ts"),/i\.schema_version>=28/);
 assert.match(read("src/server/kanban/rename.ts"),/p\.team_id=\$2/);
});

test("v33 : le registre reste accessible en écriture avec une équipe explicitement contrôlée",()=>{
 const page=read("src/app/app/admin/registries/page.tsx");
 const create=read("src/app/api/admin/registries/route.ts");
 const update=read("src/app/api/admin/registries/[id]/route.ts");
 assert.match(page,/CURRENT_SCHEMA_VERSION/);
 assert.match(create,/schema_version!==33/);
 assert.match(create,/context\.team\?\.team_id!==requestedTeamId/);
 assert.match(update,/\[32,33\]\.includes/);
 assert.match(update,/context\.team\?\.team_id!==requestedTeamId/);
 assert.match(update,/Number\.isSafeInteger\(body\.revision\)/);
});
