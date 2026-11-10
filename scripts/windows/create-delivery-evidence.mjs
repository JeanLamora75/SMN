// CI-only evidence writer; public metadata, never secrets or private paths.
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {lstat,writeFile} from "node:fs/promises";
import path from "node:path";
export async function writeDeliveryEvidence(file,kind,commit,run){
 if(!["windows-x64-initial","windows-x64-update"].includes(kind)||
    !/^[a-f0-9]{40}$/.test(commit??"")||!/^[1-9][0-9]*$/.test(run??"")||
    !Number.isSafeInteger(Number(run)))throw Error("smn-delivery-ci-context-invalid");
 const info=await lstat(file);
 if(!info.isFile()||info.isSymbolicLink()||info.size<=0||info.size>1024**3)
  throw Error("smn-delivery-file-invalid");
 const hash=createHash("sha256");
 for await(const block of createReadStream(file))hash.update(block);
 const sha256=hash.digest("hex"),archive=path.basename(file);
 const evidence={format:1,product:"SMN",kind,archive,bytes:info.size,
  sha256,gitCommit:commit,runId:Number(run)};
 await writeFile(file+".sha256",sha256+"  "+archive+"\n",{flag:"wx"});
 await writeFile(file+".evidence.json",JSON.stringify(evidence)+"\n",{flag:"wx"});
 console.log("SMN delivery bytes: "+info.size);
 console.log("SMN delivery SHA256: "+sha256);
 console.log("SMN CI run: "+run+" commit: "+commit);
 return evidence;
}
if(process.argv[1]&&path.resolve(process.argv[1])===
  (await import("node:url")).fileURLToPath(import.meta.url)){
 const [file,kind]=process.argv.slice(2);
 try{await writeDeliveryEvidence(file,kind,process.env.GITHUB_SHA,process.env.GITHUB_RUN_ID);}
 catch{console.error("SMN delivery evidence generation failed.");process.exitCode=1;}
}
