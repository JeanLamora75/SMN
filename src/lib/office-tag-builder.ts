/** UI-independent serialization of supported Office expressions. No business data is embedded. */
export type OfficeTagFamily="scalar"|"indicator"|"row"|"chart";
export type OfficeSortRule={field:string;direction:"ASC"|"DESC"};
export type OfficeChartType="bar"|"line"|"area"|"pie"|"donut"|"gauge";
export type OfficeChartSelection={
 type:OfficeChartType;tags:readonly string[];last:number;style:string;
 explicitType:boolean;explicitLast:boolean;
};
export type OfficeTagSelection={
 family:OfficeTagFamily;
 key:string;
 rules:readonly OfficeSortRule[];
 allowedFields?:readonly string[];
 chart:OfficeChartSelection;
};
const FIELD=/^[A-Z][A-Z0-9_]*$/;
const STYLE=/^(?:legacy|[a-z][a-z0-9-]{2,63})$/;
const TYPES=new Set(["bar","line","area","pie","donut","gauge"]);
/** Returns an empty string when the selection is not syntactically supported. */
export function serializeOfficeTag(value:OfficeTagSelection):string{
 const {family,key,rules,allowedFields=[],chart}=value;
 if(family==="scalar")return FIELD.test(key)?"{{"+key+"}}":"";
 if(family==="indicator")return FIELD.test(key)?"{{INDICATOR_"+key+"}}":"";
 if(family==="row"){
  if(!FIELD.test(key))return "";
  const allowed=new Set(allowedFields);
  if(rules.length>32||rules.some(r=>!FIELD.test(r.field)||!allowed.has(r.field)||
   !["ASC","DESC"].includes(r.direction))||new Set(rules.map(r=>r.field)).size!==rules.length)return "";
  return "{{ROW:"+key+(rules.length?"|SORT="+rules.map(r=>r.field+":"+r.direction).join(","):"")+"}}";
 }
 if(family!=="chart"||!TYPES.has(chart.type)||chart.tags.length>6||
  new Set(chart.tags).size!==chart.tags.length||
  chart.tags.some(tag=>!FIELD.test(tag))||!Number.isInteger(chart.last)||
  chart.last<1||chart.last>24||
  (chart.type==="gauge"&&chart.tags.length>1)||
  (chart.style!==""&&!STYLE.test(chart.style)))return "";
 return "{{CHART:TREND"+(chart.explicitType?"|TYPE="+chart.type:"")+
  (chart.tags.length?"|TAGS="+chart.tags.join(","):"")+
  (chart.explicitLast&&!["pie","donut","gauge"].includes(chart.type)?"|LAST="+chart.last:"")+
  (chart.style?"|STYLE="+chart.style:"")+"}}";
}
