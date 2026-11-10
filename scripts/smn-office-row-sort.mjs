/** Shared validated row-marker sorting for Word and PowerPoint exports. */
export const ROW_MARKER=/\{\{ROW:([^{}]*)\}\}/g;
const NAME=/^[A-Z][A-Z0-9_]*$/;
const DIRECTIONS=new Set(["ASC","DESC"]);
export function parseOfficeRowMarker(raw,sources){
 const [source,...parameters]=raw.split("|");
 if(!sources.has(source))throw Error("office-table-invalid-source");
 if(parameters.length===0)return {source,sort:[]};
 if(parameters.length!==1||!parameters[0].startsWith("SORT="))
  throw Error("office-table-invalid-sort");
 const spec=parameters[0].slice(5);
 if(!spec||spec.length>1024)throw Error("office-table-invalid-sort");
 const seen=new Set();
 const sort=spec.split(",").map(item=>{
  const terms=item.split(":");
  if(terms.length>2||terms.length<1||!NAME.test(terms[0])||
   (terms[1]!==undefined&&!DIRECTIONS.has(terms[1]))||
   seen.has(terms[0]))throw Error("office-table-invalid-sort");
  seen.add(terms[0]);
  return {field:terms[0],direction:terms[1]??"ASC"};
 });
 if(sort.length>32)throw Error("office-table-invalid-sort");
 return {source,sort};
}
function numericValue(value,locale){
 const v=String(value).trim().replace(/[\u00a0\u202f\s]/g,"");
 if(!/^[+-]?(?:\d+[.,]?\d*|[.,]\d+)$/.test(v))return null;
 const normalized=locale==="fr"?v.replace(",","."):v.replace(/,/g,"");
 if(!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized))return null;
 const n=Number(normalized);
 return Number.isFinite(n)?n:null;
}
function dateValue(value,locale){
 const v=String(value).trim();
 const iso=/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/.exec(v);
 if(iso)return Date.UTC(+iso[1],+iso[2]-1,+iso[3]);
 const match=/^(\d{1,2})[\s/.-]+([\p{L}]+|\d{1,2})[\s/.-]+(\d{4})$/u.exec(v);
 if(!match)return null;
 let month=Number(match[2]);
 if(!Number.isInteger(month)||month<1||month>12){
  const token=match[2].toLocaleLowerCase(locale).replace(/[.]/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const names=locale==="fr"?
   ["janv","fevr","mars","avr","mai","juin","juil","aout","sept","oct","nov","dec"]:
   ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  month=names.findIndex(name=>token.startsWith(name))+1;
 }
 if(month<1||month>12)return null;
 const day=+match[1],year=+match[3],timestamp=Date.UTC(year,month-1,day);
 const d=new Date(timestamp);
 return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day?timestamp:null;
}
/** Applies stable, typed, locale-sensitive sorting without changing the original dataset. */
export function sortOfficeRows(records,sort,locale="fr"){
 if(!sort.length||records.length<2)return records;
 if(locale!=="fr"&&locale!=="en")throw Error("office-table-invalid-locale");
 const available=records[0]??{};
 for(const {field} of sort)if(!Object.hasOwn(available,field))
  throw Error("office-table-invalid-sort-column");
 const collator=new Intl.Collator(locale,{numeric:true,sensitivity:"base"});
 return records.map((row,index)=>({row,index})).sort((left,right)=>{
  for(const {field,direction} of sort){
   const a=left.row[field],b=right.row[field];
   const emptyA=a===null||a===undefined||String(a).trim()==="";
   const emptyB=b===null||b===undefined||String(b).trim()==="";
   if(emptyA||emptyB){if(emptyA!==emptyB)return emptyA?1:-1;continue;}
   const nA=numericValue(a,locale),nB=numericValue(b,locale);
   const dA=dateValue(a,locale),dB=dateValue(b,locale);
   let cmp;
   if(nA!==null&&nB!==null)cmp=Math.sign(nA-nB);
   else if(dA!==null&&dB!==null)cmp=Math.sign(dA-dB);
   else cmp=collator.compare(String(a),String(b));
   if(cmp!==0)return direction==="DESC"?-cmp:cmp;
  }
  return left.index-right.index;
 }).map(x=>x.row);
}
