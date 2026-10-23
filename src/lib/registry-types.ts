export const registryTypes=["risk","obstacle","dependency","decision","action","highlight"] as const;
export type RegistryType=(typeof registryTypes)[number];
export const registryStatuses={
 risk:["open","resolved"],
 obstacle:["open","in_progress","resolved","abandoned"],
 dependency:["open","in_progress","satisfied","cancelled"],
 decision:["active","replaced","cancelled"],
 action:["todo","in_progress","completed","cancelled"],
 highlight:["recorded"]
} as const satisfies Record<RegistryType,readonly string[]>;
