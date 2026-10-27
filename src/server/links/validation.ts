export type LinkWrite={title:string;url:string;description:string|null;categoryId:string;scope:"TRANSVERSE"|"EQUIPE";teamId:string|null};
export class LinkError extends Error {
 constructor(public readonly kind:"invalid-input"|"forbidden"|"not-found"|"conflict"|"not-ready"){super(kind);}
}
export const validId=(v:unknown):v is string=>typeof v==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(v);

export function normalizeLink(body:Record<string,unknown>):LinkWrite {
 const title=typeof body.title==="string"?body.title.trim():"";
 const description=body.description==null?null:typeof body.description==="string"?body.description.trim():null;
 const value=typeof body.url==="string"?body.url.trim():"";
 let url:URL;
 try{url=new URL(value);}catch{throw new LinkError("invalid-input");}
 if(!title||title.length>200||!value||value.length>2048||
   (body.description!=null&&typeof body.description!=="string")||
   (description!==null&&description.length>4000)||
   !validId(body.categoryId)||
   (body.scope!=="TRANSVERSE"&&body.scope!=="EQUIPE")||
   (body.scope==="TRANSVERSE"&&body.teamId!=null)||
   (body.scope==="EQUIPE"&&!validId(body.teamId))||
   !["http:","https:"].includes(url.protocol)||!url.hostname||
   url.username||url.password||/[\s\u0000-\u001f\u007f\\]/u.test(value))
  throw new LinkError("invalid-input");
 return {title,url:value,description,categoryId:body.categoryId as string,
  scope:body.scope as LinkWrite["scope"],teamId:body.scope==="EQUIPE"?body.teamId as string:null};
}


export function mapLinkError(error:unknown):{error:string;status:number}{
 if(error instanceof LinkError)return {error:error.kind,status:({
 "invalid-input":400,forbidden:403,"not-found":404,conflict:409,"not-ready":503
 })[error.kind]};
 if(error instanceof Error&&["team-access-forbidden","team-context-unavailable","team-id-invalid",
 "team-context-not-ready"].includes(error.message))return {error:"not-found",status:404};
 if((error as {code?:unknown})?.code==="23503")return {error:"invalid-input",status:400};
 if((error as {code?:unknown})?.code==="23505")return {error:"conflict",status:409};
 return {error:"service-unavailable",status:503};
}
