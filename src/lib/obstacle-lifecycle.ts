export const obstacleStatuses=["open","in_progress","resolved","abandoned"] as const;
export type ObstacleStatus=(typeof obstacleStatuses)[number];
export function isObstacleStatus(value:unknown):value is ObstacleStatus{
 return typeof value==="string"&&obstacleStatuses.some(s=>s===value);
}
/** Reopening a resolved or abandoned obstacle is a new transition, not history deletion. */
export function obstacleTransition(from:unknown,to:unknown){
 if(!isObstacleStatus(from)||!isObstacleStatus(to))return {valid:false as const};
 return {valid:true as const,changed:from!==to,reopened:(from==="resolved"||from==="abandoned")&&(to==="open"||to==="in_progress")};
}
export function obstacleNeedsAttention(status:unknown):boolean{
 return status==="open"||status==="in_progress";
}
