import {spawn} from "node:child_process";
import {join} from "node:path";

const port=Number(process.env.SMN_CI_SMOKE_PORT||"3109");
const next=join(process.cwd(),"node_modules","next","dist","bin","next");
const child=spawn(process.execPath,[next,"dev","-H","127.0.0.1","-p",String(port)],{
 cwd:process.cwd(),stdio:["ignore","pipe","pipe"],
 env:{...process.env,NEXT_TELEMETRY_DISABLED:"1"}
});
let output="";
let ready=false;
let finished=false;
function stop(exitCode){
 if(finished)return;
 finished=true;
 clearTimeout(timeout);
 child.kill("SIGTERM");
 process.exitCode=exitCode;
}
function handle(text){
 output+=text;
 if(output.length>12000)output=output.slice(-12000);
 process.stdout.write(text);
 if(/You cannot use different slug names|Error:.*dynamic path/i.test(output)){
  console.error("Next.js route slug collision detected.");
  stop(1);
 }else if(/\bReady in\b|✓ Ready\b/i.test(output)){
  ready=true;stop(0);
 }
}
child.stdout.on("data",bytes=>handle(bytes.toString()));
child.stderr.on("data",bytes=>handle(bytes.toString()));
child.on("error",error=>{console.error(error);stop(1);});
child.on("exit",(code)=>{
 if(!finished){console.error("Next.js exited before the ready signal (code "+code+").");stop(1);}
});
const timeout=setTimeout(()=>{
 console.error("Next.js did not reach ready state within 90 seconds.",output);
 stop(1);
},90_000);
