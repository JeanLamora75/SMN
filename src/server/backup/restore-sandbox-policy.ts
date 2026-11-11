const DB=/^smn_restore_test_[a-z0-9_]{6,40}$/;
const LOCAL=new Set(["localhost","127.0.0.1","::1","[::1]"]);
export function validateSandboxTarget(source:string,target:string):boolean{
 try{
  const a=new URL(source),b=new URL(target);
  const sourcePort=a.port||"5432",targetPort=b.port||"5432";
  const sameClusterCandidate=sourcePort===targetPort&&a.username===b.username;
  // A second local cluster must use a separate port AND a dedicated role.
  // A different database name alone is never sufficient for that mode.
  const independentClusterCandidate=sourcePort!==targetPort&&
   a.username!==b.username;
  return (a.protocol==="postgres:"||a.protocol==="postgresql:")&&
   (b.protocol==="postgres:"||b.protocol==="postgresql:")&&
   LOCAL.has(a.hostname)&&LOCAL.has(b.hostname)&&a.hostname===b.hostname&&
   DB.test(decodeURIComponent(b.pathname.slice(1)))&&
   a.pathname!==b.pathname&&
   b.password.length>0&&
   (sameClusterCandidate||independentClusterCandidate)&&
   !b.search&&!b.hash;
 }catch{return false;}
}
