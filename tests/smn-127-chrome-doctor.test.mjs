import test from "node:test";
import assert from "node:assert/strict";
import {chromeCandidates} from "../scripts/report-chrome.mjs";
test("explicit Chrome executable overrides system locations",()=>{
 const paths=chromeCandidates({SMN_CHROME_PATH:"C:\\Custom\\chrome.exe",PROGRAMFILES:"C:\\Program Files"},"win32");
 assert.deepEqual(paths,["C:\\Custom\\chrome.exe"]);
});
test("Windows Chrome paths require no administrator install",()=>{
 const paths=chromeCandidates({PROGRAMFILES:"C:\\Program Files",LOCALAPPDATA:"C:\\Users\\test\\AppData\\Local"},"win32");
 assert.ok(paths.some(x=>x.includes("AppData")&&x.endsWith("chrome.exe")));
});
test("fallback paths are deterministic on linux",()=>{
 assert.ok(chromeCandidates({},"linux").includes("/usr/bin/google-chrome"));
});
