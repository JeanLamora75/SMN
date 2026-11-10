// CI verification of a real Windows-created ZIP using the exact offline decoder.
import {readFile,mkdir,rm} from "node:fs/promises";
import path from "node:path";
import {unpackZip} from "./unpack-update.mjs";
import {verifySignedManifest,verifyUpdatePayload} from "./update-contract.mjs";
function flag(name){const i=process.argv.indexOf("--"+name);return i<0?null:process.argv[i+1];}
const archive=flag("zip"),output=flag("out"),trust=flag("trust");
if(!archive||!output||!trust)throw Error("usage --zip --out --trust");
const bytes=await readFile(archive);
await unpackZip(bytes,output);
const signed=await readFile(path.join(output,"manifest.json"));
const signature=(await readFile(path.join(output,"manifest.sig"),"utf8")).trim();
if(!/^[A-Za-z0-9+/]{86}==$/.test(signature))throw Error("signature-encoding-invalid");
const manifest=verifySignedManifest(signed,Buffer.from(signature,"base64"),
 await readFile(trust,"utf8"));
await verifyUpdatePayload(output,manifest);
console.log(JSON.stringify({zipBytes:bytes.length,verified:true,
 fromVersion:manifest.fromVersion,toVersion:manifest.toVersion,
 files:manifest.files.length,mode:manifest.mode}));
