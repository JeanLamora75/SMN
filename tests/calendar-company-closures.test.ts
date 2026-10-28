import assert from "node:assert/strict";
import test from "node:test";
import {projectCentralCalendar} from "../src/server/members/central-calendar";
import type {TeamCalendarResponse} from "../src/server/members/team-calendar";

const closure={id:"c1",name:"Fermeture annuelle",startOn:"2026-12-24",endOn:"2026-12-25",
 companyId:"co1",companyName:"Entreprise A",companyColor:"blue",
 members:[{id:"m1",name:"Alice"}]};
function fixture():TeamCalendarResponse{return {
 team:{id:"t1",name:"Équipe",mode:"scrum"},start:"2026-12-24",end:"2026-12-30",
 days:7,kind:"all",closures:[closure],collective:[],
 admin:{categories:[],members:[]}
};}
test("la fermeture est informative et indépendante des absences",()=>{
 const calendar=projectCentralCalendar(fixture(),true);
 const items=calendar.items.filter(x=>x.type==="closure");
 assert.equal(items.length,2);
 assert.equal(items[0].companyName,"Entreprise A");
 assert.equal(items[0].companyColor,"blue");
 assert.equal(items[0].members?.length,1);
 assert.equal(calendar.items.some(x=>x.type==="absence"),false);
});
test("aucun nom de membre transmis en projection non admin",()=>{
 const calendar=projectCentralCalendar(fixture(),false);
 assert.deepEqual(calendar.items.find(x=>x.type==="closure")?.members,[]);
});
