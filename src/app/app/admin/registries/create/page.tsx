import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {registryTypes,type RegistryType} from "@/lib/registry-types";

export const dynamic="force-dynamic";

/** Preserve entry points from meetings and Sprint context without duplicating creation. */
export default async function NewRegistryPage({searchParams}:{
 searchParams:Promise<{type?:string;sourceId?:string;cycleId?:string}>;
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"write",{type:"settings",exists:true,inScope:true}))
  redirect("/app/admin/registries");
 const query=await searchParams;
 const params=new URLSearchParams({create:"1"});
 if(typeof query.type==="string"&&registryTypes.includes(query.type as RegistryType))
  params.set("type",query.type);
 const uuidRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(typeof query.sourceId==="string"&&uuidRx.test(query.sourceId))
  params.set("sourceId",query.sourceId);
 if(typeof query.cycleId==="string"&&uuidRx.test(query.cycleId))
  params.set("cycleId",query.cycleId);
 redirect("/app/admin/registries?"+params.toString());
}
