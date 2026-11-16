export type BriefMode="scrum"|"kanban";
export type CollectiveBriefField=
 |"cycle.name"|"cycle.dates"|"cycle.status"|"team.name"|"product.name"
 |"objectives"|"risks"|"dependencies"|"decisions"
 |"scrum.storyPoints.committed"|"scrum.storyPoints.completed"|"scrum.capacity.planned"
 |"kanban.started"|"kanban.wip"|"kanban.throughput"|"kanban.cycleTime"|"kanban.leadTime"|"kanban.capacity.planned";

export type InitialBriefTemplate={
 id:"cycle-review"|"trends"|"risks-dependencies";
 title:string;description:string;promptText:string;
};

/** Builtin templates are immutable resources. They do not require a database row. */
export const initialBriefTemplates:readonly InitialBriefTemplate[]=[
 {id:"cycle-review",title:"Bilan du cycle",description:"Synthèse factuelle des résultats et enseignements du cycle",
  promptText:[
   "Rédige un bilan collectif du cycle {{SPRINT_NAME}} pour l'équipe {{TEAM_NAME}}.",
   "Période : {{SPRINT_START}} — {{SPRINT_END}}. État : {{SPRINT_STATUS}}.",
   "Produit : {{PRODUCT_NAME}}.",
   "",
   "Analyse les résultats disponibles et leurs éventuels écarts.",
   "Données et indicateurs collectifs :",
   "{{ROW:INDICATORS}}",
   "",
   "Quels résultats sont étayés par les données disponibles ?",
   "Quels écarts méritent une investigation ?",
   "Distingue les faits des interprétations et ne conclus jamais à partir d'une métrique absente."
  ].join("\n")},
 {id:"trends",title:"Tendances",description:"Évolution de la performance collective sans évaluation individuelle",
  promptText:[
   "Analyse les tendances collectives pour l'équipe {{TEAM_NAME}}, cycle {{SPRINT_NAME}}.",
   "Dates : {{SPRINT_START}} — {{SPRINT_END}}.",
   "Métriques disponibles :",
   "{{ROW:INDICATORS}}",
   "Quels changements sont mesurables et quelles informations manquent ?",
   "Ne déduis aucune tendance temporelle à partir d'une seule valeur.",
   "N'extrapole aucune valeur manquante et évite les comparaisons individuelles."
  ].join("\n")},
 {id:"risks-dependencies",title:"Risques et dépendances",description:"Analyse des risques collectifs et dépendances du cycle",
  promptText:[
   "Prépare une analyse des risques et dépendances du cycle {{SPRINT_NAME}} de l'équipe {{TEAM_NAME}}.",
   "Contexte : {{PRODUCT_NAME}}, {{SPRINT_START}} — {{SPRINT_END}}.",
   "Identifie explicitement les risques, dépendances et décisions seulement s'ils sont renseignés dans le texte fourni.",
   "Quels risques collectifs nécessitent un suivi ?",
   "Quelles dépendances pourraient affecter les objectifs ?",
   "Ne divulgue pas d'identité ni de situation individuelle ; n'invente aucune information absente."
  ].join("\n")}
] as const;

const common=new Set<CollectiveBriefField>(["cycle.name","cycle.dates","cycle.status","team.name","product.name","objectives","risks","dependencies","decisions"]);
const scrum=new Set<CollectiveBriefField>(["scrum.storyPoints.committed","scrum.storyPoints.completed","scrum.capacity.planned"]);
const kanban=new Set<CollectiveBriefField>(["kanban.started","kanban.wip","kanban.throughput","kanban.cycleTime","kanban.leadTime","kanban.capacity.planned"]);

export function allowedBriefFields(mode:BriefMode,fields:readonly string[]):CollectiveBriefField[]{
 const modeFields=mode==="scrum"?scrum:kanban;
 return [...new Set(fields)].filter((field):field is CollectiveBriefField=>
  common.has(field as CollectiveBriefField)||modeFields.has(field as CollectiveBriefField));
}
export function initialBriefTemplate(id:string){return initialBriefTemplates.find(t=>t.id===id)??null;}
