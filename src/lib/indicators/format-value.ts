/**
 * IND-17: user-facing values have at most two decimals (HALF_UP).
 * Keep internal NUMERIC results and formula dependencies at their full precision.
 * Decimal text is rounded without converting to a binary floating-point number.
 */
export function formatIndicatorValue(
 value:string|number|null|undefined,locale:"fr"|"en"|"fr-FR"|"en-GB"="fr"
):string{
 if(value===null||value===undefined)return "—";
 const raw=(typeof value==="number"&&Number.isFinite(value)?
  value.toLocaleString("en-US",{useGrouping:false,maximumFractionDigits:20}):String(value)).trim();
 const match=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(raw);
 if(!match)return raw;
 const [,sign,whole,fraction=""]=match;
 const fractionTwo=fraction.padEnd(2,"0").slice(0,2);
 let hundredths=BigInt(whole)*100n+BigInt(fractionTwo);
 if(fraction.length>2&&fraction[2]>="5")hundredths+=1n;
 const resultWhole=(hundredths/100n).toString();
 const resultFraction=(hundredths%100n).toString().padStart(2,"0").replace(/0+$/,"");
 const separator=locale.startsWith("fr")?",":".";
 const normalizedSign=sign==="-"&&hundredths!==0n?"-":"";
 return normalizedSign+resultWhole+(resultFraction?separator+resultFraction:"");
}
export function formatIndicatorMeasurement(
 value:string|number|null|undefined,unit:string|null|undefined,locale:"fr"|"en"|"fr-FR"|"en-GB"="fr"
):string{
 if(value===null||value===undefined)return "—";
 return formatIndicatorValue(value,locale)+(unit?" "+unit:"");
}
