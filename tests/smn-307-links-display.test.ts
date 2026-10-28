import assert from "node:assert/strict";
import test from "node:test";
import {filterLinks,type LinkEntry} from "../src/lib/links-display";
const base={url:"https://example.org",description:null,scope:"TRANSVERSE" as const,teamId:null,categoryId:"cat_a",categoryName:"Guides",revision:1};
const links:LinkEntry[]=[
 {...base,id:"1",title:"Beta",updatedAt:"2026-10-20T09:00:00Z"},
 {...base,id:"2",title:"Alpha",scope:"EQUIPE",teamId:"team_a",categoryId:"cat_b",categoryName:"Outils",updatedAt:"2026-10-25T09:00:00Z"}
];
test("defaults to alphabetical order without modifying source",()=>{
 assert.deepEqual(filterLinks(links,{search:"",scope:"all",category:"all",sort:"title"}).map(x=>x.id),["2","1"]);
 assert.equal(links[0].id,"1");
});
test("filters search, team scope and category jointly",()=>{
 assert.deepEqual(filterLinks(links,{search:"Alpha",scope:"EQUIPE",category:"cat_b",sort:"title"}).map(x=>x.id),["2"]);
 assert.equal(filterLinks(links,{search:"Alpha",scope:"TRANSVERSE",category:"all",sort:"title"}).length,0);
});
test("recent sorts by update timestamps, not random ids",()=>{
 assert.deepEqual(filterLinks(links,{search:"",scope:"all",category:"all",sort:"recent"}).map(x=>x.id),["2","1"]);
});
