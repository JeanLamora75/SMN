export const roamValues=["resolved","owned","accepted","mitigated"] as const;
export type Roam=(typeof roamValues)[number];
