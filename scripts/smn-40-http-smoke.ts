/**
 * Unauthenticated HTTP smoke test for the destructive erasure endpoint.
 * Sends no credentials, cookies, confirmation tokens or member identifiers.
 * Accepts only a local loopback HTTP server. No successful deletion is possible.
 */
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1||!args[0].startsWith("--url="))
  throw Error("http-smoke-usage");
 const base=new URL(args[0].slice("--url=".length));
 if(base.protocol!=="http:"||
  !["127.0.0.1","localhost","[::1]"].includes(base.hostname)||
  base.username||base.password||base.search||base.hash||
  !["/",""].includes(base.pathname))
  throw Error("http-smoke-loopback-only");
 const url=new URL("/api/admin/erasure/execute",base);
 const cases=[
  {name:"anonymous-invalid-payload",body:{}},
  {name:"anonymous-forged-confirmation",body:{
   token:"invalid",confirmation:"EFFACER FAUX",
   acknowledgeExternalCopies:true
  }}
 ];
 const results=[];
 for(const item of cases){
  const response=await fetch(url,{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify(item.body),redirect:"manual",signal:AbortSignal.timeout(8000)
  });
  const body=await response.json() as {error?:string};
  if(response.status!==403||body.error!=="forbidden")
   throw Error("http-smoke-auth-gate-failed:"+item.name);
  results.push({case:item.name,status:response.status,passed:true});
 }
 process.stdout.write(JSON.stringify({mode:"anonymous-http-only",writeAuthorized:false,
  endpoint:url.pathname,results},null,2)+"\n");
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/")
 .endsWith("/smn-40-http-smoke.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 HTTP smoke unavailable or authorization gate failed.\n");
  process.exitCode=1;
 });
