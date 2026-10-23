export const automaticHighlightCategories=["criticalRisk","atRiskDependency","resolvedObstacle","achievedGoal","recordedDecision","satisfiedDependency"] as const;
export type AutomaticHighlightCategory=typeof automaticHighlightCategories[number];
export const defaultHighlightCategories:Record<AutomaticHighlightCategory,boolean>={
 criticalRisk:true,atRiskDependency:true,resolvedObstacle:true,achievedGoal:true,recordedDecision:true,satisfiedDependency:false
};
export function validHighlightConfiguration(value:unknown):value is Record<AutomaticHighlightCategory,boolean>{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return Object.keys(v).sort().join(",")===([...automaticHighlightCategories].sort().join(","))&&automaticHighlightCategories.every(k=>typeof v[k]==="boolean");
}
