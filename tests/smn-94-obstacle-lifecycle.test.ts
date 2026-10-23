import test from "node:test";
import assert from "node:assert/strict";
import {obstacleStatuses,obstacleTransition,obstacleNeedsAttention} from "../src/lib/obstacle-lifecycle";
import {registryStatuses} from "../src/lib/registry-types";
test("les quatre statuts contractuels sont disponibles",()=>{
 assert.deepEqual([...registryStatuses.obstacle],[...obstacleStatuses]);
});
test("résolution puis réouverture sans perte de l'état précédent",()=>{
 assert.deepEqual(obstacleTransition("in_progress","resolved"),{valid:true,changed:true,reopened:false});
 assert.deepEqual(obstacleTransition("resolved","open"),{valid:true,changed:true,reopened:true});
 assert.deepEqual(obstacleTransition("abandoned","in_progress"),{valid:true,changed:true,reopened:true});
 assert.equal(obstacleTransition("resolved","unknown").valid,false);
});
test("points d'attention : ouvert et en cours uniquement",()=>{
 for(const status of obstacleStatuses){
  assert.equal(obstacleNeedsAttention(status),status==="open"||status==="in_progress");
 }
});
