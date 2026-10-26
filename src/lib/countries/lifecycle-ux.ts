export type CountryVisibility="active"|"archived"|"all";
export type CountryLifecycleAction="archive"|"reactivate";

/** Keep the changed row discoverable when its previous visibility filter hides it. */
export function visibilityAfterLifecycle(
 current:CountryVisibility,action:CountryLifecycleAction
):CountryVisibility{
 return current==="active"&&action==="archive"||
  current==="archived"&&action==="reactivate"?"all":current;
}
export function lifecycleActionForCountry(archived:boolean):CountryLifecycleAction{
 return archived?"reactivate":"archive";
}
export function lifecycleBlocked(impact:{
 canArchive:boolean;canReactivate:boolean;country:{archived:boolean};
 referenceCountry:boolean;activeMemberCount:number;
}):boolean{
 return impact.country.archived?!impact.canReactivate:
  !impact.canArchive||impact.referenceCountry||impact.activeMemberCount>0;
}
