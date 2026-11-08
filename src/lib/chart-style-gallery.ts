import {CHART_TYPES,type ChartType,type ChartStyleConfig} from "@/server/reports/chart-style-contract";

export type GalleryStyle=Readonly<{
 id:string;name:string;description:string;source:"builtin"|"custom";
 revision:number;config:ChartStyleConfig
}>;
export type GalleryDefault=Readonly<{styleId:string;revision:number}>;
export type GalleryCatalog=Readonly<{
 styles:GalleryStyle[];
 defaults:Record<ChartType,GalleryDefault>
}>;
export type GalleryFilter=Readonly<{query:string;origin:"all"|"builtin"|"custom";type:"all"|ChartType}>;

/** Pure gallery projection. Each default belongs to the global catalogue, never to a team. */
export function filterGalleryStyles(catalog:GalleryCatalog,filter:GalleryFilter):GalleryStyle[]{
 const search=filter.query.trim().toLocaleLowerCase();
 return catalog.styles.filter(style=>
  (filter.origin==="all"||style.source===filter.origin)&&
  (filter.type==="all"||catalog.defaults[filter.type]?.styleId===style.id)&&
  (!search||[style.name,style.description,style.id].some(v=>v.toLocaleLowerCase().includes(search)))
 );
}
export function usedAsDefault(catalog:GalleryCatalog,id:string):ChartType[]{
 return CHART_TYPES.filter(type=>catalog.defaults[type]?.styleId===id);
}
export function canDeleteGalleryStyle(catalog:GalleryCatalog,style:GalleryStyle):boolean{
 return style.source==="custom"&&usedAsDefault(catalog,style.id).length===0;
}
/** No human-entered identifier: append UUID suffix to avoid collisions. */
export function generateGalleryStyleId(name:string,uuid:string):string{
 const slug=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40);
 const first=/^[a-z]/.test(slug)?slug:"style";
 const suffix=uuid.replace(/[^0-9a-f]/gi,"").slice(0,8).toLowerCase();
 if(suffix.length!==8)throw Error("invalid-style-uuid");
 return (first+"-"+suffix).slice(0,64);
}
export function validGalleryCatalog(raw:unknown):raw is GalleryCatalog{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const value=raw as Partial<GalleryCatalog>;
 if(!Array.isArray(value.styles)||!value.defaults||typeof value.defaults!=="object")return false;
 const ids=new Set<string>();
 for(const style of value.styles){
  if(!style||typeof style.id!=="string"||typeof style.name!=="string"||
   typeof style.description!=="string"||
   !["builtin","custom"].includes(style.source)||!Number.isInteger(style.revision)||
   !style.config||ids.has(style.id))return false;
  ids.add(style.id);
 }
 return CHART_TYPES.every(type=>{
  const selected=value.defaults?.[type];
  return !!selected&&ids.has(selected.styleId)&&Number.isInteger(selected.revision)&&selected.revision>=0;
 });
}
