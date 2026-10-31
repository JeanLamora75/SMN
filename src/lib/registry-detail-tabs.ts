import type {RegistryType} from "./registry-types";

export type RegistryDetailTab="summary"|"business"|"relations"|"history"|"journal";

/** A highlight has no invented business tab. These tabs are a navigation contract,
 * not extra permissions for underlying business endpoints. */
export const registryBusinessTabKeys={
 risk:"risk",obstacle:"obstacle",dependency:"dependency",
 decision:"decision",action:"action",highlight:null
} as const satisfies Record<RegistryType,string|null>;

export function registryDetailTabs(type:RegistryType):readonly RegistryDetailTab[]{
 return registryBusinessTabKeys[type]===null
  ?["summary","relations","journal","history"]
  :["summary","business","relations","journal","history"];
}
