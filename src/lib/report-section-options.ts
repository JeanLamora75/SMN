const standardReportSections=["executive","objectives","indicators","events","attention","decisions"] as const;
export type SectionKey=typeof standardReportSections[number];
export type SectionOption={key:SectionKey;visible:boolean};
export const defaultSectionOptions=():SectionOption[]=>standardReportSections.map(key=>({key,visible:true}));
export function validSectionOptions(raw:unknown):raw is SectionOption[]{
 if(!Array.isArray(raw)||raw.length!==standardReportSections.length)return false;
 const keys=new Set<string>();
 return raw.every(x=>{if(!x||typeof x!=="object"||Array.isArray(x))return false;
 const v=x as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="key,visible"||typeof v.key!=="string"||
 !standardReportSections.some(k=>k===v.key)||typeof v.visible!=="boolean"||keys.has(v.key))return false;
 keys.add(v.key);return true;});
}
export function orderReportSections<T extends {key:SectionKey}>(sections:readonly T[],options:readonly SectionOption[]):T[]{
 const byKey=new Map(sections.map(s=>[s.key,s]));
 return options.filter(o=>o.visible).flatMap(o=>{const section=byKey.get(o.key);return section?[section]:[];});
}
