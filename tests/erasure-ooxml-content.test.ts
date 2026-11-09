import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {extractOoxmlText} from "../src/server/backup/erasure-ooxml-text";

function crc32(bytes:Buffer):number{
 let c=0xffffffff;
 for(const b of bytes){
  c^=b;
  for(let i=0;i<8;i++)c=(c&1)?(c>>>1)^0xedb88320:c>>>1;
 }
 return (c^0xffffffff)>>>0;
}
function makeZip(entries:readonly {name:string;body:string}[]):Buffer{
 const locals:Buffer[]=[],central:Buffer[]=[];let offset=0;
 for(const entry of entries){
  const name=Buffer.from(entry.name),body=Buffer.from(entry.body);
  const checksum=crc32(body);
  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);
  local.writeUInt32LE(checksum,14);local.writeUInt32LE(body.length,18);
  local.writeUInt32LE(body.length,22);local.writeUInt16LE(name.length,26);
  locals.push(local,name,body);
  const directory=Buffer.alloc(46);
  directory.writeUInt32LE(0x02014b50,0);directory.writeUInt16LE(20,4);
  directory.writeUInt16LE(20,6);
  directory.writeUInt32LE(checksum,16);directory.writeUInt32LE(body.length,20);
  directory.writeUInt32LE(body.length,24);directory.writeUInt16LE(name.length,28);
  directory.writeUInt32LE(offset,42);
  central.push(directory,name);
  offset+=local.length+name.length+body.length;
 }
 const centralBytes=Buffer.concat(central);
 const eocd=Buffer.alloc(22);
 eocd.writeUInt32LE(0x06054b50,0);
 eocd.writeUInt16LE(entries.length,8);
 eocd.writeUInt16LE(entries.length,10);
 eocd.writeUInt32LE(centralBytes.length,12);
 eocd.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,centralBytes,eocd]);
}
describe("SMN-38 — lecture Office non destructive sans dépendance externe",()=>{
 it("extrait une couche texte DOCX et signale les médias",()=>{
  const bytes=makeZip([
   {name:"word/document.xml",body:'<w:document xmlns:w="urn:w"><w:p><w:r><w:t>Alice</w:t></w:r><w:r><w:t> Dupont</w:t></w:r></w:p></w:document>'},
   {name:"word/media/image1.png",body:"some-binary"}
  ]);
  const result=extractOoxmlText(bytes);
  assert.equal(result.state,"extracted");
  assert.ok(result.text?.includes("Alice"));
  assert.equal(result.imagesPresent,true);
  assert.ok(result.parts>=1);
 });
 it("parcourt les textes des slides PowerPoint",()=>{
  const bytes=makeZip([
   {name:"ppt/slides/slide1.xml",body:'<p:sld><a:t>Alice &amp; Bob</a:t></p:sld>'},
   {name:"ppt/notesSlides/notesSlide1.xml",body:'<p:notes><a:t>Confidentiel</a:t></p:notes>'}
  ]);
  const result=extractOoxmlText(bytes);
  assert.equal(result.state,"extracted");
  assert.ok(result.text?.includes("Alice & Bob"));
  assert.ok(result.text?.includes("Confidentiel"));
 });
 it("refuse un ZIP falsifié et n'infère jamais un texte absent",()=>{
  const bytes=makeZip([{name:"word/document.xml",body:"<w:t>Alice</w:t>"}]);
  const corrupted=Buffer.from(bytes);
  corrupted[40]^=0xff;
  assert.equal(extractOoxmlText(corrupted).state,"unsupported");
  const noText=makeZip([{name:"word/media/image1.png",body:"image"}]);
  assert.equal(extractOoxmlText(noText).state,"unsupported");
 });
});
