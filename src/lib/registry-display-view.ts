/** Only the global qualitative registers use this preference key. */
export const registryDisplayPreferenceKey="smn-registries-display-view-v1";
export type RegistryDisplayView="list"|"cards";

/** An absent, stale or unknown stored value keeps the validated List default. */
export function parseRegistryDisplayView(value:unknown):RegistryDisplayView{
 return value==="cards"?"cards":"list";
}
