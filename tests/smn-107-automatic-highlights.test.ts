import test from "node:test";
import assert from "node:assert/strict";
import {automaticHighlightCategories,defaultHighlightCategories,validHighlightConfiguration} from "../src/lib/automatic-highlights";
test("catalogue fixe de six catégories automatiques",()=>{
 assert.deepEqual([...automaticHighlightCategories],["criticalRisk","atRiskDependency","resolvedObstacle","achievedGoal","recordedDecision","satisfiedDependency"]);
 assert.equal(automaticHighlightCategories.length,6);
});
test("cinq premières actives, dépendance satisfaite désactivée",()=>{
 assert.deepEqual(automaticHighlightCategories.map(k=>defaultHighlightCategories[k]),[true,true,true,true,true,false]);
});
test("aucune catégorie non prévue ni valeur non booléenne acceptée",()=>{
 assert.equal(validHighlightConfiguration(defaultHighlightCategories),true);
 assert.equal(validHighlightConfiguration({...defaultHighlightCategories,ceremonyCompleted:true}),false);
 assert.equal(validHighlightConfiguration({...defaultHighlightCategories,criticalRisk:"true"}),false);
});
