/** Provider-specific HTTPS targets; user input never supplies an arbitrary URL.
 * No retries or redirects, no provider/model fallback. Only selected qualified models.
 */
function safeAiProviderError(status:number){
 if(status===401||status===403)return "authentication-failed";
 if(status===402)return "billing-rejected";
 if(status===429)return "provider-rate-limit";
 return status>=500?"provider-unavailable":"provider-request-failed";
}
import type {ProviderId} from "./free-catalog";
export type ProviderReply={ok:true;text:string}|{ok:false;error:string};
const MAX_RESPONSE=250000;
const URLS={
 gemini:"https://generativelanguage.googleapis.com",
 groq:"https://api.groq.com",
 openrouter:"https://openrouter.ai"
} as const;
export function buildAiProviderRequest(provider:ProviderId,model:string,prompt:string,secret:string){
 if(prompt.length===0||Buffer.byteLength(prompt,"utf8")>160000||!/^[a-zA-Z0-9][a-zA-Z0-9._:/+-]{0,159}$/.test(model))
  throw Error("ai-send-invalid");
 const fixed=URLS[provider];
 if(!fixed)throw Error("ai-send-unknown-provider");
 if(provider==="gemini")return {
  url:fixed+"/v1beta/models/"+encodeURIComponent(model)+":generateContent",
  headers:{"Content-Type":"application/json","x-goog-api-key":secret},
  body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],
   generationConfig:{maxOutputTokens:4096}})
 };
 const openrouter=provider==="openrouter";
 return {
  url:fixed+(openrouter?"/api/v1/chat/completions":"/openai/v1/chat/completions"),
  headers:{"Content-Type":"application/json",Authorization:"Bearer "+secret},
  body:JSON.stringify({model,messages:[{role:"user",content:prompt}],
   max_tokens:4096,stream:false,...(openrouter?{provider:{allow_fallbacks:false}}:{})})
 };
}
async function limitedResponse(response:Response){
 if(Number(response.headers.get("content-length")||0)>MAX_RESPONSE)throw Error("ai-response-too-large");
 if(!response.body)throw Error("ai-response-empty");
 const reader=response.body.getReader();
 const chunks:Uint8Array[]=[];let size=0;
 try{
  while(true){
   const next=await reader.read();
   if(next.done)break;
   size+=next.value.byteLength;
   if(size>MAX_RESPONSE)throw Error("ai-response-too-large");
   chunks.push(next.value);
  }
 }finally{await reader.cancel().catch(()=>undefined);}
 return Buffer.concat(chunks.map(c=>Buffer.from(c))).toString("utf8");
}
export async function sendFreeAiPrompt(provider:ProviderId,model:string,prompt:string,secret:Buffer,
 fetcher:typeof fetch=fetch):Promise<ProviderReply>{
 const credential=secret.toString("utf8");
 let request:ReturnType<typeof buildAiProviderRequest>;
 try{request=buildAiProviderRequest(provider,model,prompt,credential);}
 catch{return {ok:false,error:"invalid-request"};}
 try{
  const response=await fetcher(request.url,{method:"POST",headers:Object.fromEntries(Object.entries(request.headers).filter(([,value])=>typeof value==="string")) as Record<string,string>,
   body:request.body,redirect:"manual",cache:"no-store",
   signal:AbortSignal.timeout(25000)});
  if(response.status>=300&&response.status<400)return {ok:false,error:"provider-redirect-rejected"};
  if(!response.ok)return {ok:false,error:safeAiProviderError(response.status)};
  if(!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
   return {ok:false,error:"provider-response-invalid"};
  const raw=JSON.parse(await limitedResponse(response)) as Record<string,unknown>;
  let text:string|undefined;
  if(provider==="gemini"){
   const candidates=raw.candidates as {content?:{parts?:{text?:unknown}[]}}[]|undefined;
   const parts=candidates?.[0]?.content?.parts;
   text=parts?.map(p=>typeof p.text==="string"?p.text:"").join("");
  }else{
   const choices=raw.choices as {message?:{content?:unknown}}[]|undefined;
   const item=choices?.[0]?.message?.content;
   text=typeof item==="string"?item:undefined;
  }
  if(!text?.trim()||Buffer.byteLength(text,"utf8")>MAX_RESPONSE)
   return {ok:false,error:"provider-response-invalid"};
  return {ok:true,text};
 }catch{return {ok:false,error:"provider-network-or-response-error"};}
}
