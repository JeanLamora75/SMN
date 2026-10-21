/**
 * A suggestion is NEVER a persisted value. An explicit recorded null/blank
 * remains authoritative: it must not silently fall back to installation data.
 */
export type PrefillOrigin="saved"|"suggested"|"unknown";
export type PrefillResult<T>=Readonly<{value:T;origin:PrefillOrigin}>;

export function prefillValue<T>(
 saved:T|null|undefined,suggestion:T|null|undefined,empty:T,
 hasRecordedValue:boolean
):PrefillResult<T>{
 if(hasRecordedValue)
  return {value:saved??empty,origin:"saved"};
 if(suggestion!==undefined&&suggestion!==null)
  return {value:suggestion,origin:"suggested"};
 return {value:empty,origin:"unknown"};
}

/** A form can receive newer context without overwriting a locally edited field. */
export function preserveEditedValue<T>(
 current:T,original:T,suggestion:T
):T{
 return Object.is(current,original)?suggestion:current;
}

/** Unknown measures stay unknown; a recorded zero remains numeric zero. */
export function knownNumber(value:number|null|undefined):number|null{
 return typeof value==="number"&&Number.isFinite(value)?value:null;
}
