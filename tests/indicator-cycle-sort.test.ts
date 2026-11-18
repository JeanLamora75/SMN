import assert from "node:assert/strict";
import {test} from "node:test";
import {nextIndicatorCycleSort,sortIndicatorCycles,type SortableIndicatorCycle} from "../src/app/app/admin/indicators/indicator-cycle-sort";

const cycles:SortableIndicatorCycle[]=[
 {id:"s-92",name:"Sprint 92",status:"finished",startAt:"2026-04-27",endAt:"2026-05-10",values:{points:"31.23",tickets:"19"}},
 {id:"s-105",name:"Sprint 105",status:"active",startAt:"2026-11-09",endAt:"2026-11-22",values:{points:"57.5",tickets:"10"}},
 {id:"s-99",name:"Sprint 99",status:"finished",startAt:"2026-08-10",endAt:"2026-08-23",values:{points:null,tickets:"2"}},
 {id:"s-104",name:"Sprint 104",status:"finished",startAt:"2026-10-26",endAt:"2026-11-08",values:{points:"100.5",tickets:"21"}},
 {id:"s-106",name:"Sprint 106",status:"planned",startAt:"2026-11-23",endAt:"2026-12-06",values:{points:"0",tickets:null}}
];
const ids=(list:readonly SortableIndicatorCycle[])=>list.map(c=>c.id);

test("default: active sprint first then newest to oldest, without mutating API data",()=>{
 const original=ids(cycles);
 assert.deepEqual(ids(sortIndicatorCycles(cycles,null)),["s-105","s-106","s-104","s-99","s-92"]);
 assert.deepEqual(ids(cycles),original);
});
test("first click descending, next click ascending, new column resets to descending",()=>{
 const first=nextIndicatorCycleSort(null,"points");
 assert.deepEqual(first,{key:"points",direction:"desc"});
 assert.deepEqual(nextIndicatorCycleSort(first,"points"),{key:"points",direction:"asc"});
 assert.deepEqual(nextIndicatorCycleSort(nextIndicatorCycleSort(first,"points"),"tickets"),{key:"tickets",direction:"desc"});
});
test("indicator sorts are numeric, zero is a value and null stays last in both directions",()=>{
 assert.deepEqual(ids(sortIndicatorCycles(cycles,{key:"points",direction:"desc"})),["s-104","s-105","s-92","s-106","s-99"]);
 assert.deepEqual(ids(sortIndicatorCycles(cycles,{key:"points",direction:"asc"})),["s-106","s-92","s-105","s-104","s-99"]);
});
test("cycle names sort naturally, period chronologically and statuses lexically",()=>{
 assert.deepEqual(ids(sortIndicatorCycles(cycles,{key:"cycle",direction:"desc"})),["s-106","s-105","s-104","s-99","s-92"]);
 assert.deepEqual(ids(sortIndicatorCycles(cycles,{key:"period",direction:"asc"})),["s-92","s-99","s-104","s-105","s-106"]);
 assert.deepEqual(ids(sortIndicatorCycles(cycles,{key:"status",direction:"asc"}))[0],"s-105");
});
