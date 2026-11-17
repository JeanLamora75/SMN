import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {formatBriefNumericValue} from "../src/lib/ai-brief-number";

test("AI brief values use no more than two decimals and respect the interface locale",()=>{
 assert.equal(formatBriefNumericValue("29.070588235294117647058824","fr"),"29,07");
 assert.equal(formatBriefNumericValue("29.070588235294117647058824","en"),"29.07");
 assert.equal(formatBriefNumericValue("98.2456140350877192982456","fr"),"98,25");
 assert.equal(formatBriefNumericValue("0.8125","fr"),"0,81");
 assert.equal(formatBriefNumericValue("45.5","fr"),"45,5");
 assert.equal(formatBriefNumericValue("60","fr"),"60");
 assert.equal(formatBriefNumericValue("0","fr"),"0");
 assert.equal(formatBriefNumericValue(null,"fr"),null);
 assert.equal(formatBriefNumericValue("indisponible","fr"),"indisponible");
});
test("AI brief numeric formatting is display-only and does not change the source string",()=>{
 const source="110.9756097560975609756098";
 assert.equal(formatBriefNumericValue(source,"fr"),"110,98");
 assert.equal(source,"110.9756097560975609756098");
});
test("v33 brief table and TXT rows exclude legacy SP fields and format dynamic metrics",()=>{
 const read=(name:string)=>readFileSync(name,"utf8");
 const facts=read("src/server/ai-briefs/facts.ts");
 const resolver=read("src/lib/ai-brief-tag-resolver.ts");
 const page=read("src/app/app/admin/ai-briefs/prepare/page.tsx");
 assert.doesNotMatch(facts,/put\("scrum\.storyPoints\.(committed|completed)"/);
 assert.doesNotMatch(resolver,/"scrum\.storyPoints\.committed","scrum\.storyPoints\.completed"/);
 assert.match(resolver,/formatBriefNumericValue\(x\.value,input\.locale\?\?"fr"\)/);
 assert.match(page,/formatBriefNumericValue\(item\.value,locale\)/);
});
