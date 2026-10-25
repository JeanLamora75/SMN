import assert from "node:assert/strict";
import {test} from "node:test";
import {utcOffsetLabel} from "../src/lib/iana-utc-offset";
test("UTC offset labels are normalized",()=>{
 assert.equal(utcOffsetLabel("UTC",new Date("2026-01-15T12:00:00Z")),"UTC+00:00");
 assert.equal(utcOffsetLabel("Europe/Paris",new Date("2026-01-15T12:00:00Z")),"UTC+01:00");
 assert.equal(utcOffsetLabel("Europe/Paris",new Date("2026-07-15T12:00:00Z")),"UTC+02:00");
 assert.equal(utcOffsetLabel("Asia/Kolkata",new Date("2026-07-15T12:00:00Z")),"UTC+05:30");
 assert.equal(utcOffsetLabel("America/New_York",new Date("2026-01-15T12:00:00Z")),"UTC-05:00");
});
