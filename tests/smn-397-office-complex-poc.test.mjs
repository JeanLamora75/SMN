import test from "node:test";
import assert from "node:assert/strict";
import { readZip, writeZip } from "../scripts/smn-397-office-poc.mjs";
import { expandTableRows, expandOfficeTables, replaceLinkedPng } from "../scripts/smn-397-office-complex-poc.mjs";

const word = '<w:tbl><w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>{{ROW:PEOPLE}}</w:t><w:t>{{NAME}}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>{{DAYS}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';
const ppt = '<a:tbl><a:tr h="250000"><a:tc><a:txBody><a:p><a:r><a:t>{{ROW:PEOPLE}}</a:t><a:t>{{NAME}}</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>{{DAYS}}</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl>';
const people = [{ NAME: "Alice", DAYS: 10 }, { NAME: "Bob", DAYS: 0 }, { NAME: "Charlie & Co", DAYS: 5 }];

test("Word rows 0/1/N: styles, zero and XML escaping", () => {
  for (const n of [0, 1, 3]) {
    const result = expandTableRows(word, "docx", { PEOPLE: people.slice(0, n) });
    assert.equal(result.tables, 1);
    assert.equal((result.xml.match(/<w:tr>/g) || []).length, Math.max(1, n));
    assert.equal((result.xml.match(/<w:cantSplit\/>/g) || []).length, Math.max(1, n));
    assert.doesNotMatch(result.xml, /\{\{ROW:PEOPLE\}\}/);
    if (n === 0) assert.match(result.xml, /N\/D/);
    if (n === 3) assert.match(result.xml, /Charlie &amp; Co/);
  }
});

test("PowerPoint rows preserve explicit height and reject merged cells", () => {
  const result = expandTableRows(ppt, "pptx", { PEOPLE: people });
  assert.equal((result.xml.match(/<a:tr h="250000">/g) || []).length, 3);
  assert.equal((result.xml.match(/<a:tc>/g) || []).length, 6);
  assert.throws(() => expandTableRows(ppt.replace('h="250000"', 'h="250000" rowSpan="2"'), "pptx", { PEOPLE: people }));
});

test("Table expansion modifies only a target XML package part", () => {
  for (const format of ["docx", "pptx"]) {
    const name = format === "docx" ? "word/document.xml" : "ppt/slides/slide1.xml";
    const parts = [
      { name: "[Content_Types].xml", data: Buffer.from("<Types/>") },
      { name, data: Buffer.from(format === "docx" ? word : ppt) },
      { name: "docProps/core.xml", data: Buffer.from('<core fixed="yes"/>') },
    ];
    const source = writeZip(parts);
    const result = expandOfficeTables(source, format, { PEOPLE: people });
    const before = new Map(readZip(source).map(p => [p.name, p.data]));
    const after = new Map(readZip(result.output).map(p => [p.name, p.data]));
    assert.equal(result.changed.length, 1);
    assert.deepEqual(before.get("docProps/core.xml"), after.get("docProps/core.xml"));
    assert.match(after.get(name).toString(), /Alice/);
  }
});

test("Unknown source unchanged, technical ceiling rejects rather than truncates", () => {
  assert.equal(expandTableRows(word, "docx", {}).xml, word);
  assert.throws(() => expandTableRows(word, "docx", { PEOPLE: Array(10001).fill({ NAME: "X" }) }), /Protection technique/);
});

test("Linked PNG replacement preserves shape dimensions and all relationships", () => {
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), Buffer.alloc(40)]);
  const source = writeZip([
    { name: "ppt/slides/slide1.xml", data: Buffer.from('<a:blip r:embed="rId9"/><a:xfrm><a:ext cx="200" cy="100"/></a:xfrm>') },
    { name: "ppt/media/image1.png", data: png },
    { name: "ppt/slides/_rels/slide1.xml.rels", data: Buffer.from('<Relationship Target="../media/image1.png"/>') },
  ]);
  const result = replaceLinkedPng(source, { "ppt/media/image1.png": Buffer.concat([png, Buffer.from("new")]) });
  const before = new Map(readZip(source).map(p => [p.name, p.data]));
  const after = new Map(readZip(result.output).map(p => [p.name, p.data]));
  assert.deepEqual(before.get("ppt/slides/slide1.xml"), after.get("ppt/slides/slide1.xml"));
  assert.deepEqual(before.get("ppt/slides/_rels/slide1.xml.rels"), after.get("ppt/slides/_rels/slide1.xml.rels"));
  assert.notDeepEqual(before.get("ppt/media/image1.png"), after.get("ppt/media/image1.png"));
  assert.throws(() => replaceLinkedPng(source, { "ppt/media/not-here.png": png }));
  assert.throws(() => replaceLinkedPng(source, { "ppt/media/image1.png": Buffer.from("bad") }));
});
