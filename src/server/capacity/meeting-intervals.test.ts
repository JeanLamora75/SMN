import test from "node:test";
import assert from "node:assert/strict";
import {unionDurationMinutes,capacityImpactJh} from "./meeting-intervals";
const minute=60000;
test("chevauchements ne sont pas déduits deux fois",()=>{
 assert.equal(unionDurationMinutes([{start:0,end:60*minute},{start:30*minute,end:90*minute}],{start:0,end:120*minute}),90);
});
test("plages hors fenêtre exclues",()=>{
 assert.equal(unionDurationMinutes([{start:-30*minute,end:15*minute},{start:80*minute,end:150*minute}],{start:0,end:120*minute}),55);
});
test("les JH tiennent compte des quotités",()=>{
 assert.equal(capacityImpactJh(120,8,{allocationPercent:80,developerPercent:50,contributionPercent:100}),0.1);
});
test("données incohérentes refusées",()=>{
 assert.throws(()=>unionDurationMinutes([{start:5,end:4}],{start:0,end:10}));
 assert.throws(()=>capacityImpactJh(60,8,{allocationPercent:110,developerPercent:100,contributionPercent:100}));
});
