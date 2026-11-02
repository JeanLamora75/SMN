import assert from "node:assert/strict";
import {test} from "node:test";
import {absenceApplies,roleShare,computeDevelopmentDay} from "../src/server/capacity/engine";

const shares={developer_percent:40,scrum_master_percent:30,product_owner_percent:30};
test("each Scrum role uses its own effective contribution share",()=>{
 assert.equal(roleShare(shares,"DEVELOPER"),40);
 assert.equal(roleShare(shares,"SCRUM_MASTER"),30);
 assert.equal(roleShare(shares,"PRODUCT_OWNER"),30);
 assert.equal(roleShare(shares,undefined),40);
 assert.equal(computeDevelopmentDay(2,8,100,roleShare(shares,"SCRUM_MASTER"),100)?.jh,0.3);
});
test("planned and unforeseen absences have explicit independent impact",()=>{
 assert.equal(absenceApplies(true,"none"),false);
 assert.equal(absenceApplies(false,"none"),false);
 assert.equal(absenceApplies(true,"planned"),true);
 assert.equal(absenceApplies(false,"planned"),false);
 assert.equal(absenceApplies(true,"all"),true);
 assert.equal(absenceApplies(false,"all"),true);
 assert.equal(absenceApplies(false,undefined),true);
});
