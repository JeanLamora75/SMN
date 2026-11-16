/** Built-in prompt texts are local resources, not database rows or global i18n strings. */
const en={
 "cycle-review":{
  title:"Cycle review",description:"Evidence-based summary of cycle results and lessons learned",
  promptText:[
   "Prepare a collective review of cycle {{SPRINT_NAME}} for team {{TEAM_NAME}}.",
   "Period: {{SPRINT_START}} — {{SPRINT_END}}. Status: {{SPRINT_STATUS}}.",
   "Product: {{PRODUCT_NAME}}.",
   "",
   "Analyze available results and any variances.",
   "Collective data and indicators:",
   "{{ROW:INDICATORS}}",
   "",
   "Which results are supported by the available evidence?",
   "Which differences need further investigation?",
   "Distinguish facts from interpretations; never infer results from missing metrics."
  ].join("\n")
 },
 "trends":{
  title:"Trends",description:"Collective performance evolution without individual evaluation",
  promptText:[
   "Analyze collective trends for team {{TEAM_NAME}}, cycle {{SPRINT_NAME}}.",
   "Dates: {{SPRINT_START}} — {{SPRINT_END}}.",
   "Available metrics:",
   "{{ROW:INDICATORS}}",
   "Which changes are measurable, and which information is missing?",
   "Never infer a time trend from a single value.",
   "Do not extrapolate missing values or compare individuals."
  ].join("\n")
 },
 "risks-dependencies":{
  title:"Risks and dependencies",description:"Collective risks and dependencies in the cycle",
  promptText:[
   "Prepare a risks and dependencies analysis for cycle {{SPRINT_NAME}} of team {{TEAM_NAME}}.",
   "Context: {{PRODUCT_NAME}}, {{SPRINT_START}} — {{SPRINT_END}}.",
   "Identify risks, dependencies and decisions only if they are documented in the text provided.",
   "Which collective risks require follow-up?",
   "Which dependencies may affect goals?",
   "Do not disclose personal identities or individual circumstances; do not invent absent information."
  ].join("\n")
 }
} as const;
export function localizedNativeBrief<T extends {id:string;builtin:boolean;title:string;description:string;promptText:string}>(template:T,locale:string):T{
 if(!template.builtin||locale!=="en")return template;
 const translated=en[template.id as keyof typeof en];
 return translated?{...template,...translated}:template;
}
