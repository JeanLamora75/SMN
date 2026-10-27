import assert from "node:assert/strict";
import test from "node:test";
import {
  canArchiveTeam,
  canChangeAgileMode,
  historicalAgileMode,
  isAgileMode,
  modeIsLocked,
} from "../src/lib/team-agile-mode";

test("creation accepts only explicitly supported modes", () => {
  assert.equal(isAgileMode("scrum"), true);
  assert.equal(isAgileMode("kanban"), true);
  assert.equal(isAgileMode(undefined), false);
  assert.equal(isAgileMode(null), false);
  assert.equal(isAgileMode("SCRUM"), false);
});

test("historical import keeps reliable team mode then installation mode", () => {
  assert.equal(historicalAgileMode("kanban", "scrum"), "kanban");
  assert.equal(historicalAgileMode(null, "kanban"), "kanban");
  assert.equal(historicalAgileMode(null, null), "scrum");
});

test("first cycle locks the mode permanently, even after cycle removal", () => {
  assert.equal(modeIsLocked(true), true);
  assert.equal(canChangeAgileMode("scrum", "kanban", true), false);
  assert.equal(canChangeAgileMode("scrum", "scrum", true), true);
  assert.equal(canChangeAgileMode("scrum", "kanban", false), true);
});

test("last active team cannot be archived", () => {
  assert.equal(canArchiveTeam(true, 1), false);
  assert.equal(canArchiveTeam(true, 2), true);
  assert.equal(canArchiveTeam(false, 2), false);
  assert.equal(canArchiveTeam(true, 0), false);
});
