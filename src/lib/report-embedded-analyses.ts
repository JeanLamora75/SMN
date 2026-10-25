export type EmbeddedAnalysis={sourceId:string;archiveId:string|null;origin:"human"|"ai";scope:string;content:string;selectedAt:string};
export function insertSelectedAnalysis(items:readonly EmbeddedAnalysis[],next:EmbeddedAnalysis):EmbeddedAnalysis[]{
 if(items.some(x=>x.sourceId===next.sourceId&&x.origin===next.origin))return [...items];
 return [...items,next];
}
export function replaceEmbeddedAnalysis(items:readonly EmbeddedAnalysis[],sourceId:string,origin:EmbeddedAnalysis["origin"],content:string){
 return items.map(x=>x.sourceId===sourceId&&x.origin===origin?{...x,content}:x);
}
