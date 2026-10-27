export type CollectiveContext=Readonly<{
 productId:string|null;product:string|null;
 teamId:string;team:string;mode:"scrum"|"kanban";
}>;
export function projectCollectiveContext(source:unknown):CollectiveContext|null{
 if(!source||typeof source!=="object"||Array.isArray(source))return null;
 const data=source as Record<string,unknown>;
 const id=(x:unknown):x is string=>typeof x==="string"&&
  /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(x);
 const productId=data.productId,product=data.product;
 const teamId=data.teamId,team=data.team,mode=data.mode;
 if((productId!==null&&!id(productId))||
  (product!==null&&typeof product!=="string")||
  !id(teamId)||typeof team!=="string"||
  (mode!=="scrum"&&mode!=="kanban"))return null;
 // Un produit facultatif n'implique aucune valeur fictive.
 if((productId===null)!==(product===null))return null;
 return {productId,product,teamId,team,mode};
}
export function projectCollectiveBrief(source:unknown):
 Readonly<{context:CollectiveContext}>|null{
 const context=projectCollectiveContext(source);
 return context?{context}:null;
}
