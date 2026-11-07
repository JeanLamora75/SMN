type Locale="fr"|"en";
type RowDefinition={
 source:string;fr:string;en:string;fields:readonly string[];
};
type ScalarDefinition={key:string;fr:string;en:string;noteFr?:string;noteEn?:string};
type ChartDefinition={type:string;fr:string;en:string;example:string;noteFr:string;noteEn:string};

export const officeRowDefinitions:readonly RowDefinition[]=[
 {source:"MEMBERS",fr:"Membres de l'équipe",en:"Team members",
  fields:["MEMBER_NAME","MEMBER_ROLE","MEMBER_START","MEMBER_END"]},
 {source:"INDICATORS",fr:"Indicateurs dynamiques",en:"Dynamic indicators",
  fields:["INDICATOR_NAME","INDICATOR_TAG","INDICATOR_VALUE","INDICATOR_UNIT"]},
 {source:"RISKS",fr:"Risques",en:"Risks",
  fields:["RISK_TITLE","RISK_STATUS","RISK_PRIORITY","RISK_DATE"]},
 {source:"OBSTACLES",fr:"Obstacles",en:"Obstacles",
  fields:["OBSTACLE_TITLE","OBSTACLE_STATUS","OBSTACLE_PRIORITY","OBSTACLE_DATE"]},
 {source:"NOTES",fr:"Notes du tableau de bord",en:"Dashboard notes",
  fields:["NOTE_TEXT","NOTE_STATUS","NOTE_DATE"]},
 {source:"CEREMONIES",fr:"Cérémonies et réunions",en:"Ceremonies and meetings",
  fields:["CEREMONY_TITLE","CEREMONY_STATUS","CEREMONY_START","CEREMONY_END","CEREMONY_DURATION"]},
 {source:"GOALS",fr:"Objectifs du sprint",en:"Sprint goals",
  fields:["GOAL_TITLE","GOAL_EVALUATION","GOAL_DESCRIPTION","GOAL_COMMENT"]},
 {source:"ACTIONS",fr:"Actions",en:"Actions",
  fields:["ACTION_TITLE","ACTION_STATUS","ACTION_PRIORITY","ACTION_DATE"]},
 {source:"DECISIONS",fr:"Décisions",en:"Decisions",
  fields:["DECISION_TITLE","DECISION_STATUS","DECISION_PRIORITY","DECISION_DATE"]}
];
export const officeScalarDefinitions:readonly ScalarDefinition[]=[
 {key:"TEAM_NAME",fr:"Nom de l'équipe",en:"Team name"},
 {key:"SPRINT_NAME",fr:"Nom du sprint sélectionné",en:"Selected sprint name"},
 {key:"SPRINT_START",fr:"Date de début du sprint",en:"Sprint start date"},
 {key:"SPRINT_END",fr:"Date de fin du sprint",en:"Sprint end date"},
 {key:"TODAY",fr:"Date de génération du document",en:"Document generation date",
  noteFr:"Selon le fuseau horaire du sprint",noteEn:"In the sprint timezone"},
 {key:"SPRINT_STATUS",fr:"Statut du sprint",en:"Sprint status"},
 {key:"SPRINT_GOAL",fr:"Tous les intitulés d'objectifs du sprint",en:"All sprint goal titles",
  noteFr:"Séparés par « ; » ; issus du snapshot si le sprint est clôturé",
  noteEn:"Separated with « ; »; sourced from the closure snapshot for closed sprints"},
 {key:"PRODUCT_NAME",fr:"Nom du produit associé à l'équipe",en:"Product associated with the team"},
 {key:"PRODUCT_GOAL",fr:"Objectif du produit (contexte de l'équipe)",en:"Product goal (team context)"},
 {key:"PRODUCT_VISION",fr:"Vision du produit (contexte de l'équipe)",en:"Product vision (team context)"},
 {key:"INDICATOR_<TAG>",fr:"Valeur d'un indicateur actif de l'équipe",en:"Value of an active team indicator",
  noteFr:"Remplacer <TAG> par le tag réel du catalogue, par exemple INDICATOR_VELOCITY",
  noteEn:"Replace <TAG> with the actual catalog tag, e.g. INDICATOR_VELOCITY"}
];
export const officeChartDefinitions:readonly ChartDefinition[]=[
 {type:"bar",fr:"Barres",en:"Bars",
  example:"{{CHART:TREND|TYPE=bar|TAGS=SP_DONE|LAST=6}}",
  noteFr:"Valeurs par sprint",noteEn:"Values by sprint"},
 {type:"line",fr:"Courbes",en:"Lines",
  example:"{{CHART:TREND|TYPE=line|TAGS=SP_DONE,SP_INIT|LAST=6}}",
  noteFr:"Une ou plusieurs séries de même unité",noteEn:"One or more series with the same unit"},
 {type:"area",fr:"Aires remplies",en:"Filled areas",
  example:"{{CHART:TREND|TYPE=area|TAGS=SP_DONE|LAST=6}}",
  noteFr:"Évolution sur les sprints",noteEn:"Evolution across sprints"},
 {type:"pie",fr:"Secteurs",en:"Pie",
  example:"{{CHART:TREND|TYPE=pie|TAGS=SP_DONE,SP_INIT}}",
  noteFr:"Répartition des valeurs du sprint sélectionné ; valeurs négatives refusées",
  noteEn:"Selected sprint values; negative values rejected"},
 {type:"donut",fr:"Anneau",en:"Donut",
  example:"{{CHART:TREND|TYPE=donut|TAGS=SP_DONE,SP_INIT}}",
  noteFr:"Répartition des valeurs du sprint sélectionné",
  noteEn:"Breakdown of selected sprint values"},
 {type:"gauge",fr:"Jauge",en:"Gauge",
  example:"{{CHART:TREND|TYPE=gauge|TAGS=RATE_PERCENT}}",
  noteFr:"Une seule valeur, comprise entre 0 et 100",
  noteEn:"Exactly one value between 0 and 100"}
];
const mark=(key:string)=>"{{"+key+"}}";
export default function OfficeTags({locale="fr",expanded=false}:{locale?:Locale;expanded?:boolean}){
 const fr=locale==="fr";
 return <details className="border rounded-3 p-3 my-3" id="smn-office-tags" open={expanded}>
  <summary className="fw-semibold">
   {fr?"Documentation des tags — Word et PowerPoint":"Tag documentation — Word and PowerPoint"}
  </summary>
  <p className="text-secondary small mt-3">
   {fr?"Ces tags sont utilisables dans les modèles DOCX et PPTX pour l'équipe et le sprint sélectionnés. La génération conserve les éléments fixes du modèle pour les structures Office prises en charge.":
    "Use these tags in DOCX and PPTX templates for the selected team and sprint. Generation preserves fixed template content for supported Office structures."}
  </p>
  <h4 className="h6 mt-3">{fr?"1. Informations simples et indicateurs":"1. Scalar values and indicators"}</h4>
  <p className="small">
   {fr?"Insérer directement un tag dans un paragraphe Word ou dans une zone de texte PowerPoint. Plusieurs tags peuvent se trouver dans le même paragraphe.":
    "Place a tag directly inside a Word paragraph or PowerPoint text box. Multiple scalar tags can share a paragraph."}
  </p>
  <div className="table-responsive">
   <table className="table table-sm table-striped align-middle">
    <thead><tr><th scope="col">Tag</th><th scope="col">{fr?"Information":"Meaning"}</th></tr></thead>
    <tbody>{officeScalarDefinitions.map(item=><tr key={item.key}>
     <td><code>{mark(item.key)}</code></td>
     <td>{fr?item.fr:item.en}{(fr?item.noteFr:item.noteEn)&&
      <div className="small text-secondary">{fr?item.noteFr:item.noteEn}</div>}</td>
    </tr>)}</tbody>
   </table>
  </div>
  <h4 className="h6 mt-3">{fr?"2. Tableaux de données métier":"2. Business data tables"}</h4>
  <p className="small">
   {fr?"Dans le modèle, créer un tableau puis placer un marqueur {{ROW:SOURCE}} dans sa ligne d'exemple. Ajouter les champs voulus dans les cellules de cette même ligne. SMN reproduit la ligne pour chaque élément du sprint, en conservant sa mise en forme compatible.":
    "Create a table in the template and place a {{ROW:SOURCE}} marker in its sample row. Add the desired fields in the cells of that row. SMN repeats the row for each item in the sprint, retaining supported formatting."}
  </p>
  <div className="table-responsive">
   <table className="table table-sm table-striped align-middle">
    <thead><tr><th scope="col">{fr?"Famille":"Family"}</th>
     <th scope="col">{fr?"Marqueur de ligne":"Row marker"}</th>
     <th scope="col">{fr?"Tags de colonnes":"Column tags"}</th></tr></thead>
    <tbody>{officeRowDefinitions.map(item=><tr key={item.source}>
     <th scope="row">{fr?item.fr:item.en}</th>
     <td><code>{mark("ROW:"+item.source)}</code></td>
     <td>{item.fields.map((field,index)=><span key={field}>
      {index>0?", ":""}<code>{mark(field)}</code>
     </span>)}</td>
    </tr>)}</tbody>
   </table>
  </div>
  <p className="small">
   {fr?"Exemple de ligne de tableau pour les risques :":"Example of a risk table row:"}
   {" "}<code>{mark("ROW:RISKS")+mark("RISK_TITLE")}</code>
   {" · "}<code>{mark("RISK_STATUS")}</code>
   {" · "}<code>{mark("RISK_PRIORITY")}</code>
  </p>
  <h4 className="h6 mt-3">{fr?"3. Graphiques de tendances en image PNG":"3. Trend charts as PNG images"}</h4>
  <p className="small">
   {fr?"Le tag graphique doit être seul dans son paragraphe Word ou sa zone de texte PowerPoint. Aucun graphique préconfiguré n'est nécessaire. La légende utilise les indicateurs du catalogue SMN.":
    "The chart tag must be alone in its Word paragraph or PowerPoint text box. No preconfigured chart is required. The legend uses SMN catalog indicators."}
  </p>
  <p className="small">{fr?"Sans paramètres :":"Without parameters:"} <code>{mark("CHART:TREND")}</code>.
   {" "}{fr?"Par défaut : barres, six derniers sprints et premier indicateur disponible.":"Default: bars, six recent sprints and the first available indicator."}</p>
  <div className="table-responsive">
   <table className="table table-sm align-middle">
    <thead><tr><th scope="col">{fr?"Type":"Type"}</th><th scope="col">{fr?"Exemple à adapter":"Example to customize"}</th><th scope="col">{fr?"Règle":"Rule"}</th></tr></thead>
    <tbody>{officeChartDefinitions.map(item=><tr key={item.type}>
     <th scope="row">{fr?item.fr:item.en}</th>
     <td><code className="text-break">{item.example}</code></td>
     <td>{fr?item.noteFr:item.noteEn}</td>
    </tr>)}</tbody>
   </table>
  </div>
  <p className="small text-secondary">
   {fr?"Paramètres facultatifs : TYPE (bar, line, area, pie, donut, gauge), LAST (1 à 24 sprints), TAGS (1 à 6 indicateurs disponibles, de même unité). Remplacez les exemples SP_DONE, SP_INIT et RATE_PERCENT par les tags de votre catalogue. La jauge exige une seule série en pourcentage.":
    "Optional parameters: TYPE (bar, line, area, pie, donut, gauge), LAST (1 to 24 sprints), TAGS (1 to 6 available indicators sharing the same unit). Replace sample tags SP_DONE, SP_INIT and RATE_PERCENT with tags from your own catalog. Gauges require exactly one percentage series."}
  </p>
  <h4 className="h6 mt-3">{fr?"4. Règles de génération et limites":"4. Generation rules and limits"}</h4>
  <ul className="small mb-0">
   <li>{fr?"Donnée reconnue absente : N/D ; zéro reste 0. Les tags inconnus restent inchangés.":"A missing recognized value becomes N/D; zero remains 0. Unknown tags stay unchanged."}</li>
   <li>{fr?"SPRINT_GOAL rassemble les intitulés de tous les objectifs ; ROW:GOALS restitue une ligne par objectif, avec son évaluation.":"SPRINT_GOAL joins all goal titles; ROW:GOALS creates one row per goal, including its evaluation."}</li>
   <li>{fr?"TODAY utilise la date de génération dans le fuseau horaire du sprint ; les dates suivent la langue FR/EN choisie.":"TODAY uses the generation date in the sprint timezone; dates use the selected FR/EN language."}</li>
   <li>{fr?"PRODUCT_GOAL et PRODUCT_VISION proviennent du contexte de l'équipe. NOTES correspond aux notes du tableau de bord du sprint, pas aux notes libres du brouillon de rapport.":"PRODUCT_GOAL and PRODUCT_VISION come from team context. NOTES refers to sprint dashboard notes, not free-form report draft notes."}</li>
   <li>{fr?"Les données de tableaux portent sur un sprint sélectionné ; il n'existe pas encore de consolidation automatique de plusieurs sprints pour ces listes.":"Table rows cover one selected sprint; automatic multi-sprint consolidation for these lists is not yet supported."}</li>
   <li>{fr?"Les fusions verticales, tableaux imbriqués et certains modèles Open XML complexes ne sont pas pris en charge. Les recettes visuelles Microsoft Office restent nécessaires.":"Vertical merges, nested tables and some complex Open XML templates are unsupported. Microsoft Office visual validation is still required."}</li>
  </ul>
 </details>;

}
