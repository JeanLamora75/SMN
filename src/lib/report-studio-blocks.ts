export const reportBlockKinds=["text","table","chart","kpi","image"] as const;
export type ReportBlockKind=typeof reportBlockKinds[number];
export type ReportBlock={id:string;sectionKey:string;kind:ReportBlockKind;title:string;visible:boolean;width:"full"|"half";text:string;metricKey:string|null;imageUrl:string|null};
export function isReportBlock(value:unknown):value is ReportBlock{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const b=value as Record<string,unknown>;
 return typeof b.id==="string"&&/^[a-f0-9-]{36}$/i.test(b.id)&&typeof b.sectionKey==="string"&&b.sectionKey.length>0&&b.sectionKey.length<=80&&
 reportBlockKinds.includes(b.kind as ReportBlockKind)&&typeof b.title==="string"&&b.title.length<=120&&
 typeof b.visible==="boolean"&&(b.width==="full"||b.width==="half")&&typeof b.text==="string"&&b.text.length<=12000&&
 (b.metricKey===null||typeof b.metricKey==="string"&&b.metricKey.length<=80)&&
 (b.imageUrl===null||typeof b.imageUrl==="string"&&b.imageUrl.length<=1024);
}
export function moveItem<T>(items:readonly T[],index:number,direction:-1|1):T[]{
 const target=index+direction;
 if(index<0||target<0||index>=items.length||target>=items.length)return [...items];
 const result=[...items];[result[index],result[target]]=[result[target],result[index]];return result;
}
export function visibleBlocks(blocks:readonly ReportBlock[],sectionKey:string){return blocks.filter(b=>b.sectionKey===sectionKey&&b.visible);}
