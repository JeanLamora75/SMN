const DB=/^smn_restore_test_[a-z0-9_]{6,40}$/;
const LOCAL=new Set(["localhost","127.0.0.1","::1","[::1]"]);
export function validateSandboxTarget(source:string,target:string):boolean{
 try{
  const a=new URL(source),b=new URL(target);
  return (a.protocol==="postgres:"||a.protocol==="postgresql:")&&
   (b.protocol==="postgres:"||b.protocol==="postgresql:")&&
   LOCAL.has(a.hostname)&&LOCAL.has(b.hostname)&&
   DB.test(decodeURIComponent(b.pathname.slice(1)))&&
   a.pathname!==b.pathname&&
   a.hostname===b.hostname&&(a.port||"5432")===(b.port||"5432")&&
   a.username===b.username&&b.password.length>0&&
   !b.searchParams.has("options");
 }catch{return false;}
}
