/** One stable Sprint detail tab vocabulary, shared by server and client. */
export const sprintTabKeys=[
 "objectives","ceremonies","capacity","indicators","registers","trends","review"
] as const;
export type SprintTab=(typeof sprintTabKeys)[number];
export function parseSprintTab(value:string|undefined):SprintTab{
 return sprintTabKeys.find(key=>key===value)??"objectives";
}
