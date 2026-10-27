/** Cible explicite pour les répétitions de migration : refus par défaut. */
export function rehearsalMigrationUri(options:readonly string[], targetRaw:string|undefined, installedRaw:string):string{
 if(!options.includes("--rehearsal")||!options.includes("--apply")||
    options.some(x=>!["--rehearsal","--apply"].includes(x)&&!x.startsWith("--backup-file=")))
  throw Error("rehearsal-explicit-approval-required");
 if(!targetRaw)throw Error("rehearsal-target-uri-required");
 const target=new URL(targetRaw),installed=new URL(installedRaw);
 if(!["postgres:","postgresql:"].includes(target.protocol)||!target.hostname||
    !target.pathname.slice(1)||!target.username)
  throw Error("rehearsal-target-invalid");
 // Refus même si les identifiants diffèrent : même serveur/port pourrait toucher le cluster principal.
 const endpoint=(u:URL)=>{const h=u.hostname.toLowerCase();return (["localhost","127.0.0.1","[::1]","::1"].includes(h)?"loopback":h)+":"+(u.port||"5432");};
 if(endpoint(target)===endpoint(installed))throw Error("rehearsal-target-not-isolated");
 if(!["127.0.0.1","localhost","::1","[::1]"].includes(target.hostname.toLowerCase()))
  throw Error("rehearsal-target-must-be-loopback");
 return target.toString();
}
