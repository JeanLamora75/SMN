export type BriefMode="scrum"|"kanban";
export type CollectiveBriefField=
 |"cycle.name"|"cycle.dates"|"cycle.status"|"team.name"|"product.name"
 |"objectives"|"risks"|"dependencies"|"decisions"
 |"scrum.storyPoints.committed"|"scrum.storyPoints.completed"|"scrum.capacity.planned"
 |"kanban.started"|"kanban.wip"|"kanban.throughput"|"kanban.cycleTime"|"kanban.leadTime"|"kanban.capacity.planned";

export type InitialBriefTemplate={
 id:"cycle-review"|"trends"|"risks-dependencies";
 title:string;description:string;promptText:string;sections:readonly string[];
 questions:readonly string[];instructions:readonly string[];
 data:readonly CollectiveBriefField[];
};

export const initialBriefTemplates:readonly InitialBriefTemplate[]=[
 {id:"cycle-review",title:"Bilan du cycle",description:"Synthèse factuelle des résultats et enseignements du cycle",
 promptText:"Analyse le cycle {{SPRINT_NAME}} de l’équipe {{TEAM_NAME}} ({{SPRINT_START}} au {{SPRINT_END}}).\\nObjectifs :\\n{{ROW:GOALS}}\\nIndicateurs disponibles :\\n{{ROW:INDICATORS}}\\nDécisions :\\n{{ROW:DECISIONS}}\\nDistingue les faits et les interprétations. Quels résultats sont étayés et quels écarts méritent une investigation ? N'invente pas les valeurs manquantes.",
 sections:["Contexte","Objectifs","Résultats collectifs","Points de vigilance","Questions"],
 questions:["Quels résultats sont étayés par les données disponibles ?","Quels écarts méritent une investigation ?"],
 instructions:["Distinguer faits et interprétations.","Ne tirer aucune conclusion d'une métrique absente."],
 data:["cycle.name","cycle.dates","cycle.status","team.name","product.name","objectives","decisions","scrum.storyPoints.committed","scrum.storyPoints.completed","kanban.throughput"]},
 {id:"trends",title:"Tendances",description:"Évolution de la performance collective sans évaluation individuelle",
 promptText:"Étudie les tendances collectives pour {{TEAM_NAME}} et le cycle {{SPRINT_NAME}}.\\nIndicateurs disponibles :\\n{{ROW:INDICATORS}}\\nQuels changements sont mesurables ? Quelles informations manquent ? N'extrapole pas, évite les comparaisons individuelles et ne déduis aucune évolution temporelle sans séries historiques explicites.",
 sections:["Périmètre","Métriques disponibles","Tendances observables","Questions"],
 questions:["Quels changements sont mesurables ?","Quelles informations manquent pour interpréter les évolutions ?"],
 instructions:["Ne pas extrapoler les valeurs manquantes.","Éviter les comparaisons individuelles."],
 data:["cycle.name","cycle.dates","team.name","scrum.storyPoints.completed","scrum.capacity.planned","kanban.throughput","kanban.cycleTime","kanban.leadTime"]},
 {id:"risks-dependencies",title:"Risques et dépendances",description:"Analyse des risques collectifs et dépendances du cycle",
 promptText:"Analyse les risques et dépendances du cycle {{SPRINT_NAME}} pour {{TEAM_NAME}}.\\nObjectifs :\\n{{ROW:GOALS}}\\nRisques :\\n{{ROW:RISKS}}\\nDépendances :\\n{{ROW:DEPENDENCIES}}\\nDécisions :\\n{{ROW:DECISIONS}}\\nQuels risques exigent un suivi et quelles dépendances menacent les objectifs ? Utilise seulement les faits consignés, sans divulguer d'information individuelle.",
 sections:["Contexte","Risques","Dépendances","Décisions","Questions"],
 questions:["Quels risques collectifs nécessitent un suivi ?","Quelles dépendances pourraient affecter les objectifs ?"],
 instructions:["Utiliser uniquement les risques et dépendances effectivement consignés.","Ne pas divulguer d'identité ou de situation individuelle."],
 data:["cycle.name","cycle.dates","team.name","objectives","risks","dependencies","decisions"]}
] as const;

const common=new Set<CollectiveBriefField>(["cycle.name","cycle.dates","cycle.status","team.name","product.name","objectives","risks","dependencies","decisions"]);
const scrum=new Set<CollectiveBriefField>(["scrum.storyPoints.committed","scrum.storyPoints.completed","scrum.capacity.planned"]);
const kanban=new Set<CollectiveBriefField>(["kanban.started","kanban.wip","kanban.throughput","kanban.cycleTime","kanban.leadTime","kanban.capacity.planned"]);

export function allowedBriefFields(mode:BriefMode,fields:readonly string[]):CollectiveBriefField[]{
 const modeFields=mode==="scrum"?scrum:kanban;
 return [...new Set(fields)].filter((field):field is CollectiveBriefField=>
  common.has(field as CollectiveBriefField)||modeFields.has(field as CollectiveBriefField));
}
export function projectCollectiveBriefFacts(mode:BriefMode,requested:readonly string[],facts:Record<string,unknown>):Record<string,string|number|boolean>{
 const result:Record<string,string|number|boolean>={};
 for(const key of allowedBriefFields(mode,requested)){
  const value=facts[key];
  if(typeof value==="string"&&value.trim()||typeof value==="number"&&Number.isFinite(value)||typeof value==="boolean")
   result[key]=value as string|number|boolean;
 }
 return result;
}
export function initialBriefTemplate(id:string){return initialBriefTemplates.find(t=>t.id===id)??null;}
