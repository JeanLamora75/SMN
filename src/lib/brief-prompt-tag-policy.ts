import type {OfficeTagFamily} from "./office-tag-builder";

/**
 * The Office catalogue is the source of tag syntax and labels.
 * Briefs only expose fields reviewed for collective, external AI sharing.
 * This whitelist is a disclosure policy, not a duplicated tag catalogue.
 */
const SCALARS=new Set([
 "TEAM_NAME","SPRINT_NAME","SPRINT_START","SPRINT_END",
 "SPRINT_STATUS","SPRINT_GOAL","PRODUCT_NAME","PRODUCT_GOAL","TODAY"
]);
const ROWS=new Set(["GOALS","RISKS","OBSTACLES","INDICATORS","ACTIONS","DECISIONS","DEPENDENCIES"]);
export const AI_BRIEF_SAFE_ROW_FIELDS=new Set([
 "GOAL_TITLE","GOAL_EVALUATION","GOAL_DESCRIPTION","GOAL_COMMENT",
 "RISK_TITLE","RISK_STATUS","RISK_PRIORITY","RISK_DATE",
 "DEPENDENCY_TITLE","DEPENDENCY_STATUS","DEPENDENCY_DATE",
 "OBSTACLE_TITLE","OBSTACLE_STATUS","OBSTACLE_PRIORITY","OBSTACLE_DATE",
 "INDICATOR_NAME","INDICATOR_TAG","INDICATOR_VALUE","INDICATOR_UNIT",
 "ACTION_TITLE","ACTION_STATUS","ACTION_PRIORITY","ACTION_DATE",
 "DECISION_TITLE","DECISION_STATUS","DECISION_PRIORITY","DECISION_DATE"
]);
export function canOfferBriefTag(family:OfficeTagFamily,key:string,teamId:string|null):boolean{
 if(family==="scalar")return SCALARS.has(key);
 if(family==="row")return ROWS.has(key);
 // The editor has no cycle/team context. Resolution is checked in the brief
 // preparation flow, which may eventually support selected team indicators.
 if(family==="indicator")return !!teamId&&/^[A-Z][A-Z0-9_]*$/.test(key);
 return false; // Charts generate images, never usable in plain text.
}
export function briefTagRestriction(family:OfficeTagFamily,key:string,teamId:string|null):
 "chart"|"team"|"privacy"|"allowed"{
 if(family==="chart")return "chart";
 if(family==="indicator"&&!teamId)return "team";
 return canOfferBriefTag(family,key,teamId)?"allowed":"privacy";
}
