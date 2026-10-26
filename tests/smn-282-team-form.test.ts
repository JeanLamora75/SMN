import {test} from "node:test";
import assert from "node:assert/strict";
import {parseTeamCreate} from "../src/lib/team-form";
test("nom d'équipe obligatoire",()=>{assert.equal(parseTeamCreate({name:" "}),null);});
