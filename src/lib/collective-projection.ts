export type CollectiveContext=Readonly<{productId:string|null;product:string|null;teamId:string;team:string;mode:"scrum"|"kanban"}>;
export function projectCollectiveContext(source:unknown):CollectiveContext|null {
 if(!source||typeof source!=="object"||Array.isArray(source))return null;
 const data=source as Record<string,unknown>;
 const id=(x:unknown):x is string=>typeof x==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(x);
 if(!(data.productId===null||id(data.productId))||!id(data.teamId)||
 !(data.product===null||typeof data.product==="string")||typeof data.team!=="string"||
 (data.mode!=="scrum"&&data.mode!=="kanban"))return null;
 return {productId:data.productId,product:data.product,teamId:data.teamId,team:data.team,mode:data.mode};
}
export function projectCollectiveBrief(source:unknown):Readonly<{context:CollectiveContext}>|null {
 const context=projectCollectiveContext(source);
 return context?{context}:null;
}
