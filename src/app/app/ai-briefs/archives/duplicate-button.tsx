"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function DuplicateButton({parentId}:{parentId:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const router=useRouter();
 async function duplicate(){
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/ai-briefs/duplicates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({parentId})});
   if(!response.ok)throw Error("Duplication impossible");
   const data=await response.json() as {id:string};
   router.push("/app/admin/ai-briefs/duplicates/"+encodeURIComponent(data.id));
  }catch(e){setError(e instanceof Error?e.message:"Erreur");setBusy(false);}
 }
 return <><button type="button" className="btn btn-outline-primary mb-3 ms-2" disabled={busy} onClick={()=>void duplicate()}>Dupliquer ce brief</button>{error&&<p role="alert">{error}</p>}</>;
}
