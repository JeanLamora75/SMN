/** Presentation-only formatting: never round a value stored in PostgreSQL. */
export function formatBriefNumericValue(value:string|null,locale:string):string|null{
 if(value===null)return null;
 const trimmed=value.trim();
 // Preserve non-numeric data verbatim; never parse units or qualitative labels.
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed))return value;
 const number=Number(trimmed);
 if(!Number.isFinite(number))return value;
 return new Intl.NumberFormat(locale==="en"?"en-GB":"fr-FR",{
  useGrouping:false,maximumFractionDigits:2
 }).format(number);
}
