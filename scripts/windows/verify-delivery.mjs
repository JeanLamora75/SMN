// SMN-430: verify a transported ZIP without installing tools, starting services
// or extracting the archive. Works with the Node runtime already bundled in SMN.
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {readFile,stat,lstat} from "node:fs/promises";
import path from "node:path";

const SHA=/^[a-f0-9]{64}$/;
const SIZE=/^(0|[1-9][0-9]*)$/;
const MAX_SIZE=1024*1024*1024;
export function parseDeliveryChecksum(value,basename){
 const lines=value.replace(/\r/g,"").trim().split("\n");
 if(lines.length!==1)throw Error("smn-delivery-checksum-malformed");
 const match=/^([a-fA-F0-9]{64})  (.+)$/.exec(lines[0]);
 if(!match||match[2]!==basename || !SHA.test(match[1].toLowerCase()))
  throw Error("smn-delivery-checksum-malformed");
 return match[1].toLowerCase();
}
export function validateDeliveryEvidence(evidence,basename){
 if(!evidence||evidence.format!==1||evidence.product!=="SMN"||
   evidence.archive!==basename||typeof evidence.sha256!=="string"||
   !SHA.test(evidence.sha256)||!Number.isSafeInteger(evidence.bytes)||
   evidence.bytes<=0||evidence.bytes>MAX_SIZE||
   typeof evidence.gitCommit!=="string"||!/^[a-f0-9]{40}$/.test(evidence.gitCommit)||
   !Number.isSafeInteger(evidence.runId)||evidence.runId<1||
   !["windows-x64-initial","windows-x64-update"].includes(evidence.kind))
  throw Error("smn-delivery-evidence-malformed");
 return evidence;
}
export async function verifyDelivery(archive,evidencePath,checksumPath){
 const filename=path.basename(archive);
 const evidence=validateDeliveryEvidence(JSON.parse(await readFile(evidencePath,"utf8")),filename);
 const expected=parseDeliveryChecksum(await readFile(checksumPath,"utf8"),filename);
 if(evidence.sha256!==expected)throw Error("smn-delivery-evidence-mismatch");
 const details=await lstat(archive);
 if(!details.isFile()||details.isSymbolicLink()||details.size!==evidence.bytes)
  throw Error("smn-delivery-size-mismatch");
 const digest=createHash("sha256");
 for await(const chunk of createReadStream(archive))digest.update(chunk);
 if(digest.digest("hex")!==expected)throw Error("smn-delivery-sha256-mismatch");
 return {verified:true,archive:filename,bytes:details.size,sha256:expected,
  kind:evidence.kind,runId:evidence.runId,gitCommit:evidence.gitCommit};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/,"$1"))){
 const [archive,evidence,checksum]=process.argv.slice(2);
 if(!archive||!evidence||!checksum){
  console.error("Usage: node verify-delivery.mjs <archive.zip> <archive.zip.evidence.json> <archive.zip.sha256>");
  process.exitCode=2;
 }else try{
  const result=await verifyDelivery(archive,evidence,checksum);
  console.log(JSON.stringify(result));
 }catch{
  console.error("SMN: vérification du paquet échouée ; ne pas installer ce ZIP.");
  process.exitCode=1;
 }
}
