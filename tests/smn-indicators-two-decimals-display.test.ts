import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {formatIndicatorValue,formatIndicatorMeasurement} from "../src/lib/indicators/format-value";
import {calculateFormula} from "../src/server/indicators/formula";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("IND-17 : arrondi décimal HALF_UP, au maximum 2 décimales, virgule française",()=>{
 assert.equal(formatIndicatorValue("57.3913043478260869565217"),"57,39");
 assert.equal(formatIndicatorValue("12.345"),"12,35");
 assert.equal(formatIndicatorValue("-12.345"),"-12,35");
 assert.equal(formatIndicatorValue("-0.005"),"-0,01");
 assert.equal(formatIndicatorValue("1.0049"),"1");
 assert.equal(formatIndicatorValue("103"),"103");
 assert.equal(formatIndicatorValue("17.500000000000000000000"),"17,5");
 assert.equal(formatIndicatorValue("0.000003"),"0");
 assert.equal(formatIndicatorValue("-0.004"),"0");
 assert.equal(formatIndicatorValue("999.999"),"1000");
 assert.equal(formatIndicatorValue(1e-7),"0");
 assert.equal(formatIndicatorValue(null),"—");
 assert.equal(formatIndicatorMeasurement(null,"%"),"—");
 assert.equal(formatIndicatorMeasurement("57.3913043478260869","%"),"57,39 %");
 assert.equal(formatIndicatorValue("12.345","en"),"12.35");
});
test("La précision interne des formules et des dépendances reste inchangée",()=>{
 const result=calculateFormula("10 / 3");
 assert.equal(result.kind,"available");
 if(result.kind==="available"){
  assert.ok(result.value.startsWith("3.3333333333333"));
  assert.equal(formatIndicatorValue(result.value),"3,33");
 }
});
test("Le formateur est utilisé par le tableau, les tendances, les prévisualisations et le Dashboard Builder",()=>{
 const targets=[
  "src/app/app/admin/indicators/indicator-cycles.tsx",
  "src/app/app/admin/indicators/indicator-trends.tsx",
  "src/app/app/admin/indicators/universal-input.tsx",
  "src/app/app/dashboard-builder/dashboard-visualization.tsx"
 ];
 for(const path of targets)assert.match(read(path),/formatIndicatorValue|formatIndicatorMeasurement/,path);
 assert.doesNotMatch(read("src/app/app/dashboard-builder/dashboard-visualization.tsx"),/maximumFractionDigits:3/);
 assert.doesNotMatch(read("src/app/app/admin/indicators/indicator-trends.tsx"),/maximumFractionDigits:3/);
});
